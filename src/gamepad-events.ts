import { ButtonEvent, GamepadObservables } from 'gamepad-rxjs';
import {
  debounceTime,
  exhaustMap,
  map,
  merge,
  NEVER,
  Observable,
  startWith,
  switchMap,
  timer,
  withLatestFrom,
  of,
  filter,
  distinctUntilChanged,
} from 'rxjs';
import { Canvas } from './canvas';
import { ElementOf } from 'ts-essentials';
import * as Directions from './directions';

export enum XBoxGamepadButtons {
  A = 0,
  B,
  X,
  Y,
  LB,
  RB,
  LT,
  RT,
  BACK,
  START,
  LSB,
  RSB,
  UP,
  DOWN,
  LEFT,
  RIGHT,
  XBOX,
}

export interface GamepadRepeatConfig {
  delay?: number;
  initialDelay?: number;
}

const dpadButtons = [
  XBoxGamepadButtons.UP,
  XBoxGamepadButtons.DOWN,
  XBoxGamepadButtons.LEFT,
  XBoxGamepadButtons.RIGHT,
];

export type DPadButtons = ElementOf<typeof dpadButtons>;

export class GamepadEvents {
  private _gamepadObs: GamepadObservables;

  constructor(private _index: number) {
    this._gamepadObs = new GamepadObservables(this._index);
  }

  buttonPressed$(buttonIndex: XBoxGamepadButtons): Observable<ButtonEvent> {
    return this._gamepadObs.buttonPressed$(buttonIndex);
  }

  buttonRepeat$(
    buttonIndex: XBoxGamepadButtons,
    { delay = 150, initialDelay }: GamepadRepeatConfig | undefined = { delay: 150 },
  ): Observable<ButtonEvent> {
    return merge(
      this._gamepadObs.buttonPressed$(buttonIndex),
      this._gamepadObs.buttonReleased$(buttonIndex).pipe(map(() => null)),
    ).pipe(
      switchMap((b) =>
        !b ? NEVER : timer(initialDelay ?? delay * 1.5, delay).pipe(map(() => b)),
      ),
    );
  }

  confirm$(): Observable<ButtonEvent> {
    return merge(
      this.buttonPressed$(XBoxGamepadButtons.START),
      this.buttonPressed$(XBoxGamepadButtons.A),
    );
  }

  directionPad$(
    {
      delay = Canvas.activeMoveDelay,
      initialDelay,
    }: GamepadRepeatConfig | undefined = {
      delay: Canvas.activeMoveDelay,
    },
  ): Observable<Directions.DirectionType> {
    const anyPressed$ = this._gamepadObs.gamepadEvent$.pipe(
      filter((gamepad) =>
        gamepad.buttons
          .filter((_, buttonIndex) => dpadButtons.includes(buttonIndex))
          .some(({ pressed }) => pressed),
      ),
      map(() => true),
    );

    const allReleased$ = this._gamepadObs.gamepadEvent$.pipe(
      map((gamepad) =>
        gamepad.buttons
          .filter((_, buttonIndex) => dpadButtons.includes(buttonIndex))
          .every(({ pressed }) => !pressed),
      ),
      distinctUntilChanged(),
      debounceTime(18),
      filter((allReleased) => allReleased),
      map(() => false),
    );

    const lastPressed$ = merge(
      ...dpadButtons.map((buttonIndex) =>
        this._gamepadObs.gamepadEvent$.pipe(
          filter((gamepad) => gamepad.buttons[buttonIndex].pressed),
          map(() => buttonIndex),
        ),
      ),
    );

    return merge(anyPressed$, allReleased$).pipe(
      distinctUntilChanged(),
      switchMap((anyPressed) =>
        !anyPressed
          ? NEVER
          : of(undefined).pipe(
              withLatestFrom(lastPressed$),
              exhaustMap(([_, lastPressed]) =>
                timer(initialDelay ?? delay * 2, delay).pipe(
                  withLatestFrom(lastPressed$),
                  map(([_, buttonIndex]) => buttonIndex),
                  startWith(lastPressed),
                ),
              ),
              map(
                (buttonIndex) =>
                  (
                    ({
                      [XBoxGamepadButtons.UP]: 'ArrowUp' as const,
                      [XBoxGamepadButtons.RIGHT]: 'ArrowRight' as const,
                      [XBoxGamepadButtons.DOWN]: 'ArrowDown' as const,
                      [XBoxGamepadButtons.LEFT]: 'ArrowLeft' as const,
                    }) as { [button in DPadButtons]: Directions.DirectionType }
                  )[buttonIndex],
              ),
            ),
      ),
    );
  }
}
