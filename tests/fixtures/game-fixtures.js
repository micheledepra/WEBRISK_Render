module.exports = {
    player: {
        id: 'player1',
        name: 'Hero',
        health: 100,
        inventory: ['sword', 'shield', 'potion']
    },
    enemy: {
        id: 'enemy1',
        name: 'Goblin',
        health: 50,
        attack: 10
    },
    gameState: {
        currentPhase: 'combat',
        turnOrder: ['player1', 'enemy1'],
        round: 1
    },
    setupCombat: function() {
        return {
            player: { ...this.player },
            enemy: { ...this.enemy },
            gameState: { ...this.gameState }
        };
    }
};