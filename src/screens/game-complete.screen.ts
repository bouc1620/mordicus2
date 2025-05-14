import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { LevelType } from '../levels';
import { createTitleScreenFn$ } from './title.screen';

interface IGameCompleteScreenData {
  score: number;
  levelType: LevelType;
}

export const createGameCompleteScreenFn$ = (
  data: IGameCompleteScreenData,
): ScreenFn$ => {
	updateBestTotalScore(data.levelType, data.score);

  return (game: Game) => {
    drawSync(game, data);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createTitleScreenFn$());
      }),
    );
  };
};

const getBestTotalScoreKey = (levelType: LevelType): string =>
  `best-total-score-${levelType}-levels`;

export const getBestTotalScore = (levelType: LevelType): number =>
  Number.parseInt(localStorage.getItem(getBestTotalScoreKey(levelType)) ?? '0');

export const updateBestTotalScore = (levelType: LevelType, score: number): void =>
  localStorage.setItem(
    getBestTotalScoreKey(levelType),
    `${Math.max(score, getBestTotalScore(levelType))}`,
  );

const drawSync = (game: Game, data: IGameCompleteScreenData) => {
  game.canvas.clearScreen();
  const current = `${data.score}`.padStart(6, '0');
  const best = `${getBestTotalScore(data.levelType)}`.padStart(6, '0');
  game.canvas.drawDialog([
    'FÉLICITATIONS!',
    `VOTRE SCORE: ${current}`,
    `MEILLEUR SCORE: ${best}`,
  ]);
};
