import * as Grid from './grid';

export const logWithUniquePrefix = (...messages: unknown[]): void => {
  console.log(`${Math.floor(Math.random() * 100)}`.padStart(3, '0'), ...messages);
};

export const logGrid = (grid: Grid.GridType): void => {
  logWithUniquePrefix(`${performance.now()}`);
  for (const row of grid) {
    logWithUniquePrefix(row.join(''));
  }
};
