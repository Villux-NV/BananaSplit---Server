import { User } from './user.model';

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
    console.log(user)
    return user;
  } catch (err) {
    console.log(`Error Get User By ID: ${err}`);
    return { error: 'DB Connection: Get UserById'};
  }
};

export const createUser = async (email: string, userName: string, uid: string) => {
  try {
    const user = new User({ _id: uid, userName, email });
    await user.save();
    return user;
  } catch (err) {
    console.log(`Error Create User: ${err}`);
    return { error: 'DB Connection: Create User'};
  }
};

export const updateUserWord = async (id: string, word: string) => {
  try {
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
  } catch (err) {
    console.log(`Error Update User: ${err}`);
    return { error: 'DB Connection: Update User'};
  }
};

export const updateUserScore = async (id: string) => {
  try {
    await User.updateOne(
      { _id: id },
      { $inc: { score: 1 } },
      { new: true }
      );
    return true;
  } catch (err) {
    console.log(`Error Update User: ${err}`);
    return { error: 'DB Connection: Update User'};
  }
};
