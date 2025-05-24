import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$, ILevelScreenData } from './level.screen';

export const createGainNewPasswordScreenFn$ = (
  data: ILevelScreenData,
): ScreenFn$ => {
  return (game: Game) => {
    drawSync(game, data);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createLevelScreenFn$(data));
      }),
    );
  };
};

const drawSync = (game: Game, data: ILevelScreenData): void => {
  game.canvas.clearScreen();
  game.canvas.drawDialog([
    `NIVEAU ${data.level.stage} ATTEINT!`,
    `CODE D'ACCÈS: ${data.level.password}`,
    'APPUYEZ SUR ✓',
  ]);
};
