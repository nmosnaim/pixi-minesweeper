import { Application } from "pixi.js";
import {
  APP_BG_COLOR,
  APP_HEIGHT,
  APP_WIDTH,
  GAME_DEFAULT_BOMBS,
  GAME_DEFAULT_HEIGHT,
  GAME_DEFAULT_WIDTH,
} from "./consts.ts";
import { Game } from "./game.ts";

function setInputValue(inputId: string, value: number) {
  const input = <HTMLInputElement>document.getElementById(inputId);
  input.value = value.toString();
}

async function main() {
  const app = new Application();

  await app.init({ background: APP_BG_COLOR, height: APP_HEIGHT, width: APP_WIDTH });

  const mainDiv = document.getElementById("main-div");
  if (mainDiv === null) {
    throw Error("#main-div not found");
  }
  mainDiv.style.width = `${APP_WIDTH}px`;
  mainDiv.style.height = `${APP_HEIGHT}px`;
  mainDiv.appendChild(app.canvas);

  // set default settings in menu
  setInputValue("main-menu-width-input", GAME_DEFAULT_WIDTH);
  setInputValue("main-menu-height-input", GAME_DEFAULT_HEIGHT);
  setInputValue("main-menu-bombs-input", GAME_DEFAULT_BOMBS);

  const game = new Game(app);
  if (!game.restoreSavedGame()) game.mainMenu();
}

main();
