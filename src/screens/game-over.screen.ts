import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createTitleScreenFn$ } from './title.screen';

export const createGameOverScreenFn$ = (stage: number): ScreenFn$ => {
  return (game: Game) => {
    const password = game.levels.getPasswordOnStage(stage);

    drawSync(game, password);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createTitleScreenFn$());
      }),
    );
  };
};

const drawSync = (game: Game, password: string): void => {
  game.canvas.drawDialog([
    'VOICI VOTRE',
    `CODE D'ACCÈS: ${password}`,
    'APPUYEZ SUR ✓',
  ]);
};
