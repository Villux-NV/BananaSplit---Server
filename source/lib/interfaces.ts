import { Document } from 'mongoose';
import { TileSet } from './utils';

export interface UserDocument extends Document {
  userName?: string,
  email?: string,
  room_id?: string,
  score?: number,
  longest_word?: string,
  guest?: boolean,
}

export interface RoomInformation extends Document {
  gameRoomCode: string,
  userName: string,
}

export interface TileDocument extends Document {
  id?: number;
  letter?: string;
};

export interface GameEnd extends Document {
  id: string,
  tileToDump?: TileSet,
  rottenTiles?: TileSet
}

export interface SocketInfo extends Document {
  userName: string,
  host: boolean,
  clientID: string
};

export interface ClientInfo extends Document {
  SocketID: SocketInfo
};

