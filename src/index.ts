import { Game } from './mordicus';

window.addEventListener('load', () => {
  const game = new Game(document.getElementById('canvas') as HTMLCanvasElement);
  game.start$.subscribe();
});
