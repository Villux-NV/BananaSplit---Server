import { Document } from 'mongoose';

export interface UserDocument extends Document {
  userName?: string,
  email?: string,
  room_id?: string,
  score?: number,
  longest_word?: string,
  guest?: boolean,
}

export interface RoomInformation {
  gameRoomCode: string,
  userName: string,
  userID: string
}