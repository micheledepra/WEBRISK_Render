describe('TurnManager', () => {
    let turnManager;

    beforeEach(() => {
        turnManager = new TurnManager();
    });

    test('should initialize with default values', () => {
        expect(turnManager.currentTurn).toBe(0);
        expect(turnManager.totalTurns).toBeGreaterThan(0);
    });

    test('should advance to the next turn', () => {
        turnManager.advanceTurn();
        expect(turnManager.currentTurn).toBe(1);
    });

    test('should reset turns correctly', () => {
        turnManager.advanceTurn();
        turnManager.resetTurns();
        expect(turnManager.currentTurn).toBe(0);
    });
});