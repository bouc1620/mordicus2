import { DeepReadonly } from 'ts-essentials';
import { UnitType } from './units';
import * as Directions from './directions';

type WritableGridType = UnitType[][];
export type GridType = DeepReadonly<WritableGridType>;

export type Coordinates = {
  x: number;
  y: number;
};

export const isSameCoordinate = (a?: Coordinates, b?: Coordinates): boolean =>
  a?.x === b?.x && a?.y === b?.y;

export const emptyGrid: GridType = Array.from({
  length: 9,
}).map(() =>
  Array.from({
    length: 12,
  }).map(() => '⬛' as const),
);

export const isSameGrid = (a: GridType, b: GridType): boolean =>
  JSON.stringify(a) === JSON.stringify(b);

export const copyGrid = (grid: GridType): WritableGridType =>
  grid.map((row) => row.slice());

export const getUnitAtPos = (
  grid: GridType,
  pos: Coordinates,
): UnitType | undefined => grid[pos.y]?.[pos.x];

export const getForwardPos = (
  from: Coordinates,
  dir: Directions.DirectionType,
  nth = 1,
): Coordinates => ({
  x: from.x + Directions.deltas[dir].x * nth,
  y: from.y + Directions.deltas[dir].y * nth,
});

export const getUnitForward = (
  grid: GridType,
  from: Coordinates,
  dir: Directions.DirectionType,
  nth = 1,
): UnitType | undefined => getUnitAtPos(grid, getForwardPos(from, dir, nth));

export const findAllUnitsOfTypes = (
  grid: GridType,
  unit: UnitType | UnitType[],
): Coordinates[] =>
  grid.reduce(
    (coordinates, row, y) => [
      ...coordinates,
      ...row
        .map((u, xPos) => ({ u, xPos }))
        .filter(({ u }) => (Array.isArray(unit) ? unit : [unit]).includes(u))
        .map(({ xPos }) => ({ x: xPos, y })),
    ],
    [] as Coordinates[],
  );

export const findMordicus = (grid: GridType): Coordinates | undefined =>
  findAllUnitsOfTypes(grid, '😮')[0];

export const getNeighborPos = (grid: GridType, from: Coordinates): Coordinates[] =>
  Directions.all
    .map((dir) => getForwardPos(from, dir))
    .filter((pos) => !!getUnitAtPos(grid, pos));

export const getSetOfNeighboringUnits = (
  grid: GridType,
  from: Coordinates,
): UnitType[] => [
  ...new Set(
    getNeighborPos(grid, from)
      .map((pos) => getUnitAtPos(grid, pos))
      .filter((unit) => !!unit),
  ),
];

export const executeMove = (grid: GridType, move: Directions.Move): GridType => {
  const copy = copyGrid(grid);
  for (const dest of Array.isArray(move.to) ? move.to : [move.to]) {
    copy[dest.y][dest.x] = move.replaceWith ?? copy[move.from.y][move.from.x];
  }
  copy[move.from.y][move.from.x] = '⬛';
  return copy;
};

export const executeMovesSequentially = (
  grid: GridType,
  moves: Directions.Move[],
): GridType => moves.reduce((accGrid, move) => executeMove(accGrid, move), grid);
