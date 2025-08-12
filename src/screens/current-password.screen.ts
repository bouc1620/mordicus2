import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createTitleScreenFn$ } from './title.screen';

export const createCurrentPasswordScreenFn$ = (stage: number): ScreenFn$ => {
  return (game: Game) => {
    const password = game.levels.getCheckpointForStage(stage).password;

    drawSync(game, password);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createTitleScreenFn$());
      }),
    );
  };
};

const drawSync = (game: Game, password: string): void => {
  game.canvas.clearScreen();
  game.canvas.drawDialog([
    'VOICI VOTRE',
    `CODE D'ACCÈS: ${password}`,
    'APPUYEZ SUR ✓',
  ]);
};
