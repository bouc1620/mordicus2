import {
  animationFrameScheduler,
  filter,
  fromEvent,
  interval,
  map,
  switchMap,
  takeUntil,
} from 'rxjs';
import * as Directions from './directions';

export class KeyboardEvents {
  all$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(map((event) => event.key));
  number$ = this.all$.pipe(filter((key) => /^[0-9]$/.test(key)));
  confirm$ = this.all$.pipe(filter((key) => key === 'Enter' || key === ' '));
  escape$ = this.all$.pipe(filter((key) => key === 'Escape'));
  backspace$ = this.all$.pipe(filter((key) => key === 'Backspace'));
  direction$ = fromEvent<KeyboardEvent>(window, 'keydown').pipe(
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
