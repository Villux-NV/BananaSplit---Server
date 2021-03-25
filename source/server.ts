import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

import http from 'http';
import { Server, Socket } from 'socket.io';
import { RoomInformation } from './lib/interfaces';

dotenv.config();

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
    socket.leave(ROOM_ID);
    handleLeaveGame(ROOM_ID);
  });

  // For front end to update players in room
  const handleGetPlayers = (code: string) => {
    const currentRoom = socketRoomInformation[code];
    const playersInRoom = currentRoom?.players;
    socket.emit('playersInRoom', playersInRoom);
  };

  // Create Private Game
  const handlePrivateGame = ({ gameRoomCode, userName }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    // TODO: Rejoin if possible, or start new game
    allRooms[socket.id] = gameRoomCode;
    socket.emit('gameRoomCreated', true);

    socketRoomInformation[gameRoomCode] = {
      players: [userName],
      [socket.id]: { 
        userName,
        isReady: false,
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
        socket.emit('joinGameResponse', { res: 'No Room', userName });
      } else if (Object.keys(currentRoom).length >= ROOM_SIZE) {
        console.log('Room Full');
        socket.emit('joinGameResponse', { res: 'Room Full', userName });
      } else {
        socket.emit('joinGameResponse', { res: 'Joining', userName });
        currentPlayers.push(userName);
        socketRoomInformation[gameRoomCode] = {
          ...socketRoomInformation[gameRoomCode],
          [socket.id]: { 
            userName,
            isReady: false,
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
    const playersInRoom = currentRoom.players;
    const index = playersInRoom?.indexOf(ROOM_USER);
    delete currentRoom[socket.id];

    if (index >= 0) {
      playersInRoom.splice(index, 1);
    } else {
      console.log('No player');
    }
  };

  socket.on('getPlayersInRoom', handleGetPlayers);
  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
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