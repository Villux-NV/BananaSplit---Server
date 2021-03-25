import { User } from './user.model';
import { Room } from './room.model';
import { createServer } from "http";
import { Tile } from './tile.model';
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
