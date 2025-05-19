import { assert } from 'ts-essentials';
import { forkJoin, from, Observable, tap } from 'rxjs';
import * as Units from './units';

type SpriteImage =
  | 'sprites'
  | 'sprites-original-title-screen'
  | 'sprites-black-background';

type MenuImage =
  | 'original-game-title'
  | 'simple-game-title'
  | 'dialog-box'
  | 'in-game-menus';

type CharacterImage =
  | 'letters-yellow'
  | 'letters-blue'
  | 'numbers-yellow'
  | 'numbers-blue'
  | 'special-characters-yellow'
  | 'special-characters-blue';

type ImageName = SpriteImage | MenuImage | CharacterImage;

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

export class Images {
  private _imagesMap = new Map<ImageName, HTMLImageElement>();

  init$(): Observable<unknown> {
    return forkJoin({
      loadSprites: this._loadSprites$(),
      loadMenus: this._loadMenus$(),
      loadCharacterSets: this._loadCharacterSets$(),
    });
  }

  getSprite(
    unit: Units.UnitType,
    type: SpriteImage = 'sprites-black-background',
  ): [HTMLImageElement, DrawImageViewBox] {
    const sprite = this._imagesMap.get(type);
    const index = Units.all.indexOf(unit);
    const viewBox: DrawImageViewBox = [index * 20, 0, 20, 20];

    assert(sprite, `the image for sprite ${unit} could not be found`);

    return [sprite, viewBox];
  }

  getMenu(
    name:
      | 'original-game-title'
      | 'simple-game-title'
      | 'dialog-box'
      | 'in-game-menus',
  ): HTMLImageElement {
    const menu = this._imagesMap.get(name);

    assert(menu, `the image for menu type ${name} could not be found`);

    return menu;
  }

  getCharacter(
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
          ? this._imagesMap.get('numbers-blue')
          : this._imagesMap.get('numbers-yellow');

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
          ? this._imagesMap.get('letters-blue')
          : this._imagesMap.get('letters-yellow');

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
        ? this._imagesMap.get('special-characters-blue')
        : this._imagesMap.get('special-characters-yellow');

    assert(specialsImage, 'the image for special character set could not be found');

    return [specialsImage, [index * 8, 0, 8, 8]];
  }

  private _loadSprites$(): Observable<unknown> {
    return from(
      Promise.all(
        Object.entries({
          sprites: './images/sprites.png',
          'sprites-original-title-screen':
            './images/sprites-original-title-screen.png',
          'sprites-black-background': './images/sprites-black-background.png',
        }).map(async ([sprites, path]) => [
          sprites,
          await createImageFromFilepath(path),
        ]),
      ) as Promise<[string, HTMLImageElement][]>,
    ).pipe(
      tap((sprites) => {
        sprites.forEach(([sprite, image]) => {
          this._imagesMap.set(sprite as SpriteImage, image);
        });
      }),
    );
  }

  private _loadMenus$(): Observable<unknown> {
    return from(
      Promise.all(
        Object.entries({
          'original-game-title': './images/original-game-title.png',
          'simple-game-title': './images/simple-game-title.png',
          'dialog-box': './images/dialog-box.png',
          'in-game-menus': './images/in-game-menus.png',
        }).map(async ([menu, path]) => [menu, await createImageFromFilepath(path)]),
      ) as Promise<[string, HTMLImageElement][]>,
    ).pipe(
      tap((menus) => {
        menus.forEach(([menu, image]) => {
          this._imagesMap.set(menu as MenuImage, image);
        });
      }),
    );
  }

  private _loadCharacterSets$(): Observable<unknown> {
    return from(
      Promise.all(
        Object.entries({
          'letters-yellow': './images/letters-yellow.png',
          'letters-blue': './images/letters-blue.png',
          'numbers-yellow': './images/numbers-yellow.png',
          'numbers-blue': './images/numbers-blue.png',
          'special-characters-yellow': './images/special-characters-yellow.png',
          'special-characters-blue': './images/special-characters-blue.png',
        }).map(async ([charSet, path]) => [
          charSet,
          await createImageFromFilepath(path),
        ]),
      ) as Promise<[string, HTMLImageElement][]>,
    ).pipe(
      tap((charSets) => {
        charSets.forEach(([charSet, image]) => {
          this._imagesMap.set(charSet as CharacterImage, image);
        });
      }),
    );
  }
}
