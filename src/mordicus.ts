import { assert } from 'ts-essentials';
import {
  defer,
  exhaustMap,
  filter,
  forkJoin,
  last,
  map,
  merge,
  Observable,
  of,
  startWith,
  switchMap,
  tap,
} from 'rxjs';
import { Canvas, toggleUseOriginalTitleScreen } from './canvas';
import {
  getLastPlayedLevelPassword,
  Levels,
  setLastPlayedLevelPassword,
} from './levels';
import * as Logic from './logic';
import {
  State,
  initalState,
  updateBestScore,
  updateBestTotalScore,
} from './game-state';
import { KeyboardEvents } from './keyboard-events';
import { XBoxGamepadButtons, GamepadEvents } from './gamepad-events';

export class Game {
  private _state = new State();
  private _levels = new Levels();
  private _canvas: Canvas;
  private _keyboardEvents: KeyboardEvents;
  private _gamepadEvents: GamepadEvents;

  constructor(private _canvasElement: HTMLCanvasElement) {
    this._canvas = new Canvas(this._canvasElement);
    this._keyboardEvents = new KeyboardEvents();
    this._gamepadEvents = new GamepadEvents(0);
  }

  get start$(): Observable<unknown> {
    return forkJoin({
      images: this._canvas.loadImages$(),
      levels: this._levels.loadLevels$(),
    }).pipe(
      switchMap(() =>
        this._state.screen$.pipe(
          switchMap((screen) => {
            this._canvas.drawSync(this._state.snapshot);
            switch (screen) {
              case 'title':
                return this._titleScreen$;
              case 'usePassword':
                return this._usePasswordScreen$;
              case 'inputPassword':
                return this._inputPasswordScreen$;
              case 'level':
                return this._levelScreen$;
              case 'retry':
                return this._retryScreen$;
              case 'complete':
                return this._completeScreen$;
              case 'gameOver':
                return this._gameOverScreen$;
              case 'end':
                return this._endScreen$;
            }
          }),
        ),
      ),
    );
  }

  private _titleScreen$ = defer(() =>
    merge(
      merge(
        this._keyboardEvents.toggleOriginalScreen$,
        merge(
          this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
          this._gamepadEvents.buttonRepeat$(XBoxGamepadButtons.Y, {
            delay: 30,
            initialDelay: 500,
          }),
        ),
      ).pipe(
        tap(() => {
          toggleUseOriginalTitleScreen();
          this._canvas.drawSync(this._state.snapshot);
        }),
      ),
      merge(this._keyboardEvents.confirm$, this._gamepadEvents.confirm$()).pipe(
        tap(() => this._state.update({ screen: 'usePassword' })),
      ),
    ),
  );

  private _usePasswordScreen$ = defer(() =>
    merge(
      merge(
        this._keyboardEvents.number$.pipe(filter((event) => event.key === '1')),
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.X),
      ).pipe(map(() => '1' as const)),
      merge(
        this._keyboardEvents.number$.pipe(filter((event) => event.key === '2')),
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.A),
      ).pipe(map(() => '2' as const)),
    ).pipe(
      tap((key) => {
        if (key === '1') {
          this._state.update({
            input: getLastPlayedLevelPassword() ?? initalState.password,
            screen: 'inputPassword',
          });
        } else {
          const firstLevel = this._levels.findLevelWithStageNumber(1);

          assert(firstLevel, 'unexpected error, could not find first level');

          setLastPlayedLevelPassword(firstLevel.password);

          this._state.update({
            screen: 'level',
            score: initalState.score,
            bonus: initalState.bonus,
            lives: initalState.lives,
            ...firstLevel,
          });
        }
      }),
    ),
  );

  private _inputPasswordScreen$ = defer(() =>
    merge(
      this._keyboardEvents.number$.pipe(
        tap((event) => {
          this._state.update({
            input: `${this._state.snapshot.input.substring(0, 5)}${event.key}`,
          });
          this._canvas.drawSync(this._state.snapshot);
        }),
      ),
      merge(
        merge(
          this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.UP),
          this._gamepadEvents.buttonRepeat$(XBoxGamepadButtons.UP),
        ).pipe(map(() => 'ArrowUp' as const)),
        merge(
          this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.DOWN),
          this._gamepadEvents.buttonRepeat$(XBoxGamepadButtons.DOWN),
        ).pipe(map(() => 'ArrowDown' as const)),
      ).pipe(
        tap((key) => {
          const lastNum =
            (Number(this._state.snapshot.input.slice(-1) || 0) +
              (key === 'ArrowUp' ? 1 : -1) +
              10) %
            10;
          this._state.update({
            input: `${this._state.snapshot.input.slice(0, -1)}${lastNum}`,
          });
          this._canvas.drawSync(this._state.snapshot);
        }),
      ),
      merge(
        this._keyboardEvents.backspace$,
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.LEFT),
      ).pipe(
        tap(() => {
          this._state.update({
            input: `${this._state.snapshot.input.slice(0, -1)}`,
          });
          this._canvas.drawSync(this._state.snapshot);
        }),
      ),
      this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.RIGHT).pipe(
        tap(() => {
          if (this._state.snapshot.input.length === 6) {
            return;
          }

          this._state.update({
            input: `${this._state.snapshot.input.substring(0, 5)}0`,
          });
          this._canvas.drawSync(this._state.snapshot);
        }),
      ),
      merge(
        this._keyboardEvents.enter$,
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.START),
      ).pipe(
        tap(() => {
          const level = this._levels.findLevelWithPassword(
            this._state.snapshot.input,
          );

          if (!level) {
            return;
          }

          setLastPlayedLevelPassword(level.password);

          this._state.update({
            screen: 'level',
            score: initalState.score,
            bonus: initalState.bonus,
            lives: initalState.lives,
            input: initalState.input,
            ...level,
          });
        }),
      ),
      merge(
        this._keyboardEvents.escape$,
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
      ).pipe(
        tap(() => {
          const firstLevel = this._levels.findLevelWithStageNumber(1);

          assert(firstLevel, 'unexpected error, could not find first level');

          setLastPlayedLevelPassword(firstLevel.password);

          this._state.update({
            screen: 'level',
            score: initalState.score,
            bonus: initalState.bonus,
            lives: initalState.lives,
            input: initalState.input,
            ...firstLevel,
          });
        }),
      ),
    ),
  );

  private _levelScreen$ = defer(() =>
    merge(
      of(undefined),
      merge(
        this._keyboardEvents.escape$,
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
      ).pipe(
        filter(
          () =>
            !Logic.isPlayerDead(this._state.snapshot) &&
            !Logic.isSuccess(this._state.snapshot),
        ),
        map(() => 'abort' as const),
      ),
    ).pipe(
      switchMap((event) =>
        event === 'abort'
          ? of(undefined).pipe(
              tap(() => {
                this._state.update({
                  lives: this._state.snapshot.lives - 1,
                });

                if (Logic.isGameOver(this._state.snapshot)) {
                  this._state.update({
                    screen: 'gameOver',
                  });
                } else {
                  this._state.update({
                    screen: 'retry',
                  });
                }
              }),
            )
          : merge(
              this._keyboardEvents.directionPad$(),
              this._gamepadEvents.directionPad$(),
            ).pipe(
              startWith(undefined),
              exhaustMap((key) =>
                key
                  ? this._canvas
                      .getMoveDrawingQueue$(
                        Logic.getMoveResultQueue(this._state.snapshot, key),
                        (state) => this._state.update(state),
                      )
                      .pipe(last())
                  : this._canvas.getMoveDrawingQueue$(
                      Logic.getResolveStateResults(this._state.snapshot),
                      (state) => this._state.update(state),
                    ),
              ),
              tap((snapshot) => {
                if (Logic.isGameOver(snapshot)) {
                  this._state.update({
                    ...snapshot,
                    screen: 'gameOver',
                  });
                } else if (Logic.isPlayerDead(snapshot)) {
                  this._state.update({
                    ...snapshot,
                    screen: 'retry',
                  });
                } else if (Logic.isSuccess(snapshot)) {
                  updateBestScore(snapshot);

                  this._state.update({
                    ...snapshot,
                    screen: 'complete',
                  });
                } else {
                  this._state.update(snapshot);
                }
              }),
            ),
      ),
    ),
  );

  private _retryScreen$ = defer(() =>
    merge(this._keyboardEvents.confirm$, this._gamepadEvents.confirm$()).pipe(
      tap(() => {
        const password = this._state.snapshot.password;
        const currentLevel = this._levels.findLevelWithPassword(password);

        assert(
          currentLevel,
          `unexpected error, could not find level with password ${password}`,
        );

        this._state.update({
          screen: 'level',
          bonus: initalState.bonus,
          ...currentLevel,
        });
      }),
    ),
  );

  private _completeScreen$ = defer(() =>
    merge(
      merge(
        this._keyboardEvents.number$.pipe(filter((event) => event.key === '1')),
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.X),
      ).pipe(map(() => '1')),
      merge(
        this._keyboardEvents.number$.pipe(filter((event) => event.key === '2')),
        this._gamepadEvents.buttonPressed$(XBoxGamepadButtons.A),
      ).pipe(map(() => '2')),
    ).pipe(
      tap((key) => {
        const isRetry = key === '1';
        const nextLevel = this._levels.findLevelWithStageNumber(
          isRetry ? this._state.snapshot.stage : this._state.snapshot.stage + 1,
          this._state.snapshot.isCustom,
        );

        const newScore = this._state.snapshot.score + this._state.snapshot.bonus;

        if (nextLevel) {
          setLastPlayedLevelPassword(nextLevel.password);

          this._state.update({
            screen: 'level',
            score: isRetry ? this._state.snapshot.score : newScore,
            bonus: initalState.bonus,
            ...nextLevel,
          });
        } else {
          this._state.update({
            score: newScore,
          });
          updateBestTotalScore(this._state.snapshot);

          this._state.update({
            screen: 'end',
          });
        }
      }),
    ),
  );

  private _gameOverScreen$ = defer(() =>
    merge(this._keyboardEvents.confirm$, this._gamepadEvents.confirm$()).pipe(
      tap(() =>
        this._state.update({
          screen: 'title',
        }),
      ),
    ),
  );

  private _endScreen$ = defer(() =>
    merge(this._keyboardEvents.confirm$, this._gamepadEvents.confirm$()).pipe(
      tap(() =>
        this._state.update({
          screen: 'title',
        }),
      ),
    ),
  );
}
