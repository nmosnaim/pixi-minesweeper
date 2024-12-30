import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileValueColor } from "./color";
import { shuffle } from "./utils";

class Tile {
  board: Board;
  index: number;
  hasBomb: boolean;
  value: number;

  constructor(board: Board, index: number) {
    this.board = board;
    this.index = index;
    this.hasBomb = false;
    this.value = 0;
    this.render();
  }

  get coordinates(): number[] {
    const y = Math.floor(this.index / this.board.width);
    const x = this.index - this.board.width * y;
    return [x, y];
  }

  get text(): string {
    if (this.hasBomb) {
      return "*";
    }
    if (this.value) {
      return `${this.value}`;
    }
    return "";
  }

  render() {
    const graphics = new Graphics();
    const [x, y] = this.coordinates;
    const sideLength = this.board.sideLength;
    graphics.rect(x * sideLength, y * sideLength, sideLength, sideLength);
    graphics.fill(0xedd7d5);
    graphics.stroke({ width: 1, color: 0x000000 });

    const text = new Text({
      text: this.text,
      anchor: 0.5,
      style: new TextStyle({
        fontSize: this.board.sideLength * 0.8,
        fontWeight: "bold",
        fill: this.hasBomb ? 0x000000 : getTileValueColor(this.value),
      }),
    });
    text.x = (x + 1 / 2) * sideLength;
    text.y = (y + 1 / 2) * sideLength;

    this.board.container.addChild(graphics);
    graphics.addChild(text);
  }

  computeValue() {
    this.value = this.board.getNearBombs(this.index);
  }
}

type BoardOptions = {
  topLeft?: number[];
  sideLength?: number;
};

const DEFAULT_SIDE_LENGTH = 24;

export class Board {
  width: number;
  height: number;

  sideLength: number;

  container: Container;

  private tiles: Tile[];

  constructor(width: number, height: number, options: BoardOptions = {}) {
    this.width = width;
    this.height = height;

    this.sideLength = options.sideLength || DEFAULT_SIDE_LENGTH;

    this.container = new Container();

    this.tiles = [];
    for (let i = 0; i < this.totalTiles; i++) {
      this.tiles.push(new Tile(this, i));
    }
  }

  get totalTiles() {
    return this.width * this.height;
  }

  plant(bombs: number) {
    const candidates = Array.from(Array(this.totalTiles).keys()); // [1, 2, 3, ... totalTiles]
    shuffle(candidates);
    candidates.forEach((candidateIndex, i) => {
      this.tiles[candidateIndex].hasBomb = i <= bombs;
    });
    candidates.forEach((candidateIndex) => {
      this.tiles[candidateIndex].computeValue();
    });
    this.render();
  }

  render() {
    this.tiles.forEach((tile) => tile.render());
  }

  private indexToCoordinates(index: number): number[] {
    const y = Math.floor(index / this.width);
    const x = index - this.width * y;
    return [x, y];
  }

  private coordinatesToIndex(x: number, y: number): number {
    return y * this.width + x;
  }

  getNearBombs(index: number): number {
    const [x, y] = this.indexToCoordinates(index);
    const hasLeft = x > 0;
    const hasAbove = y > 0;
    const hasRight = x < this.width - 1;
    const hasBelow = y < this.height - 1;
    let bombs = 0;

    // cardinal
    if (hasLeft) bombs += +this.tiles[this.coordinatesToIndex(x - 1, y)].hasBomb;
    if (hasAbove) bombs += +this.tiles[this.coordinatesToIndex(x, y - 1)].hasBomb;
    if (hasRight) bombs += +this.tiles[this.coordinatesToIndex(x + 1, y)].hasBomb;
    if (hasBelow) bombs += +this.tiles[this.coordinatesToIndex(x, y + 1)].hasBomb;

    // corners
    if (hasLeft && hasAbove) bombs += +this.tiles[this.coordinatesToIndex(x - 1, y - 1)].hasBomb;
    if (hasLeft && hasBelow) bombs += +this.tiles[this.coordinatesToIndex(x - 1, y + 1)].hasBomb;
    if (hasRight && hasAbove) bombs += +this.tiles[this.coordinatesToIndex(x + 1, y - 1)].hasBomb;
    if (hasRight && hasBelow) bombs += +this.tiles[this.coordinatesToIndex(x + 1, y + 1)].hasBomb;

    return bombs;
  }
}
