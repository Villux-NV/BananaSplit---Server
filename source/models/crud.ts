import { User } from './user.model';
import { Room } from './room.model';

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
    console.log(`Error Get Users: ${err}`);
    return { error: 'DB Connection: Get UserById'};
  }
};

// NOTE: Added guest flag in case we need for rooms
export const createUser = async (userName: string, email: string) => {
  try {
    const user = new User({ userName, email, guest: false });
    await user.save();
    console.log(user);
    return user;
  } catch (err) {
    console.log(`Error Get Users: ${err}`);
    return { error: 'DB Connection: Create User'};
  }
};