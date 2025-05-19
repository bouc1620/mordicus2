import { filter, merge, tap } from 'rxjs';
import { XBoxGamepadButtons } from '../gamepad-events';
import { getBestBonusForLevel, Level } from '../levels';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$ } from './level.screen';
import { createGameCompleteScreenFn$ } from './game-complete.screen';
import { getGameConfig } from '../config';

export const createLevelCompleteScreenFn$ = (data: {
  level: Level;
  previousScore: number;
  newScore: number;
  lives: number;
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
            const gainNewLifeAfterXPoints = getGameConfig().gainNewLifeAfterXPoints;
            const lives = Math.min(
              data.lives +
                (~~(data.previousScore / gainNewLifeAfterXPoints) <
                ~~(data.newScore / gainNewLifeAfterXPoints)
                  ? 1
                  : 0),
              99,
            );

            game.screenFn$$.next(
              createLevelScreenFn$({
                level: nextLevel,
                score: data.newScore,
                lives,
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
