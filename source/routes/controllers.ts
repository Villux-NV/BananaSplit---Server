import { Request, Response } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
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
  const { userId, field } = req.params;
  const { word } = req.body;  
  try {
    const user = await updateUser(userId, field, word);
    console.log(user);
    if (!user) return res.status(400).send('No User');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error in Update Score Ctrl', status: 500 });
  }
};



// TODO: Update Room -- Don't know if it will be needed