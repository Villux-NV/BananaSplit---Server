import { Schema, model } from 'mongoose';

const roomSchema = new Schema({
  room_id: {
    type: String,
    required: true
  },
  host: {
    type: String
  },
  players: [{
    type: String
  }],
  active: {
    type: Boolean,
    required: true
  }
});

export const Room = model('Room', roomSchema);