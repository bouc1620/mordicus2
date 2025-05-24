import { merge, tap } from 'rxjs';
import { Game, ScreenFn$ } from '../mordicus';
import { createLevelScreenFn$, ILevelScreenData } from './level.screen';

export const createGainNewPasswordScreenFn$ = (data: ILevelScreenData): ScreenFn$ => {
	return (game: Game) => {
		drawSync(game, data.level.password);

		return merge(game.keyboardEvents.confirm$, game.gamepadEvents.confirm$).pipe(
			tap(() => {
				game.screenFn$$.next(createLevelScreenFn$(data));
			}),
		);
	};
};

const drawSync = (game: Game, password: string | undefined): void => {
	game.canvas.clearScreen();
	game.canvas.drawDialog(
		password
			? ['VOICI VOTRE', `CODE D'ACCÈS: ${password}`, 'APPUYEZ SUR ✓']
			: ['', 'APPUYEZ SUR ✓'],
	);
};
