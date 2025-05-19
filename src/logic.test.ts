import { assert, DeepReadonly } from 'ts-essentials';
import * as Directions from './directions';
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

const mockSnapshot: Logic.ILevelSnapshot = {
  grid: [],
  bonus: 0,
  lives: 5,
};

describe('isSuccess', () => {
  it('should be false if mordicus cannot be found on the grid', () => {
    expect(
      Logic.isSuccess([
        ['⬛', '⬛', '⬛'],
        ['⬛', '🦍', '⬛'],
        ['⬛', '⬛', '⬛'],
      ]),
    ).toBe(false);
  });

  it('should be false if there are still bananas left on the grid', () => {
    expect(
      Logic.isSuccess([
        ['⬛', '🦍', '⬛'],
        ['🍌', '⬛', '🍌'],
        ['⬛', '😮', '⬛'],
      ]),
    ).toBe(false);
  });

  it('should be false if there are still coins left on the grid', () => {
    expect(
      Logic.isSuccess([
        ['⬛', '🦍', '⬛'],
        ['🟡', '⬛', '🟡'],
        ['⬛', '😮', '⬛'],
      ]),
    ).toBe(false);
  });

  it('should be false if there is at least one gorilla surrounding mordicus', () => {
    expect(
      Logic.isSuccess([
        ['⬛', '🦍', '⬛'],
        ['⬛', '😮', '⬛'],
        ['⬛', '⬛', '⬛'],
      ]),
    ).toBe(false);
  });

  it('should be true if mordicus can be found and there are no bananas or coins left on the grid', () => {
    expect(
      Logic.isSuccess([
        ['⬛', '🦍', '⬛'],
        ['⬛', '⬛', '⬛'],
        ['⬛', '😮', '⬛'],
      ]),
    ).toBe(true);
  });
});

describe('getActiveMoveResult', () => {
  it('should return undefined if mordicus tries to move out of bound', () => {
    const snapshot = {
      ...mockSnapshot,
      grid: [['😮']] as Grid.GridType,
    };

    for (const dir of Directions.all) {
      expect(Logic.getActiveMoveResult(snapshot, dir)).toBeUndefined();
    }
  });

  it('should return undefined if mordicus is blocked by an unmoveable unit', () => {
    const startGrid = [
      ['⬛', '⬛', '⬛', '⬛', '⬛'],
      ['⬛', '⬛', '🐔', '⬛', '⬛'],
      ['⬛', '🐔', '😮', '🐔', '⬛'],
      ['⬛', '⬛', '🐔', '⬛', '⬛'],
      ['⬛', '⬛', '⬛', '⬛', '⬛'],
    ] as TestGridType;

    for (const blocker of Units.moveBlockers) {
      for (const dir of Directions.all) {
        const snapshot = {
          ...mockSnapshot,
          grid: getGridWithChickensReplaced(startGrid, blocker),
        };

        expect(Logic.getActiveMoveResult(snapshot, dir)).toBeUndefined();
      }
    }
  });

  it('should return undefined if there is a grid boundary directly behind moveable units', () => {
    const startGrid = [
      ['⬛', '🐔', '⬛'],
      ['🐔', '😮', '🐔'],
      ['⬛', '🐔', '⬛'],
    ] as TestGridType;

    for (const unit of Units.moveables) {
      for (const dir of Directions.all) {
        const snapshot = {
          ...mockSnapshot,
          grid: getGridWithChickensReplaced(startGrid, unit),
        };

        expect(Logic.getActiveMoveResult(snapshot, dir)).toBeUndefined();
      }
    }
  });

  it('should return undefined if there is a grid boundary directly behind an arrow', () => {
    const startGrid = [
      ['🟥', '🟥', '⬆️', '🟥', '🟥'],
      ['🟥', '🟥', '⬇️', '🟥', '🟥'],
      ['⬇️', '⬆️', '😮', '⬅️', '➡️'],
      ['🟥', '🟥', '⬅️', '🟥', '🟥'],
      ['🟥', '🟥', '➡️', '🟥', '🟥'],
    ] as Grid.GridType;

    for (const dir of Directions.all) {
      const snapshot = {
        ...mockSnapshot,
        grid: startGrid,
      };

      expect(Logic.getActiveMoveResult(snapshot, dir)).toBeUndefined();
    }
  });

  it('should return undefined if there is a push blocking unit directly behind moveable units', () => {
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
        const snapshot = {
          ...mockSnapshot,
          grid: getGridWithChickensReplaced(startGrid, pushBlocker),
        };

        expect(Logic.getActiveMoveResult(snapshot, dir)).toBeUndefined();
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

        assert(result);

        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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

        assert(result);

        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
    );
  });

  it('should push the rows of units forward if they are moveable units and there is at least one empty space behind them', () => {
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

        assert(result);

        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest.grid,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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
            ...mockSnapshot,
            grid: startGrid,
          },
          dir,
        ),
      ).toMatchObject({
        ...mockSnapshot,
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
        ...mockSnapshot,
        grid: startGrid,
      }),
    ).toMatchObject({
      ...mockSnapshot,
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
        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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
        ...mockSnapshot,
        grid: startGrid,
      }),
    ).toMatchObject({
      ...mockSnapshot,
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
        ...mockSnapshot,
        grid: startGrid,
      }),
    ).toMatchObject({
      ...mockSnapshot,
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
        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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
        ...mockSnapshot,
        grid: startGrid,
      }),
    ).toMatchObject({
      ...mockSnapshot,
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
        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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
        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
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
          expect(result).toMatchObject({
            ...mockSnapshot,
            grid: getGridWithChickensReplaced(currTest, unit),
          });

          return result;
        },
        {
          ...mockSnapshot,
          grid: getGridWithChickensReplaced(startGrid, unit),
        },
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
        expect(result).toMatchObject({
          ...mockSnapshot,
          grid: currTest,
        });

        return result;
      },
      {
        ...mockSnapshot,
        grid: startGrid,
      },
    );
  });
});
