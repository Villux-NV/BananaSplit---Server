export const buildBunch = (tileSet: any[]) => {
  let bunch: any[] = [];
  for (let i = 0; i < tileSet.length; i++) {
    bunch.push({ letter: tileSet[i], id: `${i}` });
  };
  return bunch;
};

export const shuffleBunch = (arr: any[]) => {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };
  return arr;
};

