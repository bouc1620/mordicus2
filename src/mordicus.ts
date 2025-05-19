import { BehaviorSubject, forkJoin, Observable, switchMap } from 'rxjs';
import { Images } from './images';
import { Levels } from './levels';
import { Canvas } from './canvas';
import { KeyboardEvents } from './keyboard-events';
import { GamepadEvents } from './gamepad-events';
import { createTitleScreenFn$ } from './screens/title.screen';

export type ScreenFn$ = (game: Game) => Observable<unknown>;

export class Game {
  images: Images;
  levels: Levels;
  canvas: Canvas;
  keyboardEvents: KeyboardEvents;
  gamepadEvents: GamepadEvents;

  screenFn$$ = new BehaviorSubject<ScreenFn$>(createTitleScreenFn$());

  constructor(canvasElement: HTMLCanvasElement) {
    this.images = new Images();
    this.levels = new Levels();
    this.canvas = new Canvas(canvasElement, this.images);
    this.keyboardEvents = new KeyboardEvents();
    this.gamepadEvents = new GamepadEvents();
  }

  start$(): Observable<unknown> {
    return forkJoin({
      images: this.images.init$(),
      levels: this.levels.init$(),
    }).pipe(
      switchMap(() =>
        this.screenFn$$.pipe(switchMap((screenFn$) => screenFn$(this))),
      ),
    );
  }
}
