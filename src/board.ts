import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileValueColor } from "./color";
import { BOARD_DEFAULT_SIDE_LENGTH } from "./consts";
import { Game } from "./game";
import { saveBoardData } from "./storage";
import { shuffle } from "./utils";

class Tile {
  board: Board;
  index: number;
  hasBomb: boolean;
  isOpen: boolean;
  value: number;

  neighbors: Tile[];

  graphics: Graphics | null;

  constructor(board: Board, index: number) {
    this.board = board;
    this.index = index;
    this.hasBomb = false;
    this.isOpen = false;
    this.value = 0;
    this.neighbors = [];
    this.graphics = null;
    this.render();
  }

  get coordinates(): number[] {
    const y = Math.floor(this.index / this.board.width);
    const x = this.index - this.board.width * y;
    return [x, y];
  }

  get text(): string {
    if (!this.isOpen) return "";
    if (this.hasBomb) return "*";
    if (this.value) return `${this.value}`;
    return "";
  }

  get tileColor(): number {
    if (!this.isOpen) return 0xffffff;
    if (this.hasBomb) return 0x000000;
    return getTileValueColor(this.value);
  }

  open() {
    if (this.isOpen) return;
    this.isOpen = true;
    this.render();
    if (this.hasBomb) {
      // TODO: handle game end
      return;
    }
    if (this.value === 0) {
      this.neighbors.forEach((tile) => tile.open());
    }
  }

  processClick() {
    console.debug(`Clicked tile ${this.index}`);
    this.open();
  }

  render() {
    if (this.graphics) {
      this.graphics.destroy();
    }
    const graphics = new Graphics();
    this.graphics = graphics;
    this.board.container.addChild(graphics);
    const [x, y] = this.coordinates;
    const sideLength = this.board.sideLength;
    graphics.rect(x * sideLength, y * sideLength, sideLength, sideLength);
    graphics.fill(0xedd7d5);
    graphics.stroke({ width: 1, color: 0x000000 });

    if (!this.isOpen) {
      graphics.moveTo(x * sideLength + 3, (y + 1) * sideLength - 1);
      graphics.lineTo(x * sideLength + 3, y * sideLength + 3);
      graphics.lineTo((x + 1) * sideLength - 1, y * sideLength + 3);
      graphics.stroke({ width: 4, color: 0xffffff });
      graphics.moveTo(x * sideLength + 3, (y + 1) * sideLength - 1);
      graphics.lineTo((x + 1) * sideLength - 1, (y + 1) * sideLength - 1);
      graphics.lineTo((x + 1) * sideLength - 1, y * sideLength + 3);
      graphics.stroke({ width: 4, color: 0xaaaaaa });

      graphics.eventMode = "static";
      graphics.on("pointerdown", () => this.processClick());
    }

    const text = new Text({
      text: this.text,
      anchor: 0.5,
      style: new TextStyle({
        fontSize: this.board.sideLength * 0.8,
        fontWeight: "bold",
        fill: this.tileColor,
      }),
    });
    text.x = (x + 1 / 2) * sideLength;
    text.y = (y + 1 / 2) * sideLength;

    graphics.addChild(text);
  }

  computeValue() {
    if (!this.hasBomb) this.value = this.neighbors.reduce((sum, tile) => sum + +tile.hasBomb, 0);
  }
}

type BoardOptions = {
  topLeft?: number[];
  sideLength?: number;
};

export type SerializedBoard = {
  width: number;
  height: number;
  bombs: number[];
};

export class Board {
  game: Game;
  width: number;
  height: number;

  sideLength: number;

  container: Container;

  private readonly tiles: Tile[];

  constructor(game: Game, width: number, height: number, options: BoardOptions = {}) {
    this.game = game;
    this.width = width;
    this.height = height;

    this.sideLength = options.sideLength ?? BOARD_DEFAULT_SIDE_LENGTH;

    this.container = new Container();

    this.tiles = [];
    for (let i = 0; i < this.totalTiles; i++) {
      this.tiles.push(new Tile(this, i));
    }
    this.tiles.forEach((tile) => (tile.neighbors = this.getNeighbors(tile.index)));
  }

  static restore(game: Game, boardData: SerializedBoard, options: BoardOptions = {}): Board {
    const board = new Board(game, boardData.width, boardData.height, options);
    for (let i = 0; i < board.totalTiles; i++) {
      board.tiles[i].hasBomb = boardData.bombs[i] === 1;
    }
    board.plantPostActions();
    return board;
  }

  setup() {
    (<HTMLElement>document.getElementById("game-ui")).style["display"] = "";
    (<HTMLInputElement>document.getElementById("game-giveup-button")).addEventListener(
      "click",
      () => this.game.mainMenu(),
      { once: true }
    );
  }

  get totalTiles() {
    return this.width * this.height;
  }

  plant(bombs: number) {
    const candidates = Array.from(Array(this.totalTiles).keys()); // [1, 2, 3, ... totalTiles]
    shuffle(candidates);
    candidates.forEach((candidateIndex, i) => {
      this.tiles[candidateIndex].hasBomb = i < bombs;
    });
    this.plantPostActions();
  }

  private plantPostActions() {
    this.tiles.forEach((tile) => {
      tile.computeValue();
    });
    this.render();
    saveBoardData(this.serializedData);
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

  getNeighbors(index: number): Tile[] {
    const [x, y] = this.indexToCoordinates(index);
    const hasLeft = x > 0;
    const hasAbove = y > 0;
    const hasRight = x < this.width - 1;
    const hasBelow = y < this.height - 1;

    const result: Tile[] = [];

    // cardinal
    if (hasLeft) result.push(this.tiles[this.coordinatesToIndex(x - 1, y)]);
    if (hasAbove) result.push(this.tiles[this.coordinatesToIndex(x, y - 1)]);
    if (hasRight) result.push(this.tiles[this.coordinatesToIndex(x + 1, y)]);
    if (hasBelow) result.push(this.tiles[this.coordinatesToIndex(x, y + 1)]);

    // corners
    if (hasLeft && hasAbove) result.push(this.tiles[this.coordinatesToIndex(x - 1, y - 1)]);
    if (hasLeft && hasBelow) result.push(this.tiles[this.coordinatesToIndex(x - 1, y + 1)]);
    if (hasRight && hasAbove) result.push(this.tiles[this.coordinatesToIndex(x + 1, y - 1)]);
    if (hasRight && hasBelow) result.push(this.tiles[this.coordinatesToIndex(x + 1, y + 1)]);

    return result;
  }

  get serializedData(): SerializedBoard {
    return {
      width: this.width,
      height: this.height,
      bombs: this.tiles.map((tile) => +tile.hasBomb),
    };
  }
}
