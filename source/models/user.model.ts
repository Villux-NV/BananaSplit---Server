import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  room_id: {
    type: String,
    required: false
  },
  score: {
    type: Number,
    default: 0,
    required: false,
  },
  longest_word: {
    type: String,
    required: false
  },
  guest: {
    type: Boolean,
    required: false,
  }
});

export const User = model('User', userSchema);