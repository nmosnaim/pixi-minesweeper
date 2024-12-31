import { Container, Graphics, Text, TextStyle } from "pixi.js";
import { getTileValueColor } from "./color";
import { BOARD_DEFAULT_SIDE_LENGTH } from "./consts";
import { Game } from "./game";
import { deleteBoardData, saveBoardData } from "./storage";
import { arrayToBinary, shuffle } from "./utils";

enum GameResult {
  GAME_OVER,
  VICTORY,
}
class Tile {
  board: Board;
  index: number;

  hasBomb: boolean;
  isOpen: boolean;
  isFlagged: boolean;

  value: number;

  neighbors: Tile[];

  graphics: Graphics | null;

  constructor(board: Board, index: number) {
    this.board = board;
    this.index = index;

    this.hasBomb = false;
    this.isOpen = false;
    this.isFlagged = false;

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
    if (this.board.isFrozen || this.isOpen || this.isFlagged) return;
    this.isOpen = true;
    this.board.tileOpened(this.index);
    saveBoardData(this.board.serializedData);
    this.render();
    if (this.hasBomb) {
      return this.board.endGame(GameResult.GAME_OVER);
    }
    if (this.value === 0) {
      this.neighbors.forEach((tile) => tile.open());
    }
  }

  magicOpenNeighbors() {
    const flaggedNeighbors = this.neighbors.filter((tile) => tile.isFlagged);
    if (flaggedNeighbors.length === this.value)
      this.neighbors.filter((tile) => !tile.isOpen).forEach((tile) => tile.open());
  }

  flag() {
    if (this.board.isFrozen) return;
    this.isFlagged = !this.isFlagged;
    saveBoardData(this.board.serializedData);
    this.render();
  }

  magicFlagNeighbors() {
    const unopenedNeighbors = this.neighbors.filter((tile) => !tile.isOpen);
    if (unopenedNeighbors.length === this.value)
      unopenedNeighbors.filter((tile) => !tile.isFlagged).forEach((tile) => tile.flag());
  }

  processClick() {
    console.debug(`Clicked tile ${this.index}`);
    if (this.isOpen) return this.magicOpenNeighbors();
    this.open();
  }

  processRightClick() {
    console.debug(`Right-clicked tile ${this.index}`);
    if (this.isOpen) return this.magicFlagNeighbors();
    this.flag();
  }

  // coordinate boundary
  get cb(): number {
    return this.board.sideLength / 2;
  }

  renderDepth(graphics: Graphics) {
    graphics.moveTo(-this.cb + 3, this.cb - 3);
    graphics.lineTo(-this.cb + 3, -this.cb + 3);
    graphics.lineTo(this.cb - 3, -this.cb + 3);
    graphics.stroke({ width: 4, color: 0xffffff });
    graphics.moveTo(-this.cb + 3, this.cb - 3);
    graphics.lineTo(this.cb - 3, this.cb - 3);
    graphics.lineTo(this.cb - 3, -this.cb + 3);
    graphics.stroke({ width: 4, color: 0xaaaaaa });
  }

  renderFlag(graphics: Graphics) {
    graphics.poly([0, 0, 0, -this.cb * 0.5, -this.cb * 0.4, -this.cb * 0.2], true);
    graphics.fill({ color: "red" });
    graphics.moveTo(0, -this.cb * 0.5);
    graphics.lineTo(0, this.cb * 0.5);
    graphics.stroke({ width: 1, color: 0x000000 });
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

    graphics.position.set(x * sideLength, y * sideLength);
    graphics.rect(-sideLength / 2, -sideLength / 2, sideLength, sideLength);
    graphics.fill(this.hasBomb && this.isOpen ? 0xd40019 : 0xedd7d5);
    graphics.stroke({ width: 1, color: 0x000000 });

    if (!this.isOpen) {
      this.renderDepth(graphics);
    }

    if (this.isFlagged) {
      this.renderFlag(graphics);
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
    graphics.addChild(text);

    graphics.eventMode = "static";
    graphics.on("mousedown", () => this.processClick());
    graphics.on("rightdown", () => this.processRightClick());
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
  bombs: string;
  opened: string;
  flags: string;
};

export class Board {
  game: Game;
  width: number;
  height: number;

  sideLength: number;

  container: Container;

  private readonly tiles: Tile[];

  plantedBombs: number;
  isFrozen: boolean;
  totalOpened: number;

  firstTileClicked: boolean;

  constructor(game: Game, width: number, height: number, options: BoardOptions = {}) {
    this.game = game;
    this.width = width;
    this.height = height;

    this.container = new Container();
    this.container.x = this.game.app.screen.width / 2;
    this.container.y = this.game.app.screen.height / 2;
    this.game.app.stage.addChild(this.container);

    this.sideLength = options.sideLength ?? BOARD_DEFAULT_SIDE_LENGTH;

    this.tiles = [];
    for (let i = 0; i < this.totalTiles; i++) {
      this.tiles.push(new Tile(this, i));
    }
    this.tiles.forEach((tile) => (tile.neighbors = this.getNeighbors(tile.index)));

    this.container.pivot.x = (this.sideLength * width) / 2;
    this.container.pivot.y = (this.sideLength * height) / 2;

    this.plantedBombs = 0;
    this.isFrozen = false;
    this.totalOpened = 0;

    this.firstTileClicked = false;
  }

  static restore(game: Game, boardData: SerializedBoard, options: BoardOptions = {}): Board {
    const board = new Board(game, boardData.width, boardData.height, options);
    for (let i = 0; i < board.totalTiles; i++) {
      board.tiles[i].isFlagged = boardData.flags[i] === "1";
      if (boardData.bombs[i] === "1") {
        board.tiles[i].hasBomb = true;
        board.plantedBombs += 1;
      }
      if (boardData.opened[i] === "1") {
        board.tiles[i].isOpen = true;
        board.totalOpened += 1;
        board.firstTileClicked = true;
      }
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

  setBombs(bombs: number) {
    this.plantedBombs = bombs;
  }

  plant(startingTileIndex: number) {
    const candidates = Array.from(Array(this.totalTiles).keys()); // [1, 2, 3, ... totalTiles]
    shuffle(candidates);

    const startingTile = this.tiles[startingTileIndex];
    const safetyTileIndexes = startingTile.neighbors.map((tile) => tile.index);
    safetyTileIndexes.push(startingTileIndex);

    let remainingBombs = this.plantedBombs;
    candidates.forEach((candidateIndex) => {
      if (safetyTileIndexes.includes(candidateIndex) || remainingBombs === 0) return;
      this.tiles[candidateIndex].hasBomb = true;
      remainingBombs -= 1;
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

  tileOpened(openedTileIndex: number) {
    if (!this.firstTileClicked) this.plant(openedTileIndex);
    this.firstTileClicked = true;
    this.totalOpened += 1;
    if (this.totalOpened === this.totalTiles - this.plantedBombs) {
      this.endGame(GameResult.VICTORY);
    }
  }

  endGame(result: GameResult) {
    this.isFrozen = true;
    deleteBoardData();

    const titleStyle = new TextStyle({
      fill: 0xffffff,
      stroke: { color: result === GameResult.VICTORY ? 0x004620 : 0xd40019, width: 12, join: "round" },
      fontSize: 60,
    });
    const title = new Text({
      text: result === GameResult.VICTORY ? "VICTORY" : "GAME OVER",
      anchor: 0.5,
      style: titleStyle,
    });
    title.x = this.container.width / 2;
    title.y = -50;
    this.container.addChild(title);
  }

  get serializedData(): SerializedBoard {
    return {
      width: this.width,
      height: this.height,
      bombs: arrayToBinary(this.tiles.map((tile) => tile.hasBomb)),
      opened: arrayToBinary(this.tiles.map((tile) => tile.isOpen)),
      flags: arrayToBinary(this.tiles.map((tile) => tile.isFlagged)),
    };
  }
}
