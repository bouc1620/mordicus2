import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$, ILevelScreenData } from './level.screen';

export const createRetryLevelQueryScreenFn$ = (
  data: ILevelScreenData,
): ScreenFn$ => {
  return (game: Game) => {
    game.canvas.drawDialog(['ESSAYEZ ENCORE!', '', 'APPUYEZ SUR ✓']);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createLevelScreenFn$(data));
      }),
    );
  };
};
