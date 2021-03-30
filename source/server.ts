import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import router from './routes';
import dbConnection from './models';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { RoomInformation } from './lib/interfaces';
import {
  getClients,
  getCurrentPlayer,
  getCurrentPlayerUserName,
  getCurrentPlayers,
  getCurrentRoom,
  getCurrentTiles,
  getTilesRemaining,
  getCurrentReady
} from './lib/socket/roomInformationHelpers';
import { buildBunch, shuffleBunch } from './lib/utils';
import { tileSet } from './lib/tileset';
import { socketRoomInformation } from './lib/socket/roomInformation';

const app = express();
const socketServer = new http.Server(app);

const io = new Server(socketServer, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use('/', router);

// const socketRoomInformation: any = {};
// NOTE: { gameRoomCode:
// NOTE:     players: [...players],
// NOTE:     playersReady: [...players],
// NOTE:     active: true | false,
// NOTE:     clients: {
// NOTE:        socket.id: {
// NOTE:          username, 
// NOTE:          isHost, 
// NOTE:          socket: socket.id, 
// NOTE:        } 
// NOTE: }

io.on('connection', (socket: Socket) => {
  let ROOM_ID: string;
  let ROOM_USER: string;
  const ROOM_SIZE: number = 8;

  // Disconnects player when tab/window is closed
  socket.on('disconnect', (reason) => {
    try {
      socket.leave(ROOM_ID);
      handleLeaveGame(ROOM_ID);
    } catch (err) {
      console.error(err);
    }
  });

  socket.on('tileCheck', () => {
    console.log(socketRoomInformation);
  });

  // TODO: Refactor repeated code(currentRoom/currentPlayer) into a helper function
  const handlePlayerReady = (gameRoomCode: string) => {
    const currentPlayer = getCurrentPlayerUserName(gameRoomCode, socket.id);
    const currentPlayers = getCurrentPlayers(gameRoomCode);
    const currentReady = getCurrentReady(gameRoomCode);
    if (!currentReady.includes(currentPlayer)) {
      currentReady.push(currentPlayer);
      io.in(gameRoomCode).emit('playerReadyResponse', currentReady);
    };

    if (currentPlayers || currentReady) {
      if (currentPlayers.length === 1 || currentPlayers.length > currentReady.length) {
        io.in(gameRoomCode).emit('roomReadyResponse', false);
      } else if (currentPlayers.length === currentReady.length) {
        io.in(gameRoomCode).emit('roomReadyResponse', true);
      }
    };
  };

  const handleHost = (gameRoomCode: string) => {
    const currentPlayer = getCurrentPlayer(gameRoomCode, socket.id);
    const isHost = currentPlayer?.host;
    socket.emit('hostResponse', isHost);
  };

  const handlePrivateGame = ({ gameRoomCode, userName }: RoomInformation, socketResponse: Function) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;
    // TODO: Rejoin if possible, or start new game
    socketResponse(true);

    socketRoomInformation[gameRoomCode] = {
      players: [userName],
      playersReady: [],
      active: false,
      clients: {
        [socket.id]: { 
          userName,
          host: true,
          clientID: socket.id
        }
      }
    };
    
    socket.join(gameRoomCode);
    io.in(gameRoomCode).emit('playersInRoom', [userName]);
    io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} is Host`);
    console.log('Create Game', socketRoomInformation);
  };

  // Join Private Game (Currently)
  const handleJoinGame = ({ gameRoomCode, userName }: RoomInformation, socketResponse: Function) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;

    const currentRoom = getCurrentRoom(gameRoomCode);
    const currentPlayers = getCurrentPlayers(gameRoomCode);
    const clients = getClients(gameRoomCode);

    if (!currentRoom) return;
    if (currentRoom.active) {
      socketResponse('Game Active');
    } else if (Object.keys(clients).length === 0) {
      socketResponse('No Room');
    } else if (Object.keys(clients).length >= ROOM_SIZE) {
      socketResponse('Room Full');
    } else {
      currentPlayers.push(userName);
      socketRoomInformation[gameRoomCode] = {
        ...socketRoomInformation[gameRoomCode],
        clients: {
          ...socketRoomInformation[gameRoomCode].clients,
          [socket.id]: { 
            userName,
            host: false,
            clientID: socket.id,
          }
        }
      };
      socket.join(gameRoomCode);
      io.in(gameRoomCode).emit('playersInRoom', currentPlayers);
      io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} Joined`);
      socketResponse('Joining');
    }
  };
  
  const handleEnteredRoom = (gameRoomCode: string) => {
    io.in(gameRoomCode).emit('playersInRoom', getCurrentPlayers(gameRoomCode));
  };

  const handleStartGame = (gameRoomCode: string) => {
    const bunch = shuffleBunch(buildBunch(tileSet));
    socketRoomInformation[gameRoomCode] = {
      ...socketRoomInformation[gameRoomCode],
      active: true,
      roomTileSet: bunch,
    };

    const clients = getClients(gameRoomCode);
    const tilesObject: any = {};

    let numberOfTiles = 0;
    const currentPlayers = getCurrentPlayers(gameRoomCode);
    const playersInRoom = currentPlayers.length;
    if (playersInRoom < 5) {
      numberOfTiles = 21;
    } else if (playersInRoom < 7) {
      numberOfTiles = 15;
    } else {
      numberOfTiles = 11;
    };

    // TODO: Change to numberOfTiles
    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, 5);
    });

    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
    io.in(gameRoomCode).emit('actionMessage', 'Banana!!!');
  };

  const handlePeelAction = (gameRoomCode: string) => {
    const clients = getClients(gameRoomCode);
    const tilesObject: any = {};

    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, 1);
    })

    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
    io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} Peeled! +1`);
  };

  const handleDumpAction = ({ id, tileToDump }: any) => {
    const currentTiles = getCurrentTiles(id);
    const tilesObject: any = {};

    console.log(tileToDump, 'dumping tile, going back');
    currentTiles.push(tileToDump);

    tilesObject[socket.id] = getTiles(id, 3);

    console.log(tilesObject, 'dump tiles');
    socket.emit('receiveTiles', tilesObject);
    io.in(id).emit('tilesRemaining', getTilesRemaining(id));
    io.in(id).emit('actionMessage', `${getCurrentPlayerUserName(id, socket.id)} Dumped..`)
  };

  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    const currentRoom = getCurrentRoom(gameRoomCode);
    const playersInRoom = getCurrentPlayers(gameRoomCode);
    const userName = getCurrentPlayerUserName(gameRoomCode, socket.id);
    const index = playersInRoom?.indexOf(ROOM_USER);
    
    if (currentRoom) {
      delete currentRoom.clients[socket.id];
    };

    if (index >= 0) {
      playersInRoom.splice(index, 1);
      io.in(gameRoomCode).emit('playersInRoom', playersInRoom)
    } else {
      console.log('No player');
    };
    io.in(gameRoomCode).emit('actionMessage', `${userName} Left`)
  };

  const getTiles = (gameRoomCode: string, numberOfTiles: number) => {
    const currentTiles = getCurrentTiles(gameRoomCode);
    return currentTiles.splice(0, numberOfTiles);
  };

  // TODO: TS Enums -- can convert on refactor
  socket.on('hostSearch', handleHost);
  socket.on('enteredRoom', handleEnteredRoom);
  socket.on('playerReady', handlePlayerReady);
  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
  socket.on('startGame', handleStartGame);
  socket.on('peelAction', handlePeelAction);
  socket.on('dumpAction', handleDumpAction);
  socket.on('leaveGame', handleLeaveGame);
});

app.get('*', (_, res) => {
  res.status(400).send('Sorry, no page found :`(');
});

const PORT = process.env.PORT || 4200;
(async () => {
  try {
    await dbConnection;
    console.log('Mongoose Connected');

    app.listen(PORT, () => {
      console.log(`Express Server lives at ${PORT}`);
    });

    socketServer.listen(4300, () => {
      console.log(`Socket Server lives at 4300`);
    })
  } catch (err) {
    console.log('Error:', err)
  }
})();

export default app;