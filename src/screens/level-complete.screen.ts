import { filter, merge, tap } from 'rxjs';
import { XBoxGamepadButtons } from '../gamepad-events';
import { getBestBonusForLevel, Level } from '../levels';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$ } from './level.screen';
import { createGameCompleteScreenFn$ } from './game-complete.screen';

export const createLevelCompleteScreenFn$ = (data: {
  level: Level;
  lives: number;
  previousScore: number;
  newScore: number;
}): ScreenFn$ => {
  return (game: Game) => {
    drawSync(game, data.level.password);

    return merge(
      merge(
        game.keyboardEvents.number$.pipe(filter((key) => key === '1')),
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.A),
      ).pipe(
        tap(() => {
          game.screenFn$$.next(
            createLevelScreenFn$({
              ...data,
              score: data.previousScore,
            }),
          );
        }),
      ),
      merge(
        game.keyboardEvents.number$.pipe(filter((key) => key === '2')),
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.B),
      ).pipe(
        tap(() => {
          const nextLevel = game.levels.findLevelWithStageNumber(
            data.level.stage + 1,
          );

          if (nextLevel) {
            game.screenFn$$.next(
              createLevelScreenFn$({
                level: nextLevel,
                lives: data.lives,
                score: data.newScore,
              }),
            );
          } else {
            game.screenFn$$.next(
              createGameCompleteScreenFn$({
                score: data.newScore,
                levelType: data.level.levelType,
              }),
            );
          }
        }),
      ),
    );
  };
};

const drawSync = (game: Game, password: string): void => {
  const best = `${getBestBonusForLevel(password)}`.padStart(4, '0');
  game.canvas.drawDialog([
    `MEILLEUR ESSAI: ${best}`,
    '1-RÉESSAYER CE NIVEAU',
    '2-NIVEAU SUIVANT',
  ]);
};
