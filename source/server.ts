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
const individualRoom: any = {}; // {gameRoomCode: {players: [...players]}}
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
    const currentRoom = individualRoom[code];
    const playersInRoom = currentRoom?.players;
    socket.emit('playersInRoom', playersInRoom);
  };

  // Create Private Game
  const handlePrivateGame = ({ gameRoomCode, userName }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    // TODO: Rejoin if possible, or start new game
    allRooms[socket.id] = gameRoomCode;
    socket.emit('gameRoomCreated', true);

    individualRoom[gameRoomCode] = {
      players: [userName]
    };
    
    const currentRoom = individualRoom[gameRoomCode];
    const currentPlayer = currentRoom.players[0];

    socket.emit('gameRoomCreator', currentPlayer);
    socket.join(gameRoomCode);
    console.log(individualRoom, 'room state?');
  };

  // Join Private Game (Currently)
  const handleJoinGame = ({ gameRoomCode, userName }: RoomInformation) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;

    const currentRoom = individualRoom[gameRoomCode];

    if (currentRoom) {
      if (currentRoom.players.length === 0 || !currentRoom) {
        console.log('No Room');
        socket.emit('joinGameResponse', { res: 'No Room', userName });
      } else if (currentRoom.players.length >= ROOM_SIZE) {
        console.log('Room Full');
        socket.emit('joinGameResponse', { res: 'Room Full', userName });
      } else {
        socket.emit('joinGameResponse', { res: 'Joining', userName });
        currentRoom?.players.push(userName);
        socket.join(gameRoomCode);

        console.log(individualRoom, 'joining player');
        console.log('Rooms', socket.rooms);
      }
    }
  };

  // Leave Game - removes player from room and individual room
  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    const playersInRoom = individualRoom[gameRoomCode]?.players;
    const index = playersInRoom?.indexOf(ROOM_USER);
    
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