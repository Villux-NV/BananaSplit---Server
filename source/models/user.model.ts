import { Schema, model, Model } from 'mongoose';
import { UserDocument } from '../lib/interfaces';

const userSchema: Schema = new Schema({
  _id: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
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
});

export const User: Model<UserDocument> = model('User', userSchema);