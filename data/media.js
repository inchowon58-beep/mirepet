export const IMG = "https://image.cattery.co.kr";

export const MIXED = [
  ["doodle", 40],
  ["pome", 66],
  ["maltese", 25],
  ["maincoon", 59],
  ["ragdoll", 57],
  ["siba", 19],
  ["selti", 98],
  ["toypoodle", 33],
  ["rusian", 17],
  ["neva", 57],
  ["mcnchikin", 66],
  ["dogboho", 79],
  ["catboho", 60],
  ["samoyed", 16],
  ["pomsky", 50],
  ["shichu", 24],
  ["welshi", 16],
  ["maltipoo", 26],
  ["bishone", 20],
  ["coldenret", 10],
  ["yoki", 12],
  ["coca", 10],
  ["daks", 23],
  ["italian", 10],
  ["wterrier", 30],
  ["pomsky", 50],
  ["bunyz", 12],
];

export const FUNERAL = [
  ["dogboho", 79],
  ["catboho", 60],
];

const CAT_FOLDERS = new Set(["maincoon", "ragdoll", "rusian", "neva", "mcnchikin", "catboho"]);

export const DOGS = MIXED.filter(([folder]) => !CAT_FOLDERS.has(folder));
export const CATS = MIXED.filter(([folder]) => CAT_FOLDERS.has(folder));

export function imageUrl(folder, n) {
  return `${IMG}/${folder}/${String(n).padStart(2, "0")}.webp`;
}

export function pickFromFolders(list, seed, n) {
  const total = list.reduce((sum, item) => sum + item[1], 0);
  const urls = [];
  const used = new Set();
  let guard = 0;
  while (urls.length < n && guard < n * 12) {
    let idx = (seed + guard * 97) % total;
    for (const [folder, count] of list) {
      if (idx < count) {
        const key = `${folder}:${idx + 1}`;
        if (!used.has(key)) {
          used.add(key);
          urls.push(imageUrl(folder, idx + 1));
        }
        break;
      }
      idx -= count;
    }
    guard += 1;
  }
  return urls;
}
