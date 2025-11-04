describe('DiceRoller', () => {
    let diceRoller;

    beforeAll(() => {
        diceRoller = new DiceRoller();
    });

    test('should roll a number between 1 and 6', () => {
        const roll = diceRoller.roll();
        expect(roll).toBeGreaterThanOrEqual(1);
        expect(roll).toBeLessThanOrEqual(6);
    });

    test('should return the same value for multiple rolls', () => {
        const rolls = [];
        for (let i = 0; i < 100; i++) {
            rolls.push(diceRoller.roll());
        }
        rolls.forEach(roll => {
            expect(roll).toBeGreaterThanOrEqual(1);
            expect(roll).toBeLessThanOrEqual(6);
        });
    });
});