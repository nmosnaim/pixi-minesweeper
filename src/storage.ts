import { SerializedBoard } from "./board";

const LOCALSTORAGE_KEY = "msd";

export function deleteBoardData() {
  localStorage.removeItem(LOCALSTORAGE_KEY);
}

export function loadBoardData(): SerializedBoard | null {
  const stringData = localStorage.getItem(LOCALSTORAGE_KEY);
  if (!stringData) {
    return null;
  }
  try {
    return <SerializedBoard>JSON.parse(stringData);
  } catch (error: any) {
    deleteBoardData();
    console.log(`Board data: ${stringData}`);
    throw Error(`Error loading board data: ${error}`);
  }
}

export function saveBoardData(data: SerializedBoard) {
  localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data));
}
