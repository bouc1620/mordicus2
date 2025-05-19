import { ElementOf } from 'ts-essentials';
import { Coordinates } from './grid';
import { Arrow, UnitType } from './units';

export type DirectionType = ElementOf<typeof all>;
export type Move = {
  from: Coordinates;
  to: Coordinates | Coordinates[];
  replaceWith?: UnitType;
};

export const all = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'] as const;

export const deltas: Record<DirectionType, Coordinates> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowRight: { x: 1, y: 0 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
};

export const arrowDirections: { unit: Arrow; direction: DirectionType }[] = [
  {
    unit: '⬆️',
    direction: 'ArrowUp',
  },
  {
    unit: '➡️',
    direction: 'ArrowRight',
  },
  {
    unit: '⬇️',
    direction: 'ArrowDown',
  },
  {
    unit: '⬅️',
    direction: 'ArrowLeft',
  },
];

export const isDirectionKey = (key: unknown): key is DirectionType =>
  all.includes(key as DirectionType);
