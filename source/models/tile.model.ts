import { Schema, model } from 'mongoose';

// NOTE: Igor's comment
// I don't think that something like a tile should be a model... seems like 
// massive overkill
const tileSchema: Schema = new Schema({
  tile_id: {
    type: Number
  },
  letter: {
    type: String
  }
});
  
export const Tile = model('Tile', tileSchema);