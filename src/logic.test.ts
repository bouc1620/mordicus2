import { DeepReadonly } from 'ts-essentials';
import * as Directions from './directions';
import { StateSnapshot } from './game-state';
import * as Logic from './logic';
import * as Units from './units';
import * as Grid from './grid';

const mockStorageGetItem = jest.fn().mockReturnValue('0');
const mockStorageSetItem = jest.fn();
global.localStorage = {
  getItem: mockStorageGetItem,
  setItem: mockStorageSetItem,
} as unknown as Storage;

type TestGridType = DeepReadonly<(Units.UnitType | '🐔')[][]>;

const getGridWithChickensReplaced = (
  grid: TestGridType,
  unit: Units.UnitType,
): Grid.GridType => grid.map((row) => row.map((u) => (u === '🐔' ? unit : u)));

const mockState: StateSnapshot = {
  screen: 'level',
  grid: [],
  score: 0,
  bonus: 0,
  stage: 1,
  lives: 5,
  password: '123456',
  isCustom: true,
  input: '',
};

describe('isSuccess', () => {
  it('should be false if mordicus cannot be found on the grid', () => {
    expect(
      Logic.isSuccess({
        ...mockState,
        grid: [
          ['⬛', '⬛', '⬛'],
          ['⬛', '🦍', '⬛'],
          ['⬛', '⬛', '⬛'],
        ],
      }),
    ).toBe(false);
  });

  it('should be false if there are still bananas left on the grid', () => {
    expect(
      Logic.isSuccess({
        ...mockState,
        grid: [
          ['⬛', '🦍', '⬛'],
          ['🍌', '⬛', '🍌'],
          ['⬛', '😮', '⬛'],
        ],
      }),
    ).toBe(false);
  });

  it('should be false if there are still coins left on the grid', () => {
    expect(
      Logic.isSuccess({
        ...mockState,
        grid: [
          ['⬛', '🦍', '⬛'],
          ['🟡', '⬛', '🟡'],
          ['⬛', '😮', '⬛'],
        ],
      }),
    ).toBe(false);
  });

  it('should be false if there is at least one gorilla surrounding mordicus', () => {
    expect(
      Logic.isSuccess({
        ...mockState,
        grid: [
          ['⬛', '🦍', '⬛'],
          ['⬛', '😮', '⬛'],
          ['⬛', '⬛', '⬛'],
        ],
      }),
    ).toBe(false);
  });

  it('should be true if mordicus can be found and there are no bananas or coins left on the grid', () => {
    expect(
      Logic.isSuccess({
        ...mockState,
        grid: [
          ['⬛', '🦍', '⬛'],
          ['⬛', '⬛', '⬛'],
          ['⬛', '😮', '⬛'],
        ],
      }),
    ).toBe(true);
  });
});

describe('getActiveMoveResult', () => {
  it('should return an unchanged state if mordicus tries to move out of bound', () => {
    const state = {
      ...mockState,
      grid: [['😮']] as Grid.GridType,
    };

    for (const dir of Directions.all) {
      expect(Logic.getActiveMoveResult(state, dir)).toStrictEqual(state);
    }
  });

  it('should return an unchanged state if mordicus is blocked by an unmoveable unit', () => {
    const startGrid = [
      ['⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '🐔', '⬛', '⬛'],
      ['⬛', '🐔', '😮', '🐔', '⬛'],
      ['⬛', '⬛', '🐔', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛'],
    ] as TestGridType;

    for (const blocker of Units.moveBlockers) {
      for (const dir of Directions.all) {
        const state = {
          ...mockState,
          grid: getGridWithChickensReplaced(startGrid, blocker),
        };

        expect(Logic.getActiveMoveResult(state, dir)).toStrictEqual(state);
      }
    }
  });

  it(`should return an unchanged state if there's a grid boundary directly behind moveable units`, () => {
    const startGrid = [
      ['⬛', '🐔', '⬛'],
      ['🐔', '😮', '🐔'],
      ['⬛', '🐔', '⬛'],
    ] as TestGridType;

    for (const unit of Units.moveables) {
      for (const dir of Directions.all) {
        const state = {
          ...mockState,
          grid: getGridWithChickensReplaced(startGrid, unit),
        };

        expect(Logic.getActiveMoveResult(state, dir)).toStrictEqual(state);
      }
    }
  });

  it(`should return an unchanged state if there's a grid boundary directly behind an arrow`, () => {
    const startGrid = [
      ['🟥', '🟥', '⬆️', '🟥', '🟥'],
      ['🟥', '🟥', '⬇️', '🟥', '🟥'],
      ['⬇️', '⬆️', '😮', '⬅️', '➡️'],
      ['🟥', '🟥', '⬅️', '🟥', '🟥'],
      ['🟥', '🟥', '➡️', '🟥', '🟥'],
    ] as Grid.GridType;

    for (const dir of Directions.all) {
      const state = {
        ...mockState,
        grid: startGrid,
      };

      expect(Logic.getActiveMoveResult(state, dir)).toStrictEqual(state);
    }
  });

  it(`should return an unchanged state if there's a push blocking unit directly behind moveable units`, () => {
    const startGrid = [
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🐔', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '🐔', '⬆️', '🟩', '🍌', '😮', '🍌', '🟩', '⬇️', '🐔', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🐔', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
    ] as TestGridType;

    for (const pushBlocker of Units.pushBlockers) {
      for (const dir of Directions.all) {
        const state = {
          ...mockState,
          grid: getGridWithChickensReplaced(startGrid, pushBlocker),
        };

        expect(Logic.getActiveMoveResult(state, dir)).toStrictEqual(state);
      }
    }
  });

  it('should execute the move and gather any coins mordicus moves on', () => {
    const startGrid = [
      ['🟡', '🟡', '🟡'],
      ['😮', '🟡', '🟡'],
    ] as Grid.GridType;

    const sequence: {
      dir: Directions.DirectionType;
      grid: Grid.GridType;
    }[] = [
      {
        dir: 'ArrowUp',
        grid: [
          ['😮', '🟡', '🟡'],
          ['⬛', '🟡', '🟡'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowRight',
        grid: [
          ['⬛', '😮', '🟡'],
          ['⬛', '🟡', '🟡'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowRight',
        grid: [
          ['⬛', '⬛', '😮'],
          ['⬛', '🟡', '🟡'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowDown',
        grid: [
          ['⬛', '⬛', '⬛'],
          ['⬛', '🟡', '😮'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowLeft',
        grid: [
          ['⬛', '⬛', '⬛'],
          ['⬛', '😮', '⬛'],
        ] as Grid.GridType,
      },
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getActiveMoveResult(accState, currTest.dir);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it('should execute the move if mordicus moves to an empty space', () => {
    const startGrid = [
      ['⬛', '⬛'],
      ['😮', '⬛'],
    ] as Grid.GridType;

    const sequence: {
      dir: Directions.DirectionType;
      grid: Grid.GridType;
    }[] = [
      {
        dir: 'ArrowUp',
        grid: [
          ['😮', '⬛'],
          ['⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowRight',
        grid: [
          ['⬛', '😮'],
          ['⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowDown',
        grid: [
          ['⬛', '⬛'],
          ['⬛', '😮'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowLeft',
        grid: [
          ['⬛', '⬛'],
          ['😮', '⬛'],
        ] as Grid.GridType,
      },
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getActiveMoveResult(accState, currTest.dir);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it(`should push the rows of units forward if they are moveable units and there's at least one empty space behind them`, () => {
    const startGrid = [
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '🍌', '🍌', '🟩', '⬅️', '⬛'],
      ['⬛', '➡️', '🟩', '🍌', '😮', '🍌', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
    ] as Grid.GridType;

    const sequence: {
      dir: Directions.DirectionType;
      grid: Grid.GridType;
    }[] = [
      {
        dir: 'ArrowUp',
        grid: [
          ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '😮', '🍌', '🟩', '⬅️', '⬛'],
          ['⬛', '➡️', '🟩', '🍌', '⬛', '🍌', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowRight',
        grid: [
          ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '😮', '🍌', '🟩', '⬅️'],
          ['⬛', '➡️', '🟩', '🍌', '⬛', '🍌', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowDown',
        grid: [
          ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '🟩', '⬅️'],
          ['⬛', '➡️', '🟩', '🍌', '⬛', '😮', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowLeft',
        grid: [
          ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '🟩', '⬅️'],
          ['⬛', '➡️', '🟩', '🍌', '😮', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ] as Grid.GridType,
      },
      {
        dir: 'ArrowLeft',
        grid: [
          ['⬛', '⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '🟩', '⬅️'],
          ['➡️', '🟩', '🍌', '😮', '⬛', '⬛', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🍌', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '🟩', '⬛', '⬛', '⬛'],
          ['⬛', '⬛', '⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ] as Grid.GridType,
      },
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getActiveMoveResult(accState, currTest.dir);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it(`should not immediately move arrows freed following mordicus' move`, () => {
    const moves: {
      startGrid: Grid.GridType;
      dir: Directions.DirectionType;
      expected: Grid.GridType;
    }[] = [
      {
        startGrid: [
          ['⬛', '⬛', '⬛'],
          ['➡️', '😮', '⬅️'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
        dir: 'ArrowUp',
        expected: [
          ['⬛', '😮', '⬛'],
          ['➡️', '⬛', '⬅️'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
      },
      {
        startGrid: [
          ['⬛', '⬇️', '⬛'],
          ['➡️', '😮', '⬛'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
        dir: 'ArrowRight',
        expected: [
          ['⬛', '⬇️', '⬛'],
          ['➡️', '⬛', '😮'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
      },
      {
        startGrid: [
          ['⬛', '⬇️', '⬛'],
          ['➡️', '😮', '⬅️'],
          ['⬛', '⬛', '⬛'],
        ] as Grid.GridType,
        dir: 'ArrowDown',
        expected: [
          ['⬛', '⬇️', '⬛'],
          ['➡️', '⬛', '⬅️'],
          ['⬛', '😮', '⬛'],
        ] as Grid.GridType,
      },
      {
        startGrid: [
          ['⬛', '⬇️', '⬛'],
          ['⬛', '😮', '⬅️'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
        dir: 'ArrowLeft',
        expected: [
          ['⬛', '⬇️', '⬛'],
          ['😮', '⬛', '⬅️'],
          ['⬛', '⬆️', '⬛'],
        ] as Grid.GridType,
      },
    ];

    for (const { startGrid, dir, expected } of moves) {
      expect(
        Logic.getActiveMoveResult(
          {
            ...mockState,
            grid: startGrid,
          },
          dir,
        ),
      ).toStrictEqual({
        ...mockState,
        grid: expected,
      });
    }
  });
});

describe('getPassiveMovesResult', () => {
  it('should move red gorillas adjacent to mordicus on top of him', () => {
    const startGrid = [
      ['🦍', '🦍', '🦍'],
      ['🦍', '😮', '🦍'],
      ['🦍', '🦍', '🦍'],
    ] as Grid.GridType;

    expect(
      Logic.getPassiveMovesResult({
        ...mockState,
        grid: startGrid,
      }),
    ).toStrictEqual({
      ...mockState,
      grid: [
        ['🦍', '⬛', '🦍'],
        ['⬛', '🦍', '⬛'],
        ['🦍', '⬛', '🦍'],
      ] as Grid.GridType,
    });
  });

  it('should move and duplicate red gorillas over each banana adjacent to them', () => {
    const startGrid = [
      ['🦍', '🍌', '🍌', '🍌', '🍌', '🍌', '🦍'],
      ['🍌', '🦍', '🍌', '🍌', '🍌', '🦍', '🍌'],
      ['🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌'],
      ['🍌', '🍌', '🍌', '😮', '🍌', '🍌', '🍌'],
      ['🍌', '🍌', '🍌', '🍌', '🍌', '🍌', '🍌'],
      ['🍌', '🦍', '🍌', '🍌', '🍌', '🦍', '🍌'],
      ['🦍', '🍌', '🍌', '🍌', '🍌', '🍌', '🦍'],
    ] as Grid.GridType;

    const sequence: Grid.GridType[] = [
      [
        ['⬛', '🦍', '🍌', '🍌', '🍌', '🦍', '⬛'],
        ['🦍', '⬛', '🦍', '🍌', '🦍', '⬛', '🦍'],
        ['🍌', '🦍', '🍌', '🍌', '🍌', '🦍', '🍌'],
        ['🍌', '🍌', '🍌', '😮', '🍌', '🍌', '🍌'],
        ['🍌', '🦍', '🍌', '🍌', '🍌', '🦍', '🍌'],
        ['🦍', '⬛', '🦍', '🍌', '🦍', '⬛', '🦍'],
        ['⬛', '🦍', '🍌', '🍌', '🍌', '🦍', '⬛'],
      ] as Grid.GridType,
      [
        ['⬛', '⬛', '🦍', '🍌', '🦍', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['🦍', '⬛', '🦍', '🍌', '🦍', '⬛', '🦍'],
        ['🍌', '🦍', '🍌', '😮', '🍌', '🦍', '🍌'],
        ['🦍', '⬛', '🦍', '🍌', '🦍', '⬛', '🦍'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '🦍', '🍌', '🦍', '⬛', '⬛'],
      ] as Grid.GridType,
      [
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['🦍', '⬛', '🦍', '😮', '🦍', '⬛', '🦍'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
      ] as Grid.GridType,
      [
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['🦍', '⬛', '⬛', '🦍', '⬛', '⬛', '🦍'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '🦍', '⬛', '⬛', '⬛'],
      ] as Grid.GridType,
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getPassiveMovesResult(accState);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it('should duplicate red gorillas on the same move both on top of mordicus and the adjacent bananas', () => {
    const startGrid = [
      ['⬛', '⬛', '🍌', '⬛', '⬛'],
      ['⬛', '🍌', '🦍', '🍌', '⬛'],
      ['🍌', '🦍', '😮', '🦍', '🍌'],
      ['⬛', '🍌', '🦍', '🍌', '⬛'],
      ['⬛', '⬛', '🍌', '⬛', '⬛'],
    ] as Grid.GridType;

    expect(
      Logic.getPassiveMovesResult({
        ...mockState,
        grid: startGrid,
      }),
    ).toStrictEqual({
      ...mockState,
      grid: [
        ['⬛', '⬛', '🦍', '⬛', '⬛'],
        ['⬛', '🦍', '⬛', '🦍', '⬛'],
        ['🦍', '⬛', '🦍', '⬛', '🦍'],
        ['⬛', '🦍', '⬛', '🦍', '⬛'],
        ['⬛', '⬛', '🦍', '⬛', '⬛'],
      ] as Grid.GridType,
    });
  });

  it('should move blue gorillas adjacent to mordicus on top of him', () => {
    const startGrid = [
      ['🐵', '🐵', '🐵'],
      ['🐵', '😮', '🐵'],
      ['🐵', '🐵', '🐵'],
    ] as Grid.GridType;

    expect(
      Logic.getPassiveMovesResult({
        ...mockState,
        grid: startGrid,
      }),
    ).toStrictEqual({
      ...mockState,
      grid: [
        ['🐵', '⬛', '🐵'],
        ['⬛', '🙈', '⬛'],
        ['🐵', '⬛', '🐵'],
      ] as Grid.GridType,
    });
  });

  it('should move and duplicate blue gorillas over each banana adjacent to them and then change them into a satiated blue gorilla that stays still', () => {
    const startGrid = [
      ['🐵', '🍌', '🍌', '🍌', '🐵'],
      ['🍌', '🐵', '🍌', '🐵', '🍌'],
      ['🍌', '🍌', '😮', '🍌', '🍌'],
      ['🍌', '🐵', '🍌', '🐵', '🍌'],
      ['🐵', '🍌', '🍌', '🍌', '🐵'],
    ] as Grid.GridType;

    const sequence: Grid.GridType[] = [
      [
        ['⬛', '🙈', '🍌', '🙈', '⬛'],
        ['🙈', '⬛', '🙈', '⬛', '🙈'],
        ['🍌', '🙈', '😮', '🙈', '🍌'],
        ['🙈', '⬛', '🙈', '⬛', '🙈'],
        ['⬛', '🙈', '🍌', '🙈', '⬛'],
      ] as Grid.GridType,
      [
        ['⬛', '🙈', '🍌', '🙈', '⬛'],
        ['🙈', '⬛', '🙈', '⬛', '🙈'],
        ['🍌', '🙈', '😮', '🙈', '🍌'],
        ['🙈', '⬛', '🙈', '⬛', '🙈'],
        ['⬛', '🙈', '🍌', '🙈', '⬛'],
      ] as Grid.GridType,
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getPassiveMovesResult(accState);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it('should duplicate blue gorillas on the same move both on top of mordicus and the adjacent bananas', () => {
    const startGrid = [
      ['⬛', '⬛', '🍌', '⬛', '⬛'],
      ['⬛', '🍌', '🐵', '🍌', '⬛'],
      ['🍌', '🐵', '😮', '🐵', '🍌'],
      ['⬛', '🍌', '🐵', '🍌', '⬛'],
      ['⬛', '⬛', '🍌', '⬛', '⬛'],
    ] as Grid.GridType;

    expect(
      Logic.getPassiveMovesResult({
        ...mockState,
        grid: startGrid,
      }),
    ).toStrictEqual({
      ...mockState,
      grid: [
        ['⬛', '⬛', '🙈', '⬛', '⬛'],
        ['⬛', '🙈', '⬛', '🙈', '⬛'],
        ['🙈', '⬛', '🙈', '⬛', '🙈'],
        ['⬛', '🙈', '⬛', '🙈', '⬛'],
        ['⬛', '⬛', '🙈', '⬛', '⬛'],
      ] as Grid.GridType,
    });
  });

  it('should move free arrows one move after they are freed', () => {
    const startGrid = [
      ['⬇️', '⬛', '⬛', '🦍', '⬅️'],
      ['🦍', '🍌', '⬛', '🍌', '⬛'],
      ['⬛', '⬛', '😮', '⬛', '⬛'],
      ['⬛', '🍌', '⬛', '🍌', '🦍'],
      ['➡️', '🦍', '⬛', '⬛', '⬆️'],
    ] as Grid.GridType;

    const sequence: Grid.GridType[] = [
      [
        ['⬇️', '⬛', '⬛', '⬛', '⬅️'],
        ['⬛', '🦍', '⬛', '🦍', '⬛'],
        ['⬛', '⬛', '😮', '⬛', '⬛'],
        ['⬛', '🦍', '⬛', '🦍', '⬛'],
        ['➡️', '⬛', '⬛', '⬛', '⬆️'],
      ] as Grid.GridType,
      [
        ['⬛', '⬛', '⬛', '⬅️', '⬛'],
        ['⬇️', '🦍', '⬛', '🦍', '⬛'],
        ['⬛', '⬛', '😮', '⬛', '⬛'],
        ['⬛', '🦍', '⬛', '🦍', '⬆️'],
        ['⬛', '➡️', '⬛', '⬛', '⬛'],
      ] as Grid.GridType,
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getPassiveMovesResult(accState);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it('should move free arrows until they face the grid boundary', () => {
    const startGrid = [
      ['⬇️', '⬛', '⬅️'],
      ['⬛', '😮', '⬛'],
      ['➡️', '⬛', '⬆️'],
    ] as Grid.GridType;

    const sequence: Grid.GridType[] = [
      [
        ['⬛', '⬅️', '⬛'],
        ['⬇️', '😮', '⬆️'],
        ['⬛', '➡️', '⬛'],
      ] as Grid.GridType,
      [
        ['⬅️', '⬛', '⬆️'],
        ['⬛', '😮', '⬛'],
        ['⬇️', '⬛', '➡️'],
      ] as Grid.GridType,
      [
        ['⬅️', '⬛', '⬆️'],
        ['⬛', '😮', '⬛'],
        ['⬇️', '⬛', '➡️'],
      ] as Grid.GridType,
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getPassiveMovesResult(accState);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });

  it('should move free arrows until they face any non empty, non arrow unit', () => {
    const startGrid = [
      ['😮', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['➡️', '⬛', '⬛', '🐔', '⬛', '⬛', '⬅️'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
    ] as TestGridType;

    const sequence: TestGridType[] = [
      [
        ['😮', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '➡️', '⬛', '🐔', '⬛', '⬅️', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ] as TestGridType,
      [
        ['😮', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '➡️', '🐔', '⬅️', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ] as TestGridType,
      [
        ['😮', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬇️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '➡️', '🐔', '⬅️', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬆️', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ] as TestGridType,
    ];

    const arrowsAndEmpty = [...Units.arrows, '⬛'];
    const noArrowsOrEmpty = Units.all.filter(
      (unit) => !arrowsAndEmpty.some((arrowOrEmpty) => arrowOrEmpty === unit),
    );
    for (const unit of noArrowsOrEmpty) {
      sequence.reduce(
        (accState, currTest) => {
          const result = Logic.getPassiveMovesResult(accState);
          expect(result).toStrictEqual({
            ...mockState,
            grid: getGridWithChickensReplaced(currTest, unit),
          });

          return result;
        },
        {
          ...mockState,
          grid: getGridWithChickensReplaced(startGrid, unit),
        } as StateSnapshot,
      );
    }
  });

  it('should change arrows moving on top of each other into red blocks', () => {
    const startGrid = [
      ['😮', '⬇️', '⬛', '⬇️', '⬛', '⬇️', '⬛'],
      ['➡️', '⬛', '➡️', '⬛', '⬅️', '⬛', '⬅️'],
      ['➡️', '⬇️', '⬅️', '⬇️', '⬇️', '⬇️', '⬇️'],
      ['➡️', '⬛', '➡️', '⬛', '⬅️', '⬛', '⬅️'],
      ['➡️', '⬆️', '⬅️', '⬆️', '⬆️', '⬆️', '⬆️'],
      ['➡️', '⬛', '➡️', '⬛', '⬅️', '⬛', '⬅️'],
      ['⬛', '⬆️', '⬛', '⬆️', '⬛', '⬆️', '⬛'],
    ] as Grid.GridType;

    const sequence: Grid.GridType[] = [
      [
        ['😮', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '🟥', '⬛', '🟥', '⬛', '🟥', '⬛'],
        ['➡️', '⬛', '⬅️', '⬛', '⬇️', '⬛', '⬇️'],
        ['⬛', '🟥', '⬛', '🟥', '⬛', '🟥', '⬛'],
        ['➡️', '⬛', '⬅️', '⬛', '⬆️', '⬛', '⬆️'],
        ['⬛', '🟥', '⬛', '🟥', '⬛', '🟥', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ] as Grid.GridType,
      [
        ['😮', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '🟥', '⬛', '🟥', '⬛', '🟥', '⬛'],
        ['⬛', '🟥', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '🟥', '⬛', '🟥', '🟥', '🟥', '🟥'],
        ['⬛', '🟥', '⬛', '⬛', '⬛', '⬛', '⬛'],
        ['⬛', '🟥', '⬛', '🟥', '⬛', '🟥', '⬛'],
        ['⬛', '⬛', '⬛', '⬛', '⬛', '⬛', '⬛'],
      ] as Grid.GridType,
    ];

    sequence.reduce(
      (accState, currTest) => {
        const result = Logic.getPassiveMovesResult(accState);
        expect(result).toStrictEqual({
          ...mockState,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockState,
        grid: startGrid,
      } as StateSnapshot,
    );
  });
});
