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
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  longest_word: {
    type: String,
    required: false
  }
});

export const User = model('User', userSchema);