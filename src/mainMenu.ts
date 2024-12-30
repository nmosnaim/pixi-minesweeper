import { Input } from "@pixi/ui";
import { Application, Container, Text, TextStyle } from "pixi.js";
import { Game } from "./game";

enum InputId {
  WIDTH,
  HEIGHT,
  BOMBS,
}

export class MainMenu {
  game: Game;
  app: Application;
  inputs: { [id: number]: Input };

  constructor(game: Game) {
    this.game = game;
    this.app = game.app;
    this.inputs = {};
  }

  setup() {
    const mainMenu = document.getElementById("main-menu-container");
    if (mainMenu) {
      mainMenu.style["display"] = "";
    }

    const container = new Container();
    this.app.stage.addChild(container);

    const titleStyle = new TextStyle({
      fill: "#ffffff",
      stroke: { color: "#004620", width: 12, join: "round" },
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
    startButton.addEventListener("click", () => this.prepareGameStart());
  }

  prepareGameStart() {
    const widthInput = <HTMLInputElement>document.getElementById("main-menu-width-input");
    const heightInput = <HTMLInputElement>document.getElementById("main-menu-height-input");
    const bombsInput = <HTMLInputElement>document.getElementById("main-menu-bombs-input");
    this.game.startGame(parseInt(widthInput.value), parseInt(heightInput.value), parseInt(bombsInput.value));
  }
}
