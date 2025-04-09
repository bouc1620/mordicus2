import {
  distinctUntilChanged,
  exhaustMap,
  filter,
  fromEvent,
  map,
  merge,
  NEVER,
  Observable,
  of,
  scan,
  shareReplay,
  startWith,
  switchMap,
  timer,
  withLatestFrom,
} from 'rxjs';
import * as Directions from './directions';
import { Canvas } from './canvas';

const isDirectionKey = (
  event: KeyboardEvent,
): event is KeyboardEvent & {
  key: Directions.DirectionType;
} => Directions.isDirectionKey(event.key);

export class KeyboardEvents {
  private _all$ = fromEvent<KeyboardEvent>(window, 'keydown');

  number$ = this._all$.pipe(filter((event) => /^[0-9]$/.test(event.key)));

  space$ = this._all$.pipe(filter((event) => event.key === ' '));
  enter$ = this._all$.pipe(filter((event) => event.key === 'Enter'));
  confirm$ = merge(this.space$, this.enter$);

  escape$ = this._all$.pipe(filter((event) => event.key === 'Escape'));

  backspace$ = this._all$.pipe(filter((event) => event.key === 'Backspace'));

  toggleOriginalScreen$ = this._all$.pipe(filter((event) => event.key === 'o'));

  directionPad$(
    {
      delay: repeatDelay = Canvas.activeMoveDelay,
      initialDelay,
    }:
      | {
          delay?: number;
          initialDelay?: number;
        }
      | undefined = {
      delay: Canvas.activeMoveDelay,
    },
  ): Observable<Directions.DirectionType> {
    const directions$ = this._all$.pipe(
      filter(isDirectionKey),
      filter((event) => !event.repeat),
      shareReplay(1),
    );

    const anyPressed$ = directions$.pipe(map(() => true));

    const allReleased$ = merge(
      directions$,
      fromEvent<KeyboardEvent>(window, 'keyup').pipe(filter(isDirectionKey)),
    ).pipe(
      scan(
        (acc, event) => ({
          ...acc,
          [event.key]: event.type === 'keyup',
        }),
        {
          ArrowUp: true,
          ArrowRight: true,
          ArrowDown: true,
          ArrowLeft: true,
        },
      ),
      map((state) => Object.values(state).every((pressed) => pressed)),
      filter((allReleased) => allReleased),
      map(() => null),
    );

    const lastPressed$ = directions$.pipe(map(({ key }) => key));

    return merge(anyPressed$, allReleased$).pipe(
      distinctUntilChanged(),
      switchMap((anyPressed) =>
        !anyPressed
          ? NEVER
          : of(undefined).pipe(
              withLatestFrom(lastPressed$),
              exhaustMap(([_, lastPressed]) =>
                timer(initialDelay ?? repeatDelay * 1.5, repeatDelay).pipe(
                  withLatestFrom(lastPressed$),
                  map(([_, key]) => key),
                  startWith(lastPressed),
                ),
              ),
            ),
      ),
    );
  }
}
