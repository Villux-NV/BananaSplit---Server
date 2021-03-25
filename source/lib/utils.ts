import { Tile } from "../models/tile.model";

// export const storeTilesCtrl = async (storeBunch: any) => {
//   const store = async (bunchAgain: any) => {
//     // const array = [];
//     // current issue with Tile creation
//     for(let i = 0; i <= Object.keys(bunchAgain).length; i++) {
//       try {
//         const tile = new Tile({ 
//            tile_id: bunchAgain[i].id, letter: bunchAgain[i].tile
//         });
//         tile.save();
//       } catch (err) {
//         console.log(`Error in Stroring: ${err}`);
//         return { error: 'Storing Error' };
//       }
//     }
//     return bunchAgain;
//   };

//   try {
//     const check = await store(storeBunch); 
//     if(check) console.log('stored');
//     return true;
//   } catch (err) {
//     console.log(err);
//   } 
// };

// export const getOneTile = async () => {
//   const tile  = await Tile.findOneAndRemove({ tile_id: Math.floor(Math.random()*Tile.length) }, {}, (tile) => {
//     return tile;
//   });
//   return tile;
// };