import BezierEasing from 'bezier-easing';

export const viewConfig = Object.freeze({
  width: 256,
  height: 200,
  scalingFactor: 4,
  activeMoveDuration: 170,
  passiveMoveDuration: 350,
  activeMoveBezierEasing: BezierEasing(0.3, 0, .9, 1),
  passiveMoveBezierEasing: BezierEasing(.5, 0.5, 0, 1),
});

export const gameConfig = Object.freeze({
  startBonus: 1000,
  pointsPerLevel: 1000,
  startLives: 5,
  levelType: 'original',
});
