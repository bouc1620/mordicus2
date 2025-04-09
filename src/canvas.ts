import { assert } from 'ts-essentials';
import { concat, delay, forkJoin, from, Observable, of, tap } from 'rxjs';
import { getBestScore, getBestTotalScore, StateSnapshot } from './game-state';
import * as Logic from './logic';
import * as Grid from './grid';
import * as Units from './units';

type DrawImageViewBox = [sx: number, sy: number, sw: number, sh: number];

const createImageFromFilepath = async (
  address: string,
): Promise<HTMLImageElement> => {
  const image = new Image();
  image.src = address;
  return new Promise<HTMLImageElement>((resolve) => {
    image.onload = () => {
      resolve(image);
    };
  });
};

const useOriginalTitleKey = 'use-original-title';
const isOriginalTitleScreen = (): boolean =>
  !!localStorage.getItem(useOriginalTitleKey);

export const toggleUseOriginalTitleScreen = (): void => {
  if (isOriginalTitleScreen()) {
    localStorage.removeItem(useOriginalTitleKey);
  } else {
    localStorage.setItem(useOriginalTitleKey, 'true');
  }
};

export class Canvas {
  static readonly width = 256;
  static readonly height = 200;
  static readonly scalingFactor = 4;

  static readonly activeMoveDelay = 200;
  static readonly passiveMoveDelay = Canvas.activeMoveDelay * 2.25;
  static readonly menuDelay = Canvas.passiveMoveDelay * 1.25;

  private _images = new Map<string, HTMLImageElement>();

  private get _context(): CanvasRenderingContext2D {
    return this._canvasElement.getContext('2d') as CanvasRenderingContext2D;
  }

  constructor(private _canvasElement: HTMLCanvasElement) {
    this._canvasElement.width = Canvas.width;
    this._canvasElement.height = Canvas.height;
    this._canvasElement.style.width = `${Canvas.width * Canvas.scalingFactor}px`;
    this._canvasElement.style.height = `${Canvas.height * Canvas.scalingFactor}px`;
  }

  loadImages$(): Observable<unknown> {
    return forkJoin({
      loadSprites: this._loadSprites$(),
      loadMenus: this._loadMenus$(),
      loadCharacterSets: this._loadCharacterSets$(),
    });
  }

  getMoveDrawingQueue$(
    moveResultQueue: ReadonlyArray<StateSnapshot>,
    updateState: (state: StateSnapshot) => void,
  ): Observable<StateSnapshot> {
    return concat(
      ...moveResultQueue.map((state, index) =>
        of(state).pipe(
          tap(() => {
            updateState(state);
            this.drawSync(state);
          }),
          delay(this._getMoveDelay(moveResultQueue, index)),
        ),
      ),
    );
  }

  drawSync(snapshot: StateSnapshot): void {
    switch (snapshot.screen) {
      case 'title': {
        this._clearScreen('#000040');
        if (localStorage.getItem('use-original-title')) {
          this._drawOriginalTitleScreen();
        } else {
          this._drawSimpleTitleScreen();
        }
        return;
      }

      case 'usePassword': {
        this._clearScreen();
        this._drawDialog(['Avez-vous un', `code d'accès?`, '1-Oui 2-Non']);
        return;
      }

      case 'inputPassword': {
        this._clearScreen();
        this._drawDialog([
          'Entrez votre',
          `code d'accès`,
          snapshot.input.padEnd(6, '•'),
        ]);
        return;
      }

      case 'level': {
        this._clearScreen();
        this._drawIngameMenu(snapshot);
        this._drawGrid(snapshot.grid);
        return;
      }

      case 'complete': {
        const best = `${getBestScore(snapshot)}`.padStart(4, '0');
        this._drawDialog([
          `Meilleur essai: ${best}`,
          '1-Réessayer ce niveau',
          '2-Niveau suivant',
        ]);
        return;
      }

      case 'retry': {
        this._drawIngameMenu(snapshot);
        this._drawDialog(['Essayez encore!', '', 'Appuyez sur ✓']);
        return;
      }

      case 'gameOver': {
        this._drawIngameMenu(snapshot);
        this._drawDialog([
          'Voici votre',
          `code d'accès: ${snapshot.password}`,
          'Appuyez sur ✓',
        ]);
        return;
      }

      case 'end': {
        this._clearScreen(snapshot.screen);
        this._drawEndScreen(snapshot);
        return;
      }
    }
  }

  private _getMoveDelay(
    queue: ReadonlyArray<StateSnapshot>,
    current: number,
  ): number {
    if (Logic.isPlayerDead(queue[current]) || Logic.isSuccess(queue[current])) {
      return Canvas.menuDelay;
    } else if (queue.length === 1) {
      return 0;
    }

    const isLast = current === queue.length - 1;
    return isLast ? Canvas.activeMoveDelay : Canvas.passiveMoveDelay;
  }

  private _clearScreen(color = '#000000'): void {
    this._context.fillStyle = color;
    this._context.fillRect(0, 0, Canvas.width, Canvas.height);
  }

  private _drawGrid(grid: Grid.GridType): void {
    for (let y = 0; y < grid.length; y++) {
      for (let x = 0; x < grid[y].length; x++) {
        const [sprite, [sx, sy, sw, sh]] = this._getSprite(grid[y][x]);
        this._context.drawImage(
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
  }

  private _drawSimpleTitleScreen(): void {
    this._context.drawImage(
      this._getMenu('gameTitleSimple'),
      this._getCenterAlignXPos(186),
      72,
    );

    this._writeLine(
      'Pour commencer, ✓',
      {
        x: 'center',
        y: 110,
      },
      'blue',
    );
  }

  private _drawOriginalTitleScreen(): void {
    this._context.drawImage(
      this._getMenu('gameTitleOriginal'),
      this._getCenterAlignXPos(229),
      13,
    );
    const [sprite1, viewBox1] = this._getSprite('🦍');
    this._context.drawImage(sprite1, ...viewBox1, 36, 53, viewBox1[2], viewBox1[3]);
    const [sprite2, viewBox2] = this._getSprite('😮');
    this._context.drawImage(
      sprite2,
      ...viewBox2,
      Canvas.width - 56,
      53,
      viewBox2[2],
      viewBox2[3],
    );

    let yPos = 0;
    const lines: [text: string, relativeYPos: number][] = [
      ['Version 2.00', 59],
      [`Droits d'auteur`, 31],
      ['Le Groupe Vidéotron Ltée', 12],
      ['Tous droits réservés', 18],
      ['Développé par', 18],
      ['Loto-Québec', 12],
      ['Pour commencer, ✓', 31],
    ];
    for (const [text, yPosIncrement] of lines) {
      this._writeLine(
        text,
        {
          x: 'center',
          y: (yPos += yPosIncrement),
        },
        'blue',
      );
    }
  }

  private _drawEndScreen(snapshot: StateSnapshot): void {
    const current = `${snapshot.score}`.padStart(6, '0');
    const best = `${getBestTotalScore(snapshot)}`.padStart(6, '0');
    this._drawDialog([
      'Félicitations!',
      `Votre score: ${current}`,
      `Meilleur: ${best}`,
    ]);
  }

  private _drawIngameMenu(snapshot: StateSnapshot): void {
    this._context.drawImage(this._getMenu('inGameMenus'), 0, 0);
    const score = `${snapshot.score}`.padStart(6, '0');
    this._writeLine(`Points ${score}`, {
      x: 8,
      y: 0,
    });
    const bonus = `${snapshot.bonus}`.padStart(4, '0');
    this._writeLine(`Boni ${bonus}`, {
      x: 160,
      y: 0,
    });
    const stage = `${snapshot.stage}`.padStart(3, '0');
    this._writeLine(`Niveau ${stage}`, {
      x: 8,
      y: 192,
    });
    const lives = `${snapshot.lives}`.padStart(2, '0');
    this._writeLine(`Vies ${lives}`, {
      x: 180,
      y: 192,
    });
  }

  private _drawDialog(contents: string[]): void {
    this._context.drawImage(
      this._getMenu('dialogBox'),
      this._getCenterAlignXPos(240),
      this._getCenterAlignYPos(60),
    );
    contents.forEach((row, index) => {
      this._writeLine(row, {
        x: 'center',
        y: 84 + 12 * index,
      });
    });
  }

  private _getCenterAlignXPos(sWidth: number): number {
    return Math.round((Canvas.width - sWidth) / 2);
  }

  private _getCenterAlignYPos(sHeight: number): number {
    return Math.round((Canvas.height - sHeight) / 2);
  }

  private _getCharacter(
    char: string,
    color: 'yellow' | 'blue' = 'yellow',
  ): [HTMLImageElement, DrawImageViewBox] | undefined {
    if (/^\s$/.test(char)) {
      return undefined;
    }

    const charCode = char.toLowerCase().charCodeAt(0);
    if (charCode >= 48 && charCode <= 57) {
      const numbersImage =
        color === 'blue'
          ? this._images.get('numbersBlue')
          : this._images.get('numbersYellow');

      assert(numbersImage, 'the image for numbers character set could not be found');

      return [numbersImage, [(charCode - 48) * 8, 0, 8, 8]];
    }

    if (
      (charCode >= 64 && charCode <= 122) ||
      charCode === 224 ||
      charCode === 232 ||
      charCode === 233
    ) {
      const lettersImage =
        color === 'blue'
          ? this._images.get('lettersBlue')
          : this._images.get('lettersYellow');

      assert(lettersImage, 'the image for letters character set could not be found');

      if (charCode >= 64 && charCode <= 122) {
        return [lettersImage, [(charCode - 97) * 8, 0, 8, 8]];
      } else if (charCode === 224) {
        return [lettersImage, [26 * 8, 0, 8, 8]];
      } else {
        return [lettersImage, [27 * 8, 0, 8, 8]];
      }
    }

    const index = ['!', '?', ',', '-', '.', "'", ':', '•', '✓'].indexOf(char);
    assert(
      index !== -1,
      `the image for special character ${char} could not be found`,
    );

    const specialsImage =
      color === 'blue'
        ? this._images.get('specialsBlue')
        : this._images.get('specialsYellow');

    assert(specialsImage, 'the image for special character set could not be found');

    return [specialsImage, [index * 8, 0, 8, 8]];
  }

  private _writeLine(
    text: string,
    origin:
      | Grid.Coordinates
      | {
          x: 'center';
          y: number;
        },
    color: 'yellow' | 'blue' = 'yellow',
  ): void {
    text
      .split('')
      .map((char) => this._getCharacter(char, color))
      .forEach((imageCfg, index) => {
        if (!imageCfg) {
          return;
        }
        const [image, viewBox] = imageCfg;
        this._context.drawImage(
          image,
          ...viewBox,
          (typeof origin.x === 'number'
            ? origin.x
            : this._getCenterAlignXPos(text.length * 10)) +
            10 * index,
          origin.y,
          8,
          8,
        );
      });
  }

  private _getSprite(unit: Units.UnitType): [HTMLImageElement, DrawImageViewBox] {
    const sprite = this._images.get(unit);
    const index = Units.all.indexOf(unit);
    const viewBox: DrawImageViewBox = [index * 20, 0, 20, 20];

    assert(sprite, `the image for sprite ${unit} could not be found`);
    assert(index !== -1, `unit ${unit} could not be found in the units list`);

    return [sprite, viewBox];
  }

  private _getMenu(
    type: 'gameTitleOriginal' | 'gameTitleSimple' | 'dialogBox' | 'inGameMenus',
  ): HTMLImageElement {
    const menu = this._images.get(type);

    assert(menu, `the image for menu type ${type} could not be found`);

    return menu;
  }

  private _loadSprites$(): Observable<unknown> {
    return from(createImageFromFilepath('./images/sprites.png')).pipe(
      tap((sprites) => {
        Units.all.forEach((unit) => {
          this._images.set(unit, sprites);
        });
      }),
    );
  }

  private _loadMenus$(): Observable<unknown> {
    return from(
      Promise.all(
        Object.entries({
          gameTitleOriginal: './images/game-title-original.png',
          gameTitleSimple: './images/game-title-simple.png',
          dialogBox: './images/dialog-box.png',
          inGameMenus: './images/in-game-menus.png',
        }).map(async ([menu, path]) => [menu, await createImageFromFilepath(path)]),
      ) as Promise<[string, HTMLImageElement][]>,
    ).pipe(
      tap((menus) => {
        menus.forEach(([menu, image]) => {
          this._images.set(menu, image);
        });
      }),
    );
  }

  private _loadCharacterSets$(): Observable<unknown> {
    return from(
      Promise.all(
        Object.entries({
          lettersYellow: './images/letters-yellow.png',
          lettersBlue: './images/letters-blue.png',
          numbersYellow: './images/numbers-yellow.png',
          numbersBlue: './images/numbers-blue.png',
          specialsYellow: './images/special-characters-yellow.png',
          specialsBlue: './images/special-characters-blue.png',
        }).map(async ([charSet, path]) => [
          charSet,
          await createImageFromFilepath(path),
        ]),
      ) as Promise<[string, HTMLImageElement][]>,
    ).pipe(
      tap((charSets) => {
        charSets.forEach(([charSet, image]) => {
          this._images.set(charSet, image);
        });
      }),
    );
  }
}
