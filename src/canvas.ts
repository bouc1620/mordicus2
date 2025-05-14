import { assert } from 'ts-essentials';
import { viewConfig } from './config';
import { Images } from './images';
import * as Grid from './grid';

export class Canvas {
  constructor(
    private _canvas: HTMLCanvasElement,
    private _images: Images,
  ) {
    this._canvas.width = viewConfig.width;
    this._canvas.height = viewConfig.height;
    this._canvas.style.width = `${viewConfig.width * viewConfig.scalingFactor}px`;
    this._canvas.style.height = `${viewConfig.height * viewConfig.scalingFactor}px`;
  }

  get context(): CanvasRenderingContext2D {
    assert(this._canvas, 'canvas is not defined');

    return this._canvas.getContext('2d') as CanvasRenderingContext2D;
  }

  clearScreen(color = '#000000'): void {
    this.context.fillStyle = color;
    this.context.fillRect(0, 0, viewConfig.width, viewConfig.height);
  }

  drawDialog(contents: string[]): void {
    this.context.drawImage(
      this._images.getMenu('dialog-box'),
      this.getCenterAlignXPos(240),
      this.getCenterAlignYPos(60),
    );

    contents.forEach((row, index) => {
      this.writeLine(row, {
        x: 'center',
        y: 84 + 12 * index,
      });
    });
  }

  writeLine(
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
      .map((char) => this._images.getCharacter(char, color))
      .forEach((imageCfg, index) => {
        if (!imageCfg) {
          return;
        }

        const [image, viewBox] = imageCfg;
        this.context.drawImage(
          image,
          ...viewBox,
          (origin.x === 'center'
            ? this.getCenterAlignXPos(text.length * 10) + 1
            : origin.x) +
            10 * index,
          origin.y,
          8,
          8,
        );
      });
  }

  getCenterAlignXPos(sWidth: number): number {
    return Math.round((viewConfig.width - sWidth) / 2);
  }

  getCenterAlignYPos(sHeight: number): number {
    return Math.round((viewConfig.height - sHeight) / 2);
  }
}
