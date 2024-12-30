import { Application } from "pixi.js";
import { Game } from "./game.ts";

async function main() {
  const app = new Application();

  await app.init({ background: "#1099bb", height: 800, width: 1200 });

  document.body.appendChild(app.canvas);

  const game = new Game(app);
  game.mainMenu();
}

main();
