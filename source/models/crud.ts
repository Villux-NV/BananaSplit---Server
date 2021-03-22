import { User } from './user.model';
import { Room } from './room.model';
import { createServer } from "http";
// import * as socketio from "socket.io";
import app from '../server';
import { UserDocument } from '../lib/interfaces';

export const getUsers = async () => {
  try {
    const users = await User.find();
    return users;
  } catch (err) {
    console.log(`Error Get Users: ${err}`);
    return { error: 'DB Connection: Get Users'};
  }
};

export const getUserById = async (id: string) => {
  try {
    const user = await User.findOne({ _id: id });
    return user;
  } catch (err) {
    console.log(`Error Get User By ID: ${err}`);
    return { error: 'DB Connection: Get UserById'};
  }
};

// NOTE: Added guest flag in case we need for rooms
// NOTE: Can add logic -- if guest, then kickback so username on front end/not saved
export const createUser = async (email: string, userName: string, uid: string) => {
  try {
    const user = new User({ _id: uid, userName, email, guest: false });
    await user.save();
    return user;
  } catch (err) {
    console.log(`Error Create User: ${err}`);
    return { error: 'DB Connection: Create User'};
  }
};

export const updateUser = async (field: string, id: string, word: string) => {
  try {
    if (field === 'score') {
      await User.updateOne(
        { _id: id },
        { $inc: { score: 1 } },
        { new: true }
        );
      return true;
    } else if (field === 'word') {
      const user: any = await User.findOne({ _id: id });
      if (user.longest_word) {
        if (user.longest_word.length < word.length || user.longest_word.length === word.length) {
          await User.updateOne(
            { _id: id },
            { longest_word: word },
            { new: true}
            );
          return true;
        } else {
          return false;
        }
      } else {
        await User.updateOne(
          { _id: id },
          { longest_word: word },
          { new: true}
          );
        return true;
      }
    };
    return false;
  } catch (err) {
    console.log(`Error Update User: ${err}`);
    return { error: 'DB Connection: Update User'};
  }
};

// export const createRoom = async (creatorName: string) => {
//   // const httpServer = createServer();
//   // {
//   //  cors: { origin: "*" }
//   // }
//   const io = require('socket.io')(require('http').createServer());
//   console.log(io);
//   let socketRoom: any;

//   io.on('connection', (socket: any) => {
//     socket.emit('welcome', 'Welcome to BananaSplit ');
//     socket.join(socket.id);
//     console.log(socket.id, 'socketid');
//     socket.emit('roomwelcome', `Welcome to room ${socket.id}, ${creatorName}!`);
//     socketRoom = socket; 
//   });

//   io.listen(3000);

//   try {
//     if (socketRoom) {
//       const room = new Room({ room_id: socketRoom.id, host: creatorName, players: creatorName, active: true });
//       await room.save();
//       return { room, socketRoom };
//     } else {
//       return 'no socket room';
//     }
//   }
//   catch (err) {
//     console.log(`Error Room Creation: ${err}`);
//     return { error: 'Room Creation Error'};
//   }
// };

// export const joinRoom = async (socket: any, playerId: string, playerName: string) => {
//   socket.emit('welcome', 'Welcome to BananaSplit ');
//   socket.join(socket.id);
//   socket.emit('roomwelcome', `Welcome to room ${socket.id}, ${playerName}!`);
//   try {
//     await Room.updateOne(
//       { room_id: socket.id },
//       {
//         $push: {
//           players: playerId
//         }
//       });
//     return true
//   }
//   catch (err) {
//     console.log(`Error Player Join: ${err}`);
//     return { error: 'Player Join Error'};
//   }
// };

