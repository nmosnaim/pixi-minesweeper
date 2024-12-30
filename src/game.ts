import { Application } from "pixi.js";
import { Board } from "./board";
import { MainMenu } from "./mainMenu";

enum GameView {
  UNINITIALIZED,
  MAIN_MENU,
  GAME,
}

export class Game {
  app: Application;
  currentView: GameView;
  board: Board | null;

  constructor(app: Application) {
    this.app = app;
    this.currentView = GameView.UNINITIALIZED;
    this.board = null;
  }

  private clear() {
    while (this.app.stage.children[0]) {
      this.app.stage.removeChild(this.app.stage.children[0]);
    }
    document.querySelectorAll("#main-div > div").forEach((div) => {
      (<HTMLElement>div).style["display"] = "none";
    });
  }

  private changeView(newView: GameView) {
    this.clear();
    this.currentView = newView;
  }

  mainMenu() {
    this.changeView(GameView.MAIN_MENU);
    const mainMenu = new MainMenu(this);
    mainMenu.setup();
  }

  startGame(width: number, height: number, bombs: number) {
    this.changeView(GameView.GAME);
    this.board = new Board(this, width, height);

    this.app.stage.addChild(this.board.container);
    this.board.container.x = this.app.screen.width / 2;
    this.board.container.y = this.app.screen.height / 2;
    this.board.container.pivot.x = this.board.container.width / 2;
    this.board.container.pivot.y = this.board.container.height / 2;

    this.board.setup();
    this.board.plant(bombs);
  }
}
