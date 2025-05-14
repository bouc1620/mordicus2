import { assert } from 'ts-essentials';
import { Game } from './mordicus';

window.addEventListener('load', () => {
  const canvas = document.getElementById('canvas');

  assert(canvas, 'no canvas element found');

  const game = new Game(canvas as HTMLCanvasElement);
  game.start$().subscribe();
});
