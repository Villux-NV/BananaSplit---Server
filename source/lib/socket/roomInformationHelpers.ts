export const socketRoomInformation: any = {};
// NOTE: { gameRoomCode:
// NOTE:     players: [...players],
// NOTE:     playersReady: [...players],
// NOTE:     active: true | false,
// NOTE:     clients: {
// NOTE:        socket.id: {
// NOTE:          username, 
// NOTE:          isHost, 
// NOTE:          socket: socket.id, 
// NOTE:          longest: 'word', 
// NOTE:          wordCount: 2, 
// NOTE:        } 
// NOTE: }

export const getCurrentRoom = (gameRoomCode: string) => {
  return socketRoomInformation[gameRoomCode];
};

export const getPlayersInRoom = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom.players;
};

export const getCurrentPlayer = (gameRoomCode: string, clientID: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.clients[clientID];
};

export const getCurrentPlayerUserName = (gameRoomCode: string, clientID: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.clients[clientID]?.userName;
};

export const getCurrentPlayers = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.players;
};

export const getCurrentReady = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom.playersReady;
};

export const getClients = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.clients;
};

export const getCurrentTiles = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.roomTileSet;
};

export const getTilesRemaining = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom?.roomTileSet?.length;
};

export const getRoomStatus = (gameRoomCode: string) => {
  const currentRoom = getCurrentRoom(gameRoomCode);
  return currentRoom.active;
};