import { Application } from "pixi.js";
import { APP_BG_COLOR, APP_HEIGHT, APP_WIDTH } from "./consts.ts";
import { Game } from "./game.ts";

async function main() {
  const app = new Application();

  await app.init({ background: APP_BG_COLOR, height: APP_HEIGHT, width: APP_WIDTH });

  document.body.appendChild(app.canvas);

  const game = new Game(app);
  game.mainMenu();
}

main();
