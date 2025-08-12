import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';

export const createConfirmScreenFn$ = (next$: ScreenFn$): ScreenFn$ => {
  return (game: Game) => {
    drawSync(game);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(next$);
      }),
    );
  };
};

const drawSync = (game: Game): void => {
  game.canvas.drawDialog(['', 'APPUYEZ SUR ✓']);
};
