import { assert } from 'ts-essentials';
import * as Grid from './grid';
import { from, Observable, switchMap, tap } from 'rxjs';
import { fromFetch } from 'rxjs/fetch';

export type Level = Readonly<{
  grid: Grid.GridType;
  isCustom: boolean;
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
  isCustom: boolean,
  index: number,
): Omit<Level, 'password'> => ({
  grid,
  isCustom,
  stage: index + 1,
});

const lastPlayedLevelPasswordKey = 'last-level-password';

export const getLastPlayedLevelPassword = (): string | null =>
  localStorage.getItem(lastPlayedLevelPasswordKey);

export const setLastPlayedLevelPassword = (password: string): void =>
  localStorage.setItem(lastPlayedLevelPasswordKey, password);

export class Levels {
  private _originalLevels = new Map<string, Level>();
  private _customLevels = new Map<string, Level>();

  loadLevels$(): Observable<unknown> {
    return fromFetch('./levels/levels.json').pipe(
      switchMap((response) => from(response.json())),
      tap((levels: { original: Grid.GridType[]; custom: Grid.GridType[] }) => {
        for (const [type, list] of Object.entries(levels)) {
          const isCustom = type === 'custom';
          list.forEach((grid, index) => {
            let password = simpleLength6Hash(JSON.stringify(grid));
            while (
              this._originalLevels.has(password) ||
              this._customLevels.has(password)
            ) {
              password = `${Number(password) + 1}`.slice(-6).padStart(6, '0');
            }

            const levelsMap = isCustom ? this._customLevels : this._originalLevels;
            levelsMap.set(password, {
              ...getAugmentedGrid(grid, isCustom, index),
              password,
            });
          });
        }

        // // logs all level passwords
        // for (const levelsMap of [this._originalLevels, this._customLevels]) {
        //   const iter = levelsMap.entries();
        //   let value;
        //   let stage = 1;
        //   while ((value = iter.next().value)) {
        //     console.log(
        //       `${value[1].isCustom ? 'custom' : 'original'} level #${stage} password: ${value[0]}`,
        //     );
        //     stage++;
        //   }
        // }
      }),
    );
  }

  findLevelWithPassword(password: string): Level | undefined {
    return this._originalLevels.get(password) ?? this._customLevels.get(password);
  }

  findLevelWithStageNumber(stage: number, isCustom = false): Level | undefined {
    assert(
      stage > 0,
      `stage number should be an integer greater than zero, requested stage #${stage}`,
    );

    const levelsMap = !isCustom ? this._originalLevels : this._customLevels;
    const iter = levelsMap.entries();
    while (--stage > 0) iter.next();
    return iter.next().value?.[1];
  }
}
