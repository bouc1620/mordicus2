import { BehaviorSubject, distinctUntilChanged } from 'rxjs';
import * as Grid from './grid';

export type Screen =
  | 'title'
  | 'usePassword'
  | 'inputPassword'
  | 'level'
  | 'complete'
  | 'retry'
  | 'gameOver'
  | 'end';

export type StateSnapshot = Readonly<{
  screen: Screen;
  grid: Grid.GridType;
  score: number;
  bonus: number;
  stage: number;
  lives: number;
  password: string;
  isCustom: boolean;
  input: string;
}>;

export const initalState: StateSnapshot = {
  screen: 'title' as const,
  grid: [],
  score: 0,
  bonus: 1000,
  stage: 0,
  lives: 5,
  password: '',
  isCustom: false,
  input: '',
};

export const getBestScore = (state: StateSnapshot): number =>
  Number.parseInt(localStorage.getItem(state.password) ?? '0');

export const updateBestScore = (state: StateSnapshot): void =>
  localStorage.setItem(
    state.password,
    `${Math.max(state.bonus, getBestScore(state))}`,
  );

const getBestTotalScoreKey = (state: StateSnapshot): string =>
  `best-total-score-${state.isCustom ? 'custom' : 'original'}-levels`;

export const getBestTotalScore = (state: StateSnapshot): number =>
  Number.parseInt(localStorage.getItem(getBestTotalScoreKey(state)) ?? '0');

export const updateBestTotalScore = (state: StateSnapshot): void =>
  localStorage.setItem(
    getBestTotalScoreKey(state),
    `${Math.max(state.score, getBestTotalScore(state))}`,
  );

export class State {
  private _screen$ = new BehaviorSubject(initalState.screen);
  screen$ = this._screen$.asObservable().pipe(distinctUntilChanged());

  private _grid = Grid.copyGrid(initalState.grid);
  private _score = initalState.score;
  private _bonus = initalState.bonus;
  private _stage = initalState.stage;
  private _lives = initalState.lives;
  private _password = initalState.password;
  private _isCustom = initalState.isCustom;
  private _input = initalState.input;

  private set _snapshot(snapshot: StateSnapshot) {
    this._grid = Grid.copyGrid(snapshot.grid);
    this._score = snapshot.score;
    this._bonus = snapshot.bonus;
    this._stage = snapshot.stage;
    this._lives = snapshot.lives;
    this._password = snapshot.password;
    this._isCustom = snapshot.isCustom;
    this._input = snapshot.input;

    this._screen$.next(snapshot.screen);
  }

  get snapshot(): StateSnapshot {
    return {
      screen: this._screen$.getValue(),
      grid: Grid.copyGrid(this._grid),
      score: this._score,
      bonus: this._bonus,
      stage: this._stage,
      lives: this._lives,
      password: this._password,
      isCustom: this._isCustom,
      input: this._input,
    };
  }

  update(snapshot: Partial<StateSnapshot>) {
    this._snapshot = {
      ...this.snapshot,
      ...snapshot,
    };
  }
}
