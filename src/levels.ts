import { assert } from 'ts-essentials';
import { from, Observable, switchMap, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { getGameConfig } from './config';
import * as Grid from './grid';

export type LevelType = 'original' | 'custom';

export type Level = Readonly<{
  grid: Grid.GridType;
  levelType: LevelType;
  stage: number;
  password: string;
}>;

const simpleLength6Hash = (str: string): string =>
  [...str]
    .reduce((hash, char) => (Math.imul(31, hash) + char.charCodeAt(0)) | 0, 123456)
    .toString()
    .slice(-6);

const getAugmentedGrid = (
  grid: Grid.GridType,
  levelType: LevelType,
  index: number,
): Omit<Level, 'password'> => ({
  grid,
  levelType,
  stage: index + 1,
});

export const getBestBonusForLevel = (password: string): number =>
  Number.parseInt(localStorage.getItem(password) ?? '0');

export const updateBestScore = (password: string, bonusLeft: number): void =>
  localStorage.setItem(
    password,
    `${Math.max(bonusLeft, getBestBonusForLevel(password))}`,
  );

const lastLevelPasswordKey = 'last-level-password';

export const getSavedPassword = (): string | undefined => {
  return localStorage.getItem(lastLevelPasswordKey) ?? undefined;
};

export class Levels {
  private _originalLevelsMap = new Map<string, Level>();
  private _customLevelsMap = new Map<string, Level>();

  init$(): Observable<unknown> {
    return fromFetch('./levels/levels.json').pipe(
      switchMap((response) => from(response.json())),
      tap((levels: { original: Grid.GridType[]; custom: Grid.GridType[] }) => {
        for (const [levelType, list] of Object.entries(levels) as [
          LevelType,
          Grid.GridType[],
        ][]) {
          list.forEach((grid, index) => {
            let password = simpleLength6Hash(JSON.stringify(grid));
            while (
              this._originalLevelsMap.has(password) ||
              this._customLevelsMap.has(password)
            ) {
              password = `${Number(password) + 1}`.slice(-6).padStart(6, '0');
            }

            const levelsMap =
              levelType === 'original'
                ? this._originalLevelsMap
                : this._customLevelsMap;
            levelsMap.set(password, {
              ...getAugmentedGrid(grid, levelType, index),
              password,
            });
          });
        }

        // // log all level passwords
        // for (const levelsMap of [this._originalLevelsMap, this._customLevelsMap]) {
        //   const iter = levelsMap.entries();
        //   let value;
        //   let stage = 1;
        //   while ((value = iter.next().value)) {
        //     console.log(
        //       `${value[1].levelType} level #${stage} password: ${value[0]}`,
        //     );
        //     stage++;
        //   }
        // }
      }),
    );
  }

  findLevelWithPassword(password: string): Level | undefined {
    return (
      this._originalLevelsMap.get(password) ?? this._customLevelsMap.get(password)
    );
  }

  findLevelWithStageNumber(
    stage: number,
    levelType: 'original' | 'custom' = 'original',
  ): Level | undefined {
    assert(
      stage > 0,
      `stage number should be an integer greater than zero, requested stage #${stage}`,
    );

    const levelsMap =
      levelType === 'original' ? this._originalLevelsMap : this._customLevelsMap;
    const iter = levelsMap.entries();
    while (--stage > 0) iter.next();
    return iter.next().value?.[1];
  }

  getFirstPassword(): string | undefined {
    const gameConfig = getGameConfig();
    return this.getCurrentPassword(
      Math.max(gameConfig.getPasswordEveryXLevels - 1, 1),
    );
  }

  getCurrentPassword(stage: number): string | undefined {
    const gameConfig = getGameConfig();
    const checkpointStage = Math.max(
      ~~(stage / gameConfig.getPasswordEveryXLevels) *
        gameConfig.getPasswordEveryXLevels,
      1,
    );

    return this.findLevelWithStageNumber(checkpointStage, gameConfig.levelType)
      ?.password;
  }

  saveCurrentPassword(stage: number): void {
    const password = this.getCurrentPassword(stage);

    if (!password) {
      return;
    }

    localStorage.setItem(lastLevelPasswordKey, password);
  }
}
