import { assert, ElementOf } from 'ts-essentials';
import * as Directions from './directions';
import * as Grid from './grid';
import * as Units from './units';

export interface ILevelSnapshot {
  grid: Grid.GridType;
  bonus: number;
  lives: number;
}

export interface ILevelStateTransition extends ILevelSnapshot {
  moves: Directions.Move[];
}

export const isPlayerDead = (grid: Grid.GridType): boolean =>
  !Grid.findMordicus(grid);

export const isSuccess = (grid: Grid.GridType): boolean => {
  const mordicus = Grid.findMordicus(grid);

  return (
    !!mordicus &&
    !Grid.getSetOfNeighboringUnits(grid, mordicus).some((unit) =>
      Units.attackers.some((attacker) => attacker === unit),
    ) &&
    Grid.findAllUnitsOfTypes(grid, '🍌').length === 0 &&
    Grid.findAllUnitsOfTypes(grid, '🟡').length === 0
  );
};

export const getMoveQueue = (
  snapshot: ILevelSnapshot,
  dir: Directions.DirectionType,
): ReadonlyArray<ILevelStateTransition> => {
  const moveResult = getActiveMoveResult(snapshot, dir);

  if (!moveResult) {
    return [];
  }

  return [moveResult, ...getResolvedStateResults(moveResult)];
};

export const getActiveMoveResult = (
  snapshot: ILevelSnapshot,
  dir: Directions.DirectionType,
): ILevelStateTransition | undefined => {
  const mordicus = Grid.findMordicus(snapshot.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  const unitForward = Grid.getUnitForward(snapshot.grid, mordicus, dir);
  if (unitForward === '🟡' || unitForward === '⬛') {
    return getFreeMoveResult(snapshot, dir);
  } else if (
    unitForward &&
    Units.moveables.some((moveable) => moveable === unitForward)
  ) {
    return getPushMoveResult(snapshot, dir);
  }
};

export const getPassiveMovesResult = (
  snapshot: ILevelSnapshot,
): ILevelStateTransition => {
  const moves = [
    ...getGorillaMoves('🐵', snapshot.grid),
    ...getGorillaMoves('🦍', snapshot.grid),
    ...getFreeArrowMoves(snapshot.grid),
  ];

  return {
    ...snapshot,
    grid: Grid.executeMovesSequentially(snapshot.grid, moves),
    moves,
  };
};

export const getResolvedStateResults = (
  snapshot: ILevelSnapshot,
): ILevelStateTransition[] => {
  const queue: ILevelStateTransition[] = [];

  if (isSuccess(snapshot.grid)) {
    return queue;
  }

  let previous: ILevelStateTransition = {
    ...snapshot,
    moves: [],
  };
  let next = getPassiveMovesResult(snapshot);
  while (
    !Grid.isSameGrid(previous.grid, next.grid) &&
    !isSuccess(next.grid) &&
    !isPlayerDead(next.grid)
  ) {
    queue.push(next);
    previous = next;
    next = getPassiveMovesResult(previous);
  }

  if (isPlayerDead(next.grid)) {
    queue.push({
      ...next,
      lives: next.lives - 1,
    });
  } else if (isSuccess(next.grid)) {
    queue.push(next);
  }

  return queue;
};

const getFreeMoveResult = (
  snapshot: ILevelSnapshot,
  dir: Directions.DirectionType,
): ILevelStateTransition => {
  const mordicus = Grid.findMordicus(snapshot.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  const move = {
    from: mordicus,
    to: Grid.getForwardPos(mordicus, dir),
  };

  return {
    ...snapshot,
    grid: Grid.executeMove(snapshot.grid, move),
    bonus: Math.max(0, snapshot.bonus - 5),
    moves: [move],
  };
};

const getPushMoveResult = (
  snapshot: ILevelSnapshot,
  dir: Directions.DirectionType,
): ILevelStateTransition | undefined => {
  const mordicus = Grid.findMordicus(snapshot.grid);

  assert(mordicus, 'invalid grid, no Mordicus character found');

  const moved: Grid.Coordinates[] = [];

  let forward = Grid.getForwardPos(mordicus, dir);
  let unitForward = Grid.getUnitAtPos(snapshot.grid, forward);
  while (
    !!unitForward &&
    Units.moveables.some((moveable) => moveable === unitForward)
  ) {
    moved.push(forward);
    forward = Grid.getForwardPos(forward, dir);
    unitForward = Grid.getUnitAtPos(snapshot.grid, forward);
  }

  if (
    moved.length === 0 ||
    !unitForward ||
    Units.pushBlockers.some((pushBlocker) => pushBlocker === unitForward)
  ) {
    return undefined;
  }

  const moves: Directions.Move[] = [...moved].reverse().map((pos) => ({
    from: pos,
    to: Grid.getForwardPos(pos, dir),
  }));

  const freeMove = getFreeMoveResult(
    {
      ...snapshot,
      grid: Grid.executeMovesSequentially(snapshot.grid, moves),
    },
    dir,
  );

  return {
    ...freeMove,
    moves: [freeMove.moves[0], ...moves],
  };
};

const getGorillaMoves = (
  gorilla: Extract<Units.UnitType, ElementOf<typeof Units.attackers>>,
  grid: Grid.GridType,
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
