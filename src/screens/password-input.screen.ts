import { assert } from 'ts-essentials';
import { map, merge, tap } from 'rxjs';
import { XBoxGamepadButtons } from '../gamepad-events';
import { getGameConfig } from '../config';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$ } from './level.screen';
import { getSavedPassword } from '../levels';

export const createPasswordInputScreenFn$ = (): ScreenFn$ => {
  let input = getSavedPassword() ?? '';

  return (game: Game) => {
    drawSync(game, input);

    return merge(
      game.keyboardEvents.number$.pipe(
        tap((key) => {
          input = `${input.substring(0, 5)}${key}`;
          drawSync(game, input);
        }),
      ),
      merge(
        merge(
          game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.UP),
          game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.UP),
        ).pipe(map(() => 'ArrowUp' as const)),
        merge(
          game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.DOWN),
          game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.DOWN),
        ).pipe(map(() => 'ArrowDown' as const)),
      ).pipe(
        tap((key) => {
          const lastNum =
            (Number(input.slice(-1) || 0) + (key === 'ArrowUp' ? 1 : -1) + 10) % 10;
          input = `${input.slice(0, -1)}${lastNum}`;
          drawSync(game, input);
        }),
      ),
      merge(
        game.keyboardEvents.backspace$,
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.LEFT),
        game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.LEFT),
      ).pipe(
        tap(() => {
          input = `${input.slice(0, -1)}`;
          drawSync(game, input);
        }),
      ),
      merge(
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.RIGHT),
        game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.RIGHT),
      ).pipe(
        tap(() => {
          if (input.length === 6) {
            return;
          }

          input = `${input.substring(0, 5)}0`;
          drawSync(game, input);
        }),
      ),
      merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
        tap(() => {
          const level = game.levels.findLevelWithPassword(input);

          if (!level) {
            return;
          }

          game.screenFn$$.next(
            createLevelScreenFn$({
              level,
              score: 0,
              lives: getGameConfig().startLives,
            }),
          );
        }),
      ),
      merge(
        game.keyboardEvents.escape$,
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
      ).pipe(
        tap(() => {
          const level = game.levels.findLevelWithStageNumber(
            1,
            getGameConfig().levelType,
          );

          assert(level, 'unexpected error, could not find first level');

          game.screenFn$$.next(
            createLevelScreenFn$({
              level,
              score: 0,
              lives: getGameConfig().startLives,
            }),
          );
        }),
      ),
    );
  };
};

const drawSync = (game: Game, input: string): void => {
  game.canvas.clearScreen();
  game.canvas.drawDialog(['ENTREZ VOTRE', `CODE D'ACCÈS`, input.padEnd(6, '•')]);
};
