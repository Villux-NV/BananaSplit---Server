import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import router from './routes';
import dbConnection from './models';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { RoomInformation } from './lib/interfaces';
import { buildBunch, shuffleBunch } from './lib/utils';
import { tileSet } from './lib/tileset';

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

// NOTE: Using as local memory - Current for players in room and all room created. 
// NOTE: Could possibly be used for game/state logic
const socketRoomInformation: any = {};
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

// NOTE: io.on == server instance // socket == client connected
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
  const handleGetPlayers = (code: string, socketResponse: Function) => {
    const currentRoom = socketRoomInformation[code];
    const playersInRoom = currentRoom?.players;
    socketResponse(playersInRoom);
  };

  const handleGetPlayersReady = (code: string, socketResponse: Function) => {
    const currentRoom = socketRoomInformation[code];
    const readyPlayers = currentRoom?.playersReady;
    socketResponse(readyPlayers);
  };

  // TODO: Need logic if pressed multiple times--Press Once || unready when pressed
  const handlePlayerReady = (gameRoomCode: string) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayer = currentRoom.clients[socket.id].userName;
    const currentReady = currentRoom.playersReady;
    currentReady.push(currentPlayer);
  };

  const handleRoomReady = (gameRoomCode: string, socketResponse: Function) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayers = currentRoom?.players;
    const currentReady = currentRoom?.playersReady;

    if (currentPlayers || currentReady) {
      if (currentPlayers.length === 1 || currentPlayers.length > currentReady.length) {
        socketResponse(false);
      } else if (currentPlayers.length === currentReady.length) {
        socketResponse(true);
      };
    };
  };

  const handleHost = (gameRoomCode: string, socketResponse: Function) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayer = currentRoom.clients[socket.id];
    const isHost = currentPlayer?.host;
    socketResponse(isHost);
  };

  // Create Private Game
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
    console.log('Socket Rooms', socketRoomInformation);
  };

  // Join Private Game (Currently)
  const handleJoinGame = ({ gameRoomCode, userName }: RoomInformation, socketResponse: Function) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;

    const currentRoom = socketRoomInformation[gameRoomCode];
    console.log(currentRoom, 'why issue');
    const currentPlayers = currentRoom.players;
    const clients = currentRoom.clients;

    if (currentRoom) {
      if (currentRoom.active === true) {
        socketResponse('Game Active');
        console.log('room active', currentRoom);
      } else if (Object.keys(clients).length === 0 || !currentRoom) {
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
        console.log('Socket Rooms', socketRoomInformation);
        socketResponse('Joining');
      }
      console.log('No join', socketRoomInformation);
    }
  };

  const handleStartGame = (gameRoomCode: string) => {
    const bunch = shuffleBunch(buildBunch(tileSet));
    socketRoomInformation[gameRoomCode] = {
      ...socketRoomInformation[gameRoomCode],
      active: true,
      roomTileSet: bunch,
    };

    const currentRoom = socketRoomInformation[gameRoomCode];
    console.log(currentRoom, 'current room');
    const clients = currentRoom.clients;
    const tilesObject: any = {};

    let numberOfTiles = 0;
    const playersInRoom = currentRoom.players.length;
    if (playersInRoom < 5) {
      numberOfTiles = 21;
    } else if (playersInRoom < 7) {
      numberOfTiles = 15;
    } else {
      numberOfTiles = 11;
    };

    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, numberOfTiles);
    });

    console.log('start', currentRoom);
    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
  };

  const handlePeelAction = (gameRoomCode: string) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const clients = currentRoom.clients;
    const tilesObject: any = {};

    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, 1);
    })

    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
  }

  // Leave Game - removes player from room and individual room
  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    const currentRoom = socketRoomInformation[gameRoomCode];
    const playersInRoom = currentRoom?.players;
    const index = playersInRoom?.indexOf(ROOM_USER);
    
    if (currentRoom) {
      delete currentRoom.clients[socket.id];
    };

    if (index >= 0) {
      playersInRoom.splice(index, 1);
    } else {
      console.log('No player');
    };
  };

  const getTiles = (gameRoomCode: string, numberOfTiles: number) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentTiles = currentRoom.roomTileSet;
    return currentTiles.splice(0, numberOfTiles);
  };

  // TODO: TS Enums -- can convert on refactor
  socket.on('hostSearch', handleHost);
  socket.on('getPlayersInRoom', handleGetPlayers);
  socket.on('getPlayersReady', handleGetPlayersReady);
  socket.on('playerReady', handlePlayerReady);
  socket.on('roomReady', handleRoomReady);
  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
  socket.on('startGame', handleStartGame);
  socket.on('peelAction', handlePeelAction);
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

  //   socketServer.listen(PORT, () => {
  //     console.log(`Socket Server lives at 4300`);
  //   })
  // } catch (err) {
  //   console.log('Error:', err)
  // }
})();

export default app;