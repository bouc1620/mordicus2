import {
  animationFrameScheduler,
  concat,
  defer,
  exhaustMap,
  filter,
  interval,
  last,
  map,
  merge,
  Observable,
  of,
  switchMap,
  takeWhile,
  tap,
} from 'rxjs';
import { getGameConfig, viewConfig } from '../config';
import { Level, updateBestScore } from '../levels';
import { XBoxGamepadButtons } from '../gamepad-events';
import * as Grid from '../grid';
import * as Logic from '../logic';
import * as Directions from '../directions';
import { Game, ScreenFn$ } from '../mordicus';
import { createGameOverScreenFn$ } from './game-over.screen';
import { createRetryLevelQueryScreenFn$ } from './retry-level-query.screen';
import { createLevelCompleteScreenFn$ } from './level-complete.screen';

export interface ILevelScreenData {
  level: Level;
  score: number;
  lives: number;
}

interface ILevelScreenState extends ILevelScreenData {
  grid: Grid.GridType;
  bonus: number;
}

class UndoRedoStack {
  private _list: Logic.ILevelSnapshot[] = [];
  private _pos = 0;

  undo(): Logic.ILevelSnapshot | undefined {
    this._pos = Math.max(0, this._pos - 1);
    return this._list[this._pos];
  }

  redo(): Logic.ILevelSnapshot | undefined {
    this._pos = Math.min(this._list.length - 1, this._pos + 1);
    return this._list[this._pos];
  }

  push(snapshot: Logic.ILevelSnapshot): void {
    this._list = this._list.slice(0, this._pos + 1);
    this._list.push(snapshot);
    this._pos = this._list.length - 1;
  }
}

export const createLevelScreenFn$ = (data: ILevelScreenData): ScreenFn$ => {
  const state: ILevelScreenState = {
    ...data,
    grid: Grid.copyGrid(data.level.grid),
    bonus: getGameConfig().startBonus,
  };

  const undoStack = getGameConfig().undoMoveEnabled
    ? new UndoRedoStack()
    : undefined;

  return (game: Game) => {
    // avoid overwritting the saved password with the first available password
    if (
      game.levels.getCurrentPassword(state.level.stage) !==
      game.levels.getFirstPassword()
    ) {
      game.levels.saveCurrentPassword(state.level.stage);
    }

    drawSync(game, state);

    return merge(
      of(undefined),
      merge(
        game.keyboardEvents.escape$,
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
      ).pipe(
        filter(
          () => !Logic.isPlayerDead(state.grid) && !Logic.isSuccess(state.grid),
        ),
        map(() => 'abort' as const),
      ),
    ).pipe(
      switchMap((event) => {
        if (event === 'abort') {
          return of(undefined).pipe(
            tap(() => {
              state.lives = state.lives - 1;
              drawInGameMenu(game, state);

              if (state.lives === 0) {
                game.screenFn$$.next(createGameOverScreenFn$(state.level.stage));
              } else {
                game.screenFn$$.next(createRetryLevelQueryScreenFn$(state));
              }
            }),
          );
        }

        return merge(
          of(undefined),
          merge(game.keyboardEvents.direction$, game.gamepadEvents.direction$),
          merge(
            game.keyboardEvents.all$.pipe(filter((key) => key === 'z')),
            merge(
              game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.LB),
              game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.LB, {
                delay: 30,
                initialDelay: 500,
              }),
            ),
          ).pipe(map(() => 'undo' as const)),
          merge(
            game.keyboardEvents.all$.pipe(filter((key) => key === 'y')),
            merge(
              game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.RB),
              game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.RB, {
                delay: 30,
                initialDelay: 500,
              }),
            ),
          ).pipe(map(() => 'redo' as const)),
        ).pipe(
          exhaustMap((key) => {
            if (key === 'undo' || key === 'redo') {
              return of(undefined).pipe(
                tap(() => {
                  const recoveredState =
                    key === 'undo' ? undoStack?.undo() : undoStack?.redo();

                  if (!recoveredState) {
                    return;
                  }

                  state.grid = Grid.copyGrid(recoveredState.grid);
                  state.bonus = recoveredState.bonus;
                  state.lives = recoveredState.lives;

                  drawSync(game, state);
                }),
              );
            }

            const snapshot = {
              grid: Grid.copyGrid(state.grid),
              bonus: state.bonus,
              lives: state.lives,
            };

            const moveQueue = !key
              ? [
                  { ...snapshot, moves: [] },
                  ...Logic.getResolvedStateResults(snapshot),
                ]
              : Logic.getMoveQueue(snapshot, key);

            if (moveQueue.length === 0) {
              return of(undefined);
            }

            return concat(
              ...moveQueue.map((stateTransition, index) => {
                return defer(() => {
                  const currentGrid = Grid.copyGrid(state.grid);

                  state.grid = Grid.copyGrid(stateTransition.grid);
                  state.bonus = stateTransition.bonus;
                  drawInGameMenu(game, state);

                  return getDrawMoveAnimations$(
                    game,
                    {
                      ...state,
                      grid: currentGrid,
                    },
                    stateTransition.moves,
                    index === 0,
                  ).pipe(
                    tap(() => {
                      state.lives = stateTransition.lives;
                      drawSync(game, state);
                    }),
                  );
                });
              }),
            ).pipe(
              last(),
              tap(() => {
                if (state.lives === 0) {
                  game.screenFn$$.next(createGameOverScreenFn$(state.level.stage));
                } else if (Logic.isPlayerDead(state.grid)) {
                  game.screenFn$$.next(createRetryLevelQueryScreenFn$(state));
                } else if (Logic.isSuccess(state.grid)) {
                  updateBestScore(state.level.password, state.bonus);

                  game.screenFn$$.next(
                    createLevelCompleteScreenFn$({
                      level: state.level,
                      previousScore: state.score,
                      newScore:
                        state.score + getGameConfig().pointsPerLevel + state.bonus,
                      lives: state.lives,
                    }),
                  );
                }

                undoStack?.push({
                  grid: Grid.copyGrid(state.grid),
                  bonus: state.bonus,
                  lives: state.lives,
                });
              }),
            );
          }),
        );
      }),
    );
  };
};

const getPosition = (
  from: Grid.Coordinates,
  to: Grid.Coordinates,
  easePos: number,
): [dx: number, dy: number] => {
  const isVertical = from.y !== to.y;

  if (isVertical) {
    const isUpward = from.y > to.y;

    return [
      from.x * 20 + 8,
      from.y * 20 + 10 + (isUpward ? -1 * easePos * 20 : easePos * 20),
    ];
  } else {
    const isLeft = from.x > to.x;

    return [
      from.x * 20 + 8 + (isLeft ? -1 * easePos * 20 : easePos * 20),
      from.y * 20 + 10,
    ];
  }
};

const getDrawMoveAnimations$ = (
  game: Game,
  state: ILevelScreenState,
  moves: Directions.Move[],
  isActiveMove: boolean,
): Observable<unknown> => {
  if (moves.length === 0) {
    return of(undefined);
  }

  const duration = isActiveMove
    ? viewConfig.activeMoveDuration
    : viewConfig.passiveMoveDuration;

  const start = performance.now();

  return interval(0, animationFrameScheduler).pipe(
    map(() => performance.now() - start),
    takeWhile((elapsed) => elapsed < duration),
    map((elapsed) => {
      const pos = elapsed / duration;
      return isActiveMove
        ? viewConfig.activeMoveBezierEasing(pos)
        : viewConfig.passiveMoveBezierEasing(pos);
    }),
    tap((easePos) => {
      drawSync(
        game,
        state,
        moves.map((move) => move.from),
      );

      for (const move of moves) {
        const [sprite, [sx, sy, sw, sh]] = game.images.getSprite(
          state.grid[move.from.y][move.from.x],
        );

        for (const to of Array.isArray(move.to) ? move.to : [move.to]) {
          game.canvas.context.drawImage(
            sprite,
            sx,
            sy,
            sw,
            sh,
            ...getPosition(move.from, to, easePos),
            sw,
            sh,
          );
        }
      }
    }),
    last(),
  );
};

const drawSync = (
  game: Game,
  state: ILevelScreenState,
  excluded?: Grid.Coordinates[],
): void => {
  game.canvas.clearScreen();
  drawInGameMenu(game, state);
  drawGrid(game, state.grid, excluded);
};

const drawInGameMenu = (game: Game, state: ILevelScreenState): void => {
  game.canvas.context.drawImage(game.images.getMenu('in-game-menus'), 0, 0);

  const score = `${state.score}`.padStart(6, '0');
  game.canvas.writeLine(`POINTS ${score}`, {
    x: 8,
    y: 0,
  });

  const bonus = `${state.bonus}`.padStart(4, '0');
  game.canvas.writeLine(`BONI ${bonus}`, {
    x: 160,
    y: 0,
  });

  const stage = `${state.level.stage}`.padStart(3, '0');
  game.canvas.writeLine(`NIVEAU ${stage}`, {
    x: 8,
    y: 192,
  });

  const lives = `${state.lives}`.padStart(2, '0');
  game.canvas.writeLine(`VIES ${lives}`, {
    x: 180,
    y: 192,
  });
};

const drawGrid = (
  game: Game,
  grid: Grid.GridType,
  excluded?: Grid.Coordinates[],
): void => {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (excluded?.some((pos) => Grid.isSameCoordinate({ x, y }, pos))) {
        continue;
      }

      const [sprite, [sx, sy, sw, sh]] = game.images.getSprite(grid[y][x]);

      game.canvas.context.drawImage(
        sprite,
        sx,
        sy,
        sw,
        sh,
        x * sw + 8,
        y * sh + 10,
        sw,
        sh,
      );
    }
  }
};
