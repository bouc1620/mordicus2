import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createTitleScreenFn$ } from './title.screen';
import { getGameConfig } from '../config';

interface IGameCompleteScreenData {
  score: number;
}

export const createGameCompleteScreenFn$ = (
  data: IGameCompleteScreenData,
): ScreenFn$ => {
  updateBestTotalScore(data.score);

  return (game: Game) => {
    drawSync(game, data);

    return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
      tap(() => {
        game.screenFn$$.next(createTitleScreenFn$());
      }),
    );
  };
};

const getBestTotalScoreKey = (): string =>
  `best-total-score-${getGameConfig().levelType}-levels`;

export const getBestTotalScore = (): number =>
  Number.parseInt(localStorage.getItem(getBestTotalScoreKey()) ?? '0');

export const updateBestTotalScore = (score: number): void =>
  localStorage.setItem(
    getBestTotalScoreKey(),
    `${Math.max(score, getBestTotalScore())}`,
  );

const drawSync = (game: Game, data: IGameCompleteScreenData) => {
  game.canvas.clearScreen();
  const current = `${data.score}`.padStart(6, '0');
  const best = `${getBestTotalScore()}`.padStart(6, '0');
  game.canvas.drawDialog([
    'FÉLICITATIONS!',
    `VOTRE SCORE: ${current}`,
    `MEILLEUR SCORE: ${best}`,
  ]);
};
