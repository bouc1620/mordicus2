import {
  animationFrameScheduler,
  filter,
  fromEvent,
  interval,
  map,
  switchMap,
  takeUntil,
  tap,
} from 'rxjs';
import * as Directions from './directions';

export class KeyboardEvents {
  private _keydownEvent$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
    tap((event) => event.preventDefault()),
  );
  all$ = this._keydownEvent$.pipe(map((event) => event.key));
  number$ = this.all$.pipe(filter((key) => /^[0-9]$/.test(key)));
  confirm$ = this.all$.pipe(filter((key) => key === 'Enter' || key === ' '));
  escape$ = this.all$.pipe(filter((key) => key === 'Escape'));
  backspace$ = this.all$.pipe(filter((key) => key === 'Backspace'));
  direction$ = this._keydownEvent$.pipe(
    filter((event) => !event.repeat),
    map((event) => event.key),
    filter((key) => Directions.isDirectionKey(key)),
    switchMap((dir) =>
      interval(15, animationFrameScheduler).pipe(
        map(() => dir),
        takeUntil(
          fromEvent<KeyboardEvent>(window, 'keyup').pipe(
            filter((event) => event.key === dir),
          ),
        ),
      ),
    ),
  );
}
