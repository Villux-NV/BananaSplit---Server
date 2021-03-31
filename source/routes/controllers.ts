import { Request, Response } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUserWord,
  updateUserScore
} from '../models/crud';

// Using to test endpoints/data.
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
  const { email, userName, uid } = req.body;

  try {
    const user = await createUser(email, userName, uid);
    if (!user) return res.status(400).send('Error Creating User');
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ error: 'Error in Get Users Ctrl', status: 500 });
  }
};

export const updateUserWordCtrl = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { word } = req.body;

  try {
    const userUpdate = await updateUserWord(userId, word);
    if (!userUpdate) return res.status(400).send('No Update');
    res.status(200).json(userUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Error in Update Score Ctrl', status: 500 });
  }
};

export const updateUserScoreCtrl = async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const userUpdate = await updateUserScore(userId);
    if (!userUpdate) return res.status(400).send('No Update');
    res.status(200).json(userUpdate);
  } catch (err) {
    res.status(500).json({ error: 'Error in Update Score Ctrl', status: 500 });
  }
};
