import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

import http from 'http';
import { Server, Socket } from 'socket.io';
import { getGameRoomCode } from './lib/utils';

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

// NOTE: Placing room state here, will need to extract to outside folder
const state = {};
const gameRooms: any = {};
let clientCounter = 0;

io.on('connection', (socket: Socket) => {
  // NOTE: Sends to client/single user
  socket.emit('init', 'Welcome to Banana/Split');
  // NOTE: Sends to everyone but user
  socket.broadcast.emit('init', `Player has joined`);
  // NOTE: Sends to everyone
  socket.on('disconnect', () => {
    // NOTE: Send to everyone
    io.emit('init', 'Player has left');
  });

  // TODO: Create game rooms and connect to front end
  const handlePrivateGame = (code: string) => {
    console.log('creating private game with: ', code);
    gameRooms[socket.id] = code;
    socket.emit('gameRoomCode', code);

    socket.join(code);
    console.log(gameRooms, 'Rooms Made');
  };

  const handleJoinGame = (code: string) => {
    const room: any = io.sockets.adapter.rooms.get(code);

    let allPlayers;
    if (room) {
      allPlayers = room.sockets;
    }

    let numberClients = 0;
    if (allPlayers) {
      numberClients = Object.keys(allPlayers).length;
    }

    if (numberClients === 0) {
      socket.emit('unknownGame');
      return
    } else if (numberClients > 7) {
      socket.emit('tooManyPlayers');
      return
    } 

    gameRooms[socket.id] = code;
    socket.join(code);

  };

  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
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