import { Application } from "pixi.js";
import { Board } from "./logic.ts";

async function main() {
  const app = new Application();

  await app.init({ background: "#1099bb", height: 800, width: 1200 });

  document.body.appendChild(app.canvas);

  const board = new Board(30, 20);

  app.stage.addChild(board.container);
  board.container.x = app.screen.width / 2;
  board.container.y = app.screen.height / 2;
  board.container.pivot.x = board.container.width / 2;
  board.container.pivot.y = board.container.height / 2;

  board.plant(120);
}

main();
