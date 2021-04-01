import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import router from './routes';
import dbConnection from './models';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { RoomInformation, GameEnd, TileDocument } from './lib/interfaces';
import {
  socketRoomInformation,
  getClients,
  getCurrentPlayer,
  getCurrentPlayerUserName,
  getCurrentPlayers,
  getCurrentRoom,
  getCurrentTiles,
  getTilesRemaining,
  getCurrentReady,
  getRoomStatus
} from './lib/socket/roomInformationHelpers';
import { buildBunch, shuffleBunch } from './lib/utils';
import { tileSet } from './lib/tileset';

const app = express();
const socketServer = new http.Server(app);

const io = new Server(socketServer, {
  cors: {
    origin: 'https://banana-split-client-nuc6u3gvi-krista-p.vercel.app',
    credentials: true
  }
});

app.use(cors());
app.use(express.json());
app.use('/', router);

io.on('connection', (socket: Socket) => {
  let ROOM_ID: string;
  let ROOM_USER: string;
  const ROOM_SIZE: number = 8;

  socket.on('disconnect', (reason) => {
    try {
      socket.leave(ROOM_ID);
      handleLeaveGame(ROOM_ID);
    } catch (err) {
      console.error(err);
    }
  });

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
    socket.emit('hostResponse', currentPlayer?.host);
  };

  const handleNewHost = (gameRoomCode: string) => {
    const clients = getClients(gameRoomCode);
    const newHostID: any = Object.keys(clients).find(key => clients[key] !== socket.id);

    const newHost = getCurrentPlayer(gameRoomCode, newHostID);
    if (newHost) newHost.host = true;
  }

  const handlePrivateGame = ({ gameRoomCode, userName }: RoomInformation, socketResponse: Function) => {
    ROOM_ID = gameRoomCode;
    ROOM_USER = userName;
    // TODO: Rejoin if possible, or start new game
    socketResponse(true);
    
    const bunch = shuffleBunch(buildBunch(tileSet));
    socketRoomInformation[gameRoomCode] = {
      players: [userName],
      playersReady: [],
      active: false,
      roomTileSet: bunch,
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
    io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} is host`);
  };

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
      io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} joined`);
      socketResponse('Joining');
    }
  };
  
  const handleEnteredRoom = (gameRoomCode: string) => {
    io.in(gameRoomCode).emit('playersInRoom', getCurrentPlayers(gameRoomCode));
    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
  };

  const handleStartGame = (gameRoomCode: string) => {
    socketRoomInformation[gameRoomCode] = {
      ...socketRoomInformation[gameRoomCode],
      active: true,
    };

    const clients: any = getClients(gameRoomCode);
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

    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, numberOfTiles);
    });

    Object.keys(clients).map((client) => {
      clients[client].playerTiles = tilesObject[client];
    });

    io.in(gameRoomCode).emit('roomActive', getRoomStatus(gameRoomCode));
    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
    io.in(gameRoomCode).emit('actionMessage', 'split!!!');
  };

  // TODO: Send priority to person to sent event
  const handlePeelAction = (gameRoomCode: string) => {
    const clients: any = getClients(gameRoomCode);
    const tilesObject: any = {};

    Object.values(clients).map(({ clientID }: any) => {
      tilesObject[clientID] = getTiles(gameRoomCode, 1);
    });

    Object.keys(clients).map((client) => {
      if (tilesObject[client][0]) {
        clients[client].playerTiles.push(tilesObject[client][0]);
      }
    });

    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('receiveTiles', tilesObject);
    io.in(gameRoomCode).emit('actionMessage', `${getCurrentPlayerUserName(gameRoomCode, socket.id)} peeled! +1`);
  };


  const handleDumpAction = ({ id, tileToDump }: GameEnd) => {
    const currentTiles = getCurrentTiles(id);
    const currentPlayer = getCurrentPlayer(id, socket.id);
    const tilesObject: any = {};

    currentTiles.push(tileToDump);

    const dumpTiles = getTiles(id, 3)
    tilesObject[socket.id] = dumpTiles;
    
    let filterTiles = currentPlayer.playerTiles.filter((tile: TileDocument) => tile.id !== tileToDump?.id);
    dumpTiles.map((tile: TileDocument) => {
      filterTiles.push(tile);
    });
    currentPlayer.playerTiles = filterTiles;
    
    socket.emit('receiveTiles', tilesObject);
    io.in(id).emit('tilesRemaining', getTilesRemaining(id));
    io.in(id).emit('actionMessage', `${getCurrentPlayerUserName(id, socket.id)} dumped..`);
  };

  const handleRottenBanana = (gameRoomCode: string) => {
    const userName = getCurrentPlayerUserName(gameRoomCode, socket.id);
    io.in(gameRoomCode).emit('rottenUserName', getCurrentPlayerUserName(gameRoomCode, socket.id));
    handleLeaveGame(gameRoomCode);
    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('actionMessage', `${userName} is a rotten banana!`);
    socket.emit('rottenBananaResponse');
  };

  const handleEndGame = ({ id, longestWord, amountOfWords }: any) => {
    io.in(id).emit('actionMessage', `${getCurrentPlayerUserName(id, socket.id)} won!`);
    io.in(id).emit('endGameResponse', getCurrentPlayerUserName(id, socket.id));
    
    const currentPlayer = getCurrentPlayer(id, socket.id);

    currentPlayer.longest = longestWord;
    currentPlayer.wordCount = amountOfWords;

    socket.in(id).emit('roomWordCheck');
  }

  const handleWordResponse = ({ id, longestWord, amountOfWords }: any) => {
    const currentPlayer = getCurrentPlayer(id, socket.id);

    currentPlayer.longest = longestWord;
    currentPlayer.wordCount = amountOfWords;

    const endLongestWord = getEndLongestWord(id);
    const endMostWords = getEndMostWords(id);

    io.in(id).emit('statCheck', { endLongestWord, endMostWords });
  }

  const handleLeaveGame = (gameRoomCode: string) => {
    socket.leave(gameRoomCode);
    const currentRoom = getCurrentRoom(gameRoomCode);
    const playersInRoom = getCurrentPlayers(gameRoomCode);
    const userName = getCurrentPlayerUserName(gameRoomCode, socket.id);
    const index = playersInRoom?.indexOf(ROOM_USER);
    const currentTiles = getCurrentTiles(gameRoomCode);
    const playerTiles = getCurrentPlayer(gameRoomCode, socket.id)?.playerTiles;
    
    if (currentRoom) {
      delete currentRoom.clients[socket.id];
    };
    
    if (index >= 0) {
      handleNewHost(gameRoomCode);
      playersInRoom.splice(index, 1);
      if (playerTiles) playerTiles.map((tile: TileDocument) => currentTiles.push(tile));
      io.in(gameRoomCode).emit('playersInRoom', playersInRoom)
    }

    checkRoomToDelete(gameRoomCode);
    io.in(gameRoomCode).emit('tilesRemaining', getTilesRemaining(gameRoomCode));
    io.in(gameRoomCode).emit('actionMessage', `${userName} left`)
  };

  const getTiles = (gameRoomCode: string, numberOfTiles: number) => {
    const currentTiles = getCurrentTiles(gameRoomCode);
    if (currentTiles.length > numberOfTiles) {
      return currentTiles.splice(0, numberOfTiles);
    } else {
      return currentTiles.splice(0, currentTiles.length);
    }
  };

  const checkRoomToDelete = (gameRoomCode: string) => {
    const currentPlayers = getCurrentPlayers(gameRoomCode);
    if (currentPlayers?.length === 0) {
      delete socketRoomInformation[gameRoomCode];
    }
  };

  const getEndLongestWord = (gameRoomCode: string) => {
    const clients: any = getClients(gameRoomCode);

    const getEndLongestWord = Object.values(clients).reduce((max: string, { longest = '' }: any, index) => {
      return max.length > longest.length ? max : longest;
    }, '');

    const getEndUserName = Object.values(clients).map(({ userName, longest }: any) => {
      if (longest === getEndLongestWord) return userName;
    });

    return { getEndLongestWord, getEndUserName };
  };

  const getEndMostWords = (gameRoomCode: string) => {
    const clients: any = getClients(gameRoomCode);

    const getEndMostWords = Object.values(clients).reduce((max: string, { wordCount = '' }: any, index) => {
      return max > wordCount ? max : wordCount;
    }, '');

    const getEndMostUserName = Object.values(clients).map(({ userName, wordCount }: any) => {
      if (wordCount === getEndMostWords) return userName;
    });

    return { getEndMostWords, getEndMostUserName };
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
  socket.on('rottenBanana', handleRottenBanana);
  socket.on('endGame', handleEndGame);
  socket.on('leaveGame', handleLeaveGame);

  socket.on('roomWordCheckResponse', handleWordResponse);
});

app.get('*', (_, res) => {
  res.status(400).send('Sorry, no page found :`(');
});

const PORT = process.env.PORT || 4200;
(async () => {
  try {
    await dbConnection;
    console.log('Mongoose Connected');

    socketServer.listen(PORT, () => {
      console.log(`Socket Server lives at 4200`);
    })
  } catch (err) {
    console.log('Error:', err)
  }
})();

export default app;