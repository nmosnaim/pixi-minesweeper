import { Application, Container, Text, TextStyle } from "pixi.js";
import { Game } from "./game";

export class MainMenu {
  game: Game;
  app: Application;

  constructor(game: Game) {
    this.game = game;
    this.app = game.app;
  }

  setup() {
    (<HTMLElement>document.getElementById("main-menu-container")).style["display"] = "";

    const container = new Container();
    this.app.stage.addChild(container);

    const titleStyle = new TextStyle({
      fill: 0xffffff,
      stroke: { color: 0x004620, width: 12, join: "round" },
      fontSize: 60,
    });
    const title = new Text({
      text: "Minesweeper",
      anchor: 0.5,
      style: titleStyle,
    });
    title.x = this.app.screen.width / 2;
    title.y = this.app.screen.height * 0.1;
    container.addChild(title);

    const startButton = <HTMLButtonElement>document.getElementById("main-menu-start-button");
    startButton.addEventListener("click", () => this.prepareGameStart(), { once: true });
  }

  prepareGameStart() {
    const widthInput = <HTMLInputElement>document.getElementById("main-menu-width-input");
    const heightInput = <HTMLInputElement>document.getElementById("main-menu-height-input");
    const bombsInput = <HTMLInputElement>document.getElementById("main-menu-bombs-input");
    this.game.startGame(parseInt(widthInput.value), parseInt(heightInput.value), parseInt(bombsInput.value));
  }
}
