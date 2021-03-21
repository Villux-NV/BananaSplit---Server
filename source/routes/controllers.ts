import { Request, Response } from 'express';
import { UserDocument } from '../lib/interfaces';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  // createRoom,
  // joinRoom
} from '../models/crud';

// Most likely won't need. Using to test endpoints/data.
export const getUsersCtrl = async (req: Request, res: Response) => {
  try {
    const users = await getUsers();
    if (!users) return res.status(400).send('No Users');
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: 'Error in Get Users Ctrl', status: 500 });
  }
};

export const getUserByIdCtrl = async (req: Request, res: Response) => {
  const { userId } = req.params;
  try {
    const user = await getUserById(userId);
    if (!user) return res.status(400).send('No User');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error in Get Users Ctrl', status: 500 });
  }
};

export const createUsersCtrl = async (req: Request, res: Response) => {
  const { userName, email } = req.body;

  try {
    const user = await createUser(userName, email);
    if (!user) return res.status(400).send('Error Creating User');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error in Get Users Ctrl', status: 500 });
  }
};

// TODO: Update Score/Longest Word -- 'score' || 'word'
export const updateUserCtrl = async (req: Request, res: Response) => {
  const { field, userId } = req.params;
  const { word } = req.body;  
  try {
    const userUpdate = await updateUser(field, userId, word);
    if (!userUpdate) return res.status(400).send('No Update');
    res.status(200).json(userUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Error in Update Score Ctrl', status: 500 });
  }
};

// export const createRoomCtrl = async (req: Request, res: Response) => {
//   const { creatorName } = req.body;
//   try {
//     const { room, socketRoom }: any = await createRoom(creatorName);
//     console.log("Room Created");
//     if (!room) return res.status(400).send('No Room');
//     res.status(200).json(room);
//   } catch (err) {
//     res.status(500).json({ error: 'Error in Create Room Ctrl', message: err.message, status: 500 });
//   }
// };

// export const joinRoomCtrl = async (req: Request, res: Response) => {
//   const { socket, playerId, PlayerName } = req.body;
//   try {
//     const room: any = await joinRoom(socket, playerId, PlayerName);
//     console.log("Player Joined");
//     if (!room) return res.status(400).send('Room Error');
//     res.status(200).json(room);
//   } catch (err) {
//     res.status(500).json({ error: 'Error in Create Room Ctrl', err, status: 500 });
//   }
// }
      
// TODO: Update Room -- Don't know if it will be needed