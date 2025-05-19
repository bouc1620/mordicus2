import BezierEasing from 'bezier-easing';
import { LevelType } from './levels';

export type GameType = 'remake' | 'original';

interface IGameConfig {
  startBonus: number;
  pointsPerLevel: number;
  startLives: number;
  gainNewLifeAfterXPoints: number;
  levelType: LevelType;
  gameType: GameType;
  getPasswordEveryXLevels: number;
  undoMoveEnabled: boolean;
}

export const viewConfig = Object.freeze({
  width: 256,
  height: 200,
  scalingFactor: 4,
  activeMoveDuration: 170,
  passiveMoveDuration: 350,
  activeMoveBezierEasing: BezierEasing(0.3, 0, 0.9, 1),
  passiveMoveBezierEasing: BezierEasing(0.16, 1, 0.3, 1),
});

const baseGameConfig = Object.freeze({
  startBonus: 1000,
  pointsPerLevel: 1000,
  startLives: 5,
  gainNewLifeAfterXPoints: 10000,
  levelType: 'original',
});

const remakeGameConfig: IGameConfig = Object.freeze({
  ...baseGameConfig,
  gameType: 'remake',
  getPasswordEveryXLevels: 1,
  undoMoveEnabled: true,
});

const originalGameConfig: IGameConfig = Object.freeze({
  ...baseGameConfig,
  gameType: 'original',
  getPasswordEveryXLevels: 10,
  undoMoveEnabled: false,
});

const useOriginalGameConfigStorageKey = 'use-original-game-config';

export const getGameConfig = (): IGameConfig => {
  return localStorage.getItem(useOriginalGameConfigStorageKey)
    ? originalGameConfig
    : remakeGameConfig;
};

export const toggleUseOriginalGameConfig = (): void => {
  if (getGameConfig().gameType === 'original') {
    localStorage.removeItem(useOriginalGameConfigStorageKey);
  } else {
    localStorage.setItem(useOriginalGameConfigStorageKey, 'true');
  }
};
