import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

import http from 'http';
import { Server, Socket } from 'socket.io';
import { getGameRoomCode } from './lib/utils';
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

// NOTE: Global State currently -> Will change once proven
// individualRoom -> { gameRoomCode: { players: [...players] } }
// allRooms -> { socket.id: gameRoomCode } 
const individualRoom: any = {};
const allRooms: any = {};

// io.on is the server instance, socket is the client connected
io.on('connection', (socket: Socket) => {
  let ROOM_ID: string;
  let ROOM_USER: string;
  // NOTE: Socket.emit -> Sends to client/single user
  // Socket.broadcast.emit -> Everyone but user
  // io.emit -> Everyone
  socket.emit('message', 'Welcome to Banana/Split');
  socket.broadcast.emit('message', `Player has joined`);

  // TODO: Disconnect player when tab/window is closed
  socket.on('disconnect', (reason) => {
    console.log(reason);
    socket.leave(ROOM_ID);
    handleLeaveGame(ROOM_ID);
  });

  const handleGetPlayer = (code: string) => {
    const currentRoom = individualRoom[code];
    const playersInRoom = currentRoom?.players;
    socket.emit('playersInRoom', playersInRoom);
  };

  // NOTE: Handles creating of private game room
  const handlePrivateGame = ({ gameRoomCode, userName, userID }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    // TODO: Logic for room size
    // TODO: Need logic to check if player has a previous game
    // TODO: Rejoin if possible, or start new game
    // TODO: Add Disconnect logic
    allRooms[socket.id] = gameRoomCode;
    socket.emit('gameRoomCreated', true);
    
    individualRoom[gameRoomCode] = {
      players: [userName]
    };
    
    const currentRoom = individualRoom[gameRoomCode];
    const currentPlayer = currentRoom.players[0];

    socket.emit('gameRoomCreator', currentPlayer);
    console.log(gameRoomCode, 'code before joining');
    socket.join(gameRoomCode);
    console.log(individualRoom, 'room state?');
    console.log('Rooms', socket.rooms);
  };

  const handleJoinGame = ({ gameRoomCode, userName, userID }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;
    // TODO: Check if room has space/available
    // TODO: If room has 0 players, then unknownGame
    // TODO: Join if all prev passed

    const currentRoom = individualRoom[gameRoomCode];
    currentRoom?.players.push(userName);

    socket.emit('playerJoin', { gameRoomCode, currentRoom });
    socket.join(gameRoomCode);
    console.log(individualRoom, 'joining player');
    console.log('Rooms', socket.rooms);
  };

  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    console.log('Left Room', socket.rooms);

    const playersInRoom = individualRoom[gameRoomCode].players;
    const index = playersInRoom.indexOf(ROOM_USER);
    
    if (index >= 0) {
      playersInRoom.splice(index);
    } else {
      console.log('No player');
    }
  };

  socket.on('getPlayersInRoom', handleGetPlayer);
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