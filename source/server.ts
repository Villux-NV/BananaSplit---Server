import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import router from './routes';
import dbConnection from './models';
import http from 'http';
import { Server, Socket } from 'socket.io';
// import { getOneTile, storeTilesCtrl } from './lib/utils';
import { RoomInformation } from './lib/interfaces';


const mockBunch = [
  ['A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A', 'A'],
  ['B', 'B', 'B'],
  ['C', 'C', 'C'],
  ['D', 'D', 'D', 'D', 'D', 'D'],
  ['E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E'],
  ['F', 'F', 'F'],
  ['G', 'G', 'G', 'G'],
  ['H', 'H', 'H'],
  ['I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I', 'I'],
  ['J', 'J'],
  ['K', 'K'],
  ['L', 'L', 'L', 'L', 'L'],
  ['M', 'M', 'M'],
  ['N', 'N', 'N', 'N', 'N', 'N', 'N', 'N'],
  ['O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O', 'O'],
  ['P', 'P', 'P'],
  ['Q', 'Q'],
  ['R', 'R', 'R', 'R', 'R', 'R', 'R', 'R', 'R'],
  ['S', 'S', 'S', 'S', 'S', 'S'],
  ['T', 'T', 'T', 'T', 'T', 'T', 'T', 'T', 'T'],
  ['U', 'U', 'U', 'U', 'U', 'U'],
  ['V', 'V', 'V'],
  ['W', 'W', 'W'],
  ['X', 'X'],
  ['Y', 'Y', 'Y'],
  ['Z', 'Z'],
];

let bunch: any[] = [];
for (let i = 0; i < mockBunch.length; i++) {
  for (let j = 0; j < mockBunch[i].length; j++) {
    bunch.push({ tile: mockBunch[i][j], id: Object.keys(bunch).length });
  }
};

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
// NOTE:     socket.id: {
// NOTE:       username, 
// NOTE:       isReady, 
// NOTE:       gameState/logic, 
// NOTE:     } 
// NOTE: }
const allRooms: any = {}; // {socket.id: gameRoomCode} 

// NOTE: io.on == server instance // socket == client connected
io.on('connection', (socket: Socket) => {
  let ROOM_ID: string;
  let ROOM_USER: string;
  const ROOM_SIZE: number = 8;
  // NOTE: Socket.emit -> Sends to client/single user
  // socket.broadcast.emit -> Everyone but user
  socket.emit('message', 'Welcome to Banana/Split');
  socket.broadcast.emit('message', `Player has joined`);

  // Disconnects player when tab/window is closed
  socket.on('disconnect', (reason) => {
    try {
      socket.leave(ROOM_ID);
      handleLeaveGame(ROOM_ID);
    } catch (err) {
      console.error(err);
    }
  });

  // For front end to update players in room
  const handleGetPlayers = (code: string) => {
    const currentRoom = socketRoomInformation[code];
    const playersInRoom = currentRoom?.players;
    socket.emit('playersInRoom', playersInRoom);
  };

  // TODO: Need logic if pressed multiple times--Press Once || unready when pressed
  const handlePlayerReady = (gameRoomCode: string) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayer = currentRoom[socket.id].userName;
    const currentReady = currentRoom.playersReady;
    currentReady.push(currentPlayer);
    console.log(currentRoom);
  };

  const handleRoomReady = (gameRoomCode: string) => {
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayers = currentRoom?.players;
    const currentReady = currentRoom?.playersReady;

    if (currentPlayers || currentReady) {
      if (currentPlayers.length === 1 || currentPlayers.length > currentReady.length) {
        socket.emit('isRoomReady', false);
      } else if (currentPlayers.length === currentReady.length) {
        socket.emit('isRoomReady', true);
      };
    };
  };

  // Create Private Game
  const handlePrivateGame = ({ gameRoomCode, userName }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;
    // TODO: Rejoin if possible, or start new game
    allRooms[socket.id] = gameRoomCode;
    socket.emit('gameRoomCreated', true);

    socketRoomInformation[gameRoomCode] = {
      players: [userName],
      playersReady: [],
      host: [userName],
      // NOTE: May not be needed anymore
      [socket.id]: { 
        userName,
        host: true,
      }
    };
    
    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentSocket = currentRoom[socket.id];
    const currentPlayer = currentSocket.userName;

    socket.emit('gameRoomCreator', currentPlayer);
    socket.join(gameRoomCode);
    console.log('Socket Rooms', socketRoomInformation);
  };

  // Join Private Game (Currently)
  const handleJoinGame = ({ gameRoomCode, userName }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;

    const currentRoom = socketRoomInformation[gameRoomCode];
    const currentPlayers = currentRoom.players;

    if (currentRoom) {
      if (Object.keys(currentRoom).length === 0 || !currentRoom) {
        console.log('No Room');
        socket.emit('joinGameResponse', { res: 'No Room' });
      } else if (Object.keys(currentRoom).length >= ROOM_SIZE) {
        console.log('Room Full');
        socket.emit('joinGameResponse', { res: 'Room Full' });
      } else {
        socket.emit('joinGameResponse', { res: 'Joining' });
        currentPlayers.push(userName);
        socketRoomInformation[gameRoomCode] = {
          ...socketRoomInformation[gameRoomCode],
          [socket.id]: { 
            userName,
          }
        };
        socket.join(gameRoomCode);
        console.log('Socket Rooms', socketRoomInformation);
      }
    }
  };

  // Leave Game - removes player from room and individual room
  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    const currentRoom = socketRoomInformation[gameRoomCode];
    const playersInRoom = currentRoom?.players;
    const index = playersInRoom?.indexOf(ROOM_USER);
    
    if (currentRoom) {
      delete currentRoom[socket.id];
    };

    if (index >= 0) {
      playersInRoom.splice(index, 1);
    } else {
      console.log('No player');
    };
  };

  socket.on('getPlayersInRoom', handleGetPlayers);
  socket.on('playerReady', handlePlayerReady);
  socket.on('roomReady', handleRoomReady);
  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
  socket.on('leaveGame', handleLeaveGame);

  // socket.on('store', function () {
  //   socket.emit('stored', storeTilesCtrl(bunch));
  // });
  // socket.on('getOneTile', function () {
  //   socket.emit('returnOneTile', getOneTile);
  // });
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