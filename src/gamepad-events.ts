import { ElementOf } from 'ts-essentials';
import {
  animationFrameScheduler,
  map,
  merge,
  NEVER,
  Observable,
  switchMap,
  timer,
  interval,
} from 'rxjs';
import { ButtonEvent, GamepadObservables } from 'gamepad-rxjs';
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
  private _gamepadObservables = new GamepadObservables(0);

  buttonPressed$(buttonIndex: XBoxGamepadButtons): Observable<ButtonEvent> {
    return this._gamepadObservables.buttonPressed$(buttonIndex);
  }
  buttonRepeat$(
    buttonIndex: XBoxGamepadButtons,
    { delay = 150, initialDelay }: GamepadRepeatConfig | undefined = { delay: 150 },
  ): Observable<ButtonEvent> {
    return merge(
      this._gamepadObservables.buttonPressed$(buttonIndex),
      this._gamepadObservables.buttonReleased$(buttonIndex).pipe(map(() => null)),
    ).pipe(
      switchMap((buttonEvent) =>
        !buttonEvent
          ? NEVER
          : timer(initialDelay ?? delay * 1.5, delay).pipe(map(() => buttonEvent)),
      ),
    );
  }
  confirm$ = merge(
    this._gamepadObservables.buttonPressed$(XBoxGamepadButtons.START),
    this._gamepadObservables.buttonPressed$(XBoxGamepadButtons.B),
  );
  direction$ = merge(
    ...dpadButtons.map((buttonIndex) =>
      merge(
        this._gamepadObservables.buttonPressed$(buttonIndex),
        this._gamepadObservables.buttonReleased$(buttonIndex).pipe(map(() => null)),
      ).pipe(
        switchMap((buttonEvent) =>
          !buttonEvent ? NEVER : interval(0, animationFrameScheduler),
        ),
        map(
          () =>
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
