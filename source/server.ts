import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import router from './routes';
import dbConnection from './models';

import http from 'http';
import { Server, Socket } from 'socket.io';
import { getGameRoomCode } from './lib/utils';
import { RoomInformation } from './lib/interfaces';
import { Tile } from './models/tile.model';

dotenv.config();

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
for(let i=0; i<mockBunch.length;i++) {
  for (let j=0; j<mockBunch[i].length; j++) {
    bunch.push({ tile: mockBunch[i][j], id: Object.keys(bunch).length });
  }
}

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

io.on('connection', (socket: Socket) => {
  // NOTE: Socket.emit -> Sends to client/single user
  // Socket.broadcast.emit -> Everyone but user
  // io.emit -> Everyone
  socket.emit('init', 'Welcome to Banana/Split');
  socket.broadcast.emit('init', `Player has joined`);
  socket.on('disconnect', () => {
    io.emit('init', 'Player has left');
  });

  const handleGetPlayer = (code: string) => {
    const currentRoom = individualRoom[code];
    const playersInRoom = currentRoom?.players;
    socket.emit('playersInRoom', playersInRoom);
  };

  // NOTE: Handles creating of private game room
  const handlePrivateGame = ({ gameRoomCode, userName, userID }: RoomInformation) => {
    console.log('Private Game Creation', gameRoomCode, userName, userID);

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
    console.log(currentPlayer, 'server current player');

    socket.emit('gameRoomCreator', currentPlayer);
    socket.join(gameRoomCode);
    console.log(individualRoom, 'room state?');
  };

  const handleJoinGame = ({ gameRoomCode, userName, userID }: RoomInformation) => {
    // TODO: Check if room has space/available
    // TODO: If room has 0 players, then unknownGame
    // TODO: Join if all prev passed

    const currentRoom = individualRoom[gameRoomCode];
    currentRoom.players.push(userName);

    socket.emit('playerJoin', { gameRoomCode, currentRoom });
    socket.join(gameRoomCode);
    console.log(individualRoom, 'joining player');
  };
  
  const storeTilesCtrl = async (storeBunch: any) => {
    const store = async (bunchAgain: any) => {
      // const array = [];
      // current issue with Tile creation
      for(let i = 0; i <= Object.keys(bunchAgain).length; i++) {
        for (let j=0; j<bunchAgain[i].length; j++) {
          try {
          const tile = new Tile({ 
             tile_id: bunchAgain[i][j].id, letter: bunchAgain[i][j].tile
          });
          tile.save();
        } catch (err) {
          console.log(`Error in Stroring: ${err}`);
          return { error: 'Storing Error' };
        }
      }
    }
    return bunchAgain;
    };
    try {
      const check = await store(storeBunch); 
      if(check) console.log('stored');
      return true;
    } catch (err) {
      console.log(err);
    } 
  };
  const storeOneTile = async (tile: any) => {
    try {
      const tileToStore = new Tile({ 
        tile_id: tile.id, letter: tile.tile
      });
      tile.save();
      return true;
    } catch (err) {
      console.log(`Error in Stroring single tile: ${err}`);
      return { error: 'Storing Single Tile Error' };
    }
  }
  const getOneTile = async () => {
    const tile  = await Tile.findOneAndRemove({ tile_id: Math.floor(Math.random()*Tile.length) }, {}, (tile) => {
      return tile;
    });
    return tile;
  };
  socket.on('getPlayersInRoom', handleGetPlayer);
  socket.on('privateGame', handlePrivateGame);
  socket.on('joinGame', handleJoinGame);
  
  socket.on('store', function (bunch) {
    socket.emit('stored', storeTilesCtrl(bunch));
  });
  socket.on('getOneTile', function () {
    socket.emit('returnOneTile', getOneTile());
  });
  socket.on('storeOneTile', function (tile) {
    const tileToStore = tile;
    socket.emit('tileStored', storeOneTile(tileToStore));
  });
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