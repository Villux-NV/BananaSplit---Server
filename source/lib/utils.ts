// NOTE: Had to move this function to front end
export const getGameRoomCode: Function = (len: number) => {
  let gameCode = '';
  let allowableCharacters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let charLen = allowableCharacters.length;
  for (let i = 0; i < len; i++) {
    gameCode += allowableCharacters.charAt(Math.floor(Math.random() * charLen));
  };
  return gameCode;
};
