import { filter, merge, tap } from 'rxjs';
import { XBoxGamepadButtons } from '../gamepad-events';
import { getGameConfig, toggleUseOriginalGameConfig, viewConfig } from '../config';
import { ScreenFn$, Game } from '../mordicus';
import { createUsePasswordQueryScreenFn$ } from './use-password-query.screen';

export const createTitleScreenFn$ = (): ScreenFn$ => {
  return (game: Game) => {
    drawSync(game);

    return merge(
      merge(
        game.keyboardEvents.all$.pipe(filter((key) => key === 'o')),
        merge(
          game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.Y),
          game.gamepadEvents.buttonRepeat$(XBoxGamepadButtons.Y, {
            delay: 30,
            initialDelay: 500,
          }),
        ),
      ).pipe(
        tap(() => {
          toggleUseOriginalGameConfig();
          drawSync(game);
        }),
      ),
      merge(
        game.keyboardEvents.confirm$,
        game.gamepadEvents.confirm$,
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.X),
        game.gamepadEvents.buttonPressed$(XBoxGamepadButtons.A),
      ).pipe(
        tap(() => {
          game.screenFn$$.next(createUsePasswordQueryScreenFn$());
        }),
      ),
    );
  };
};

const drawSync = (game: Game): void => {
  game.canvas.clearScreen('#000040');
  if (getGameConfig().gameType === 'remake') {
    drawSimpleTitleScreen(game);
  } else {
    drawOriginalTitleScreen(game);
  }
};

const drawSimpleTitleScreen = (game: Game): void => {
  game.canvas.context.drawImage(
    game.images.getMenu('simple-game-title'),
    game.canvas.getCenterAlignXPos(186),
    72,
  );

  game.canvas.writeLine(
    'POUR COMMENCER, ✓',
    {
      x: 'center',
      y: 110,
    },
    'blue',
  );
};

const drawOriginalTitleScreen = (game: Game): void => {
  game.canvas.context.drawImage(
    game.images.getMenu('original-game-title'),
    game.canvas.getCenterAlignXPos(229),
    14,
  );

  const [sprite1, viewBox1] = game.images.getSprite(
    '🦍',
    'sprites-original-title-screen',
  );
  game.canvas.context.drawImage(
    sprite1,
    ...viewBox1,
    37,
    53,
    viewBox1[2],
    viewBox1[3],
  );

  const [sprite2, viewBox2] = game.images.getSprite(
    '😮',
    'sprites-original-title-screen',
  );
  game.canvas.context.drawImage(
    sprite2,
    ...viewBox2,
    viewConfig.width - 56,
    53,
    viewBox2[2],
    viewBox2[3],
  );

  let yPos = 0;
  const lines: [text: string, relativeYPos: number][] = [
    ['VERSION 2.00', 59],
    [`DROITS D'AUTEUR`, 30],
    ['LE GROUPE VIDÉOTRON LTÉE', 12],
    ['TOUS DROITS RÉSERVÉS', 18],
    ['DÉVELOPPÉ PAR', 18],
    ['LOTO-QUÉBEC', 12],
    ['POUR COMMENCER, ✓', 32],
  ];

  for (const [text, yPosIncrement] of lines) {
    game.canvas.writeLine(
      text,
      {
        x: 'center',
        y: (yPos += yPosIncrement),
      },
      'blue',
    );
  }
};
