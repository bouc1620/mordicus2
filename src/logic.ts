import { assert, ElementOf } from 'ts-essentials';
import * as Directions from './directions';
import * as Grid from './grid';
import { StateSnapshot } from './game-state';
import * as Units from './units';

export const isPlayerDead = (state: StateSnapshot): boolean =>
  !Grid.findMordicus(state.grid);

export const isGameOver = (state: StateSnapshot): boolean => state.lives === 0;

export const isSuccess = (state: StateSnapshot): boolean => {
  return (
    !isPlayerDead(state) &&
    !Grid.getSetOfNeighboringUnits(
      state.grid,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      Grid.findMordicus(state.grid)!,
    ).some((unit) => Units.attackers.some((attacker) => attacker === unit)) &&
    Grid.findAllUnitsOfTypes(state.grid, '🍌').length === 0 &&
    Grid.findAllUnitsOfTypes(state.grid, '🟡').length === 0
  );
};

export const getMoveResultQueue = (
  state: StateSnapshot,
  dir: Directions.DirectionType,
): ReadonlyArray<StateSnapshot> => {
  const moveResult = getActiveMoveResult(state, dir);
  return [moveResult, ...getResolveStateResults(moveResult)];
};

export const getActiveMoveResult = (
  state: StateSnapshot,
  dir: Directions.DirectionType,
): StateSnapshot => {
  const mordicus = Grid.findMordicus(state.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  const unitForward = Grid.getUnitForward(state.grid, mordicus, dir);
  if (unitForward === '🟡' || unitForward === '⬛') {
    return getFreeMoveResult(state, dir);
  } else if (
    unitForward &&
    Units.moveables.some((moveable) => moveable === unitForward)
  ) {
    return getPushMoveResult(state, dir);
  }

  return state;
};

export const getPassiveMovesResult = (state: StateSnapshot): StateSnapshot => ({
  ...state,
  grid: Grid.executeMovesSequentially(state.grid, [
    ...getGorillaMoves(state.grid, '🐵'),
    ...getGorillaMoves(state.grid, '🦍'),
    ...getFreeArrowMoves(state.grid),
  ]),
});

export const getResolveStateResults = (state: StateSnapshot): StateSnapshot[] => {
  const queue: StateSnapshot[] = [];

  if (isSuccess(state)) {
    return queue;
  }

  let previous = state;
  let current = getPassiveMovesResult(previous);
  while (
    !Grid.isSameGrid(previous.grid, current.grid) &&
    !isSuccess(current) &&
    !isPlayerDead(current)
  ) {
    queue.push(current);
    previous = current;
    current = getPassiveMovesResult(previous);
  }

  if (isPlayerDead(current)) {
    queue.push({
      ...current,
      lives: current.lives - 1,
    });
  } else if (isSuccess(current)) {
    queue.push(current);
  }

  return queue;
};

const getFreeMoveResult = (
  state: StateSnapshot,
  dir: Directions.DirectionType,
): StateSnapshot => {
  const mordicus = Grid.findMordicus(state.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  return {
    ...state,
    grid: Grid.executeMove(state.grid, {
      from: mordicus,
      to: Grid.getForwardPos(mordicus, dir),
    }),
    bonus: Math.max(0, state.bonus - 5),
  };
};

const getPushMoveResult = (
  state: StateSnapshot,
  dir: Directions.DirectionType,
): StateSnapshot => {
  const mordicus = Grid.findMordicus(state.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  const moved: Grid.Coordinates[] = [];

  let forward = Grid.getForwardPos(mordicus, dir);
  let unitForward = Grid.getUnitAtPos(state.grid, forward);
  while (
    !!unitForward &&
    Units.moveables.some((moveable) => moveable === unitForward)
  ) {
    moved.push(forward);
    forward = Grid.getForwardPos(forward, dir);
    unitForward = Grid.getUnitAtPos(state.grid, forward);
  }

  if (
    moved.length === 0 ||
    !unitForward ||
    Units.pushBlockers.some((pushBlocker) => pushBlocker === unitForward)
  ) {
    return state;
  }

  const moves: Directions.Move[] = [...moved].reverse().map((pos) => ({
    from: pos,
    to: Grid.getForwardPos(pos, dir),
  }));

  return getFreeMoveResult(
    {
      ...state,
      grid: Grid.executeMovesSequentially(state.grid, moves),
    },
    dir,
  );
};

const getGorillaMoves = (
  grid: Grid.GridType,
  gorilla: Extract<Units.UnitType, ElementOf<typeof Units.attackers>>,
): Directions.Move[] =>
  Grid.findAllUnitsOfTypes(grid, gorilla)
    .map((pos) => ({
      from: pos,
      to: Grid.getNeighborPos(grid, pos).filter((dest) => {
        const unit = Grid.getUnitAtPos(grid, dest);
        return unit === '😮' || unit === '🍌';
      }),
      replaceWith: gorilla === '🐵' ? ('🙈' as const) : undefined,
    }))
    .filter((move) => move.to.length !== 0);

const getFreeArrowMoves = (grid: Grid.GridType): Directions.Move[] =>
  Directions.arrowDirections
    .flatMap(({ unit, direction }) =>
      Grid.findAllUnitsOfTypes(grid, unit)
        .filter((pos) => Grid.getUnitForward(grid, pos, direction) === '⬛')
        .map((pos) => ({
          from: pos,
          to: Grid.getForwardPos(pos, direction),
        })),
    )
    .map((move, _index, arr) =>
      arr
        .filter(({ from }) => !Grid.isSameCoordinate(move.from, from))
        .some(({ to }) => Grid.isSameCoordinate(move.to, to))
        ? {
            ...move,
            replaceWith: '🟥',
          }
        : move,
    );
