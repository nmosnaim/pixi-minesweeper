import { FancyButton, Input } from "@pixi/ui";
import { Application, Container, Graphics, Text, TextStyle } from "pixi.js";
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

    this.renderInput(container, InputId.WIDTH, "Width", "30", this.app.screen.height * 0.3);
    this.renderInput(container, InputId.HEIGHT, "Height", "20", this.app.screen.height * 0.4);
    this.renderInput(container, InputId.BOMBS, "Bombs", "120", this.app.screen.height * 0.5);

    const startButton = new FancyButton({
      text: "Start",
      animations: {
        hover: {
          props: {
            scale: {
              x: 1.1,
              y: 1.1,
            },
          },
          duration: 100,
        },
        pressed: {
          props: {
            scale: {
              x: 0.9,
              y: 0.9,
            },
          },
          duration: 100,
        },
      },
    });
    startButton.onPress.connect(() => {
      const width = parseInt(this.inputs[InputId.WIDTH].value);
      const height = parseInt(this.inputs[InputId.HEIGHT].value);
      const bombs = parseInt(this.inputs[InputId.BOMBS].value);
      this.game.startGame(width, height, bombs);
    });
    startButton.x = this.app.screen.width / 2;
    startButton.y = this.app.screen.height * 0.8;
    container.addChild(startButton);
  }

  private renderInput(
    container: Container,
    inputId: InputId,
    labelText: string,
    defaultValue: string,
    topPosition: number
  ) {
    // TODO: replace with native HTML inputs and buttons, uninstall pixi ui
    const label = new Text({
      text: labelText,
      anchor: 0.5,
    });
    label.x = this.app.screen.width / 2;
    label.y = topPosition;
    container.addChild(label);

    const graphics = new Graphics();
    graphics.rect(0, 0, 100, 30);
    graphics.fill(0xedd7d5);
    graphics.stroke({ width: 1, color: 0x000000 });
    const inputField = new Input({
      bg: graphics,
      value: defaultValue,
      align: "center",
      padding: 1,
    });
    inputField.x = this.app.screen.width / 2 - 50;
    inputField.y = topPosition + 20;
    container.addChild(inputField);

    this.inputs[inputId] = inputField;
  }
}
