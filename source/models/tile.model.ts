import { Schema, model, Model } from 'mongoose';
const tileSchema: Schema = new Schema({
    tile_id: {
      type: Number,
      required: true
    },
    letter: {
      type: String,
      required: true
    }
  });
  
  export const Tile = model('Tile', tileSchema);