import { Schema, model, Model } from 'mongoose';
const tileSchema: Schema = new Schema({
    tile_id: {
      type: Number
    },
    letter: {
      type: String
    }
  });
  
  export const Tile = model('Tile', tileSchema);