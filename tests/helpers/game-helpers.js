function generateMockData() {
    return {
        player: {
            id: 'player1',
            name: 'Test Player',
            health: 100,
            mana: 50
        },
        enemy: {
            id: 'enemy1',
            name: 'Test Enemy',
            health: 80,
            mana: 30
        },
        gameState: {
            turn: 1,
            phase: 'combat',
            players: [],
            enemies: []
        }
    };
}

function setupGame() {
    const mockData = generateMockData();
    // Initialize game state with mock data
    return {
        players: [mockData.player],
        enemies: [mockData.enemy],
        currentTurn: mockData.gameState.turn,
        currentPhase: mockData.gameState.phase
    };
}

function resetGame(game) {
    game.players.forEach(player => {
        player.health = 100;
        player.mana = 50;
    });
    game.enemies.forEach(enemy => {
        enemy.health = 80;
        enemy.mana = 30;
    });
    game.currentTurn = 1;
    game.currentPhase = 'combat';
}

module.exports = {
    generateMockData,
    setupGame,
    resetGame
};