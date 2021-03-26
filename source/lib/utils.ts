export const buildBunch = (tileSet: any[]) => {
  let bunch: any[] = [];
  for (let i = 0; i < tileSet.length; i++) {
    bunch.push({ letter: tileSet[i], id: i });
  };
  return bunch;
};

export const shuffleBunch = (arr: any[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  return arr;
}




// From previous
// let bunch: any[] = [];
// for (let i = 0; i < tileSet.length; i++) {
//   bunch.push({ tile: tileSet[i], id: Object.keys(bunch).length });
// };

// const storeTilesCtrl = async (storeBunch: any) => {
//   const store = async (bunchAgain: any) => {
//     // const array = [];
//     // current issue with Tile creation
//     for(let i = 0; i <= Object.keys(bunchAgain).length; i++) {
//       for (let j=0; j<bunchAgain[i]?.length; j++) {
//         try {
//           const tile = new Tile({ 
//             tile_id: bunchAgain[i][j].id, letter: bunchAgain[i][j].tile
//           });
//           tile.save();
//         } catch (err) {
//           console.log(`Error in Stroring: ${err}`);
//           return { error: 'Storing Error' };
//         }
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


// NOTE: From previous tile functions on room.
// const storeOneTile = async (tile: any) => {
//   try {
//     const tileToStore = new Tile({ 
//       tile_id: tile.id, letter: tile.tile
//     });
//     tile.save();
//     return true;
//   } catch (err) {
//     console.log(`Error in Stroring single tile: ${err}`);
//     return { error: 'Storing Single Tile Error' };
//   }
// };

// const getOneTile = async () => {
//   const tile  = await Tile.findOneAndRemove({ tile_id: Math.floor(Math.random()*Tile.length) }, {}, (tile) => {
//     return tile;
//   });
//   return tile;
// };

// socket.on('getOneTile', function () {
//   socket.emit('returnOneTile', getOneTile());
// });

// socket.on('storeOneTile', function (tile) {
//   const tileToStore = tile;
//   socket.emit('tileStored', storeOneTile(tileToStore));
// });