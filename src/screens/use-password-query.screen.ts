import { filter, merge, tap } from 'rxjs';
import { XBoxGamepadButtons } from '../gamepad-events';
import { getGameConfig } from '../config';
import { ScreenFn$, Game } from '../mordicus';
import { createPasswordInputScreenFn$ } from './password-input.screen';
import { createLevelScreenFn$ } from './level.screen';

export const createUsePasswordQueryScreenFn$ = (): ScreenFn$ => {
  return (game: Game) => {
    drawSync(game);

    return merge(
      merge(
        game.keyboardEvents.number$.pipe(filter((key) => key === '1')),
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.A),
      ).pipe(
        tap(() => {
          game.screenFn$$.next(createPasswordInputScreenFn$());
        }),
      ),
      merge(
        game.keyboardEvents.number$.pipe(filter((key) => key === '2')),
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.B),
      ).pipe(
        tap(() => {
          game.screenFn$$.next(
            createLevelScreenFn$({
              level: game.levels.getFirstLevel(),
              score: 0,
              lives: getGameConfig().startLives,
            }),
          );
        }),
      ),
    );
  };
};

const drawSync = (game: Game): void => {
  game.canvas.clearScreen();
  game.canvas.drawDialog(['AVEZ-VOUS UN', `CODE D'ACCÈS?`, '1-OUI   2-NON']);
};
