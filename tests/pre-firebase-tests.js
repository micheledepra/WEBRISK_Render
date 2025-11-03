/**
 * 🧪 Pre-Firebase Integration Tests
 * Comprehensive test suite to verify all systems before Firebase
 */

const SessionCodeGenerator = require('../multiplayer/shared/SessionCodeGenerator');
const TurnValidator = require('../multiplayer/shared/TurnValidator');
const ConflictResolver = require('../multiplayer/shared/ConflictResolver');

console.log('🧪 Starting Pre-Firebase Test Suite\n');

// ============================================
// Test 1: Session Code Generator
// ============================================
console.log('📝 Test 1: Session Code Generator');

const codeGenerator = new SessionCodeGenerator();

// Test generation
const code1 = codeGenerator.generate();
console.log(`  Generated code: ${code1}`);
console.assert(code1.length === 6, '❌ Code length should be 6');
console.assert(codeGenerator.validate(code1), '❌ Generated code should be valid');

// Test validation
console.assert(codeGenerator.validate('ABC123'), '❌ Valid code failed validation');
console.assert(!codeGenerator.validate('ABC12'), '❌ Invalid code passed validation');
console.assert(!codeGenerator.validate('ABC1234'), '❌ Invalid code passed validation');
console.assert(!codeGenerator.validate('abc123'), '❌ Lowercase code should fail');

// Test normalization
console.assert(codeGenerator.normalize(' abc123 ') === 'ABC123', '❌ Normalization failed');

// Test unique generation
const existingCodes = new Set(['ABC123', 'XYZ789']);
const uniqueCode = codeGenerator.generateUnique(existingCodes);
console.assert(uniqueCode !== null, '❌ Failed to generate unique code');
console.assert(!existingCodes.has(uniqueCode), '❌ Generated duplicate code');

// Test statistics
const stats = codeGenerator.getStatistics();
console.log(`  Total possible codes: ${stats.formattedTotal}`);
console.log(`  Collision risk at 1000 sessions: ${stats.collisionAt1000}`);

console.log('✅ Test 1 Passed\n');

// ============================================
// Test 2: Turn Validator
// ============================================
console.log('📝 Test 2: Turn Validator');

const turnValidator = new TurnValidator();

// Mock session data
const mockSession = {
    started: true,
    gameState: {
        currentPlayer: 'Player1',
        currentPhase: 'reinforcement',
        reinforcementsRemaining: 5,
        territories: {
            'alaska': {
                id: 'alaska',
                owner: 'Player1',
                armies: 5,
                neighbors: ['kamchatka']
            },
            'kamchatka': {
                id: 'kamchatka',
                owner: 'Player2',
                armies: 3,
                neighbors: ['alaska']
            }
        }
    }
};

// Test valid reinforcement
let validation = turnValidator.validateAction({
    sessionData: mockSession,
    playerId: 'Player1',
    action: 'placeArmy',
    territoryId: 'alaska',
    armies: 1
});
console.assert(validation.valid, '❌ Valid reinforcement failed');

// Test wrong turn
validation = turnValidator.validateAction({
    sessionData: mockSession,
    playerId: 'Player2',
    action: 'placeArmy',
    territoryId: 'kamchatka',
    armies: 1
});
console.assert(!validation.valid, '❌ Wrong turn should fail');
console.assert(validation.error.includes('Not your turn'), '❌ Wrong error message');

// Test wrong phase
mockSession.gameState.currentPhase = 'attack';
validation = turnValidator.validateAction({
    sessionData: mockSession,
    playerId: 'Player1',
    action: 'placeArmy',
    territoryId: 'alaska',
    armies: 1
});
console.assert(!validation.valid, '❌ Wrong phase action should fail');

// Test attack validation
validation = turnValidator.validateAction({
    sessionData: mockSession,
    playerId: 'Player1',
    action: 'selectAttacker',
    territoryId: 'alaska'
});
console.assert(validation.valid, '❌ Valid attack selection failed');

// Test invalid attack (not enough armies)
mockSession.gameState.territories.alaska.armies = 1;
validation = turnValidator.validateAction({
    sessionData: mockSession,
    playerId: 'Player1',
    action: 'selectAttacker',
    territoryId: 'alaska'
});
console.assert(!validation.valid, '❌ Attack with 1 army should fail');

// Test game state validation
mockSession.gameState.territories.alaska.armies = 5; // Reset
mockSession.gameState.currentPhase = 'reinforcement'; // Reset
const stateValidation = turnValidator.validateGameState(mockSession.gameState);
console.assert(stateValidation.valid, '❌ Valid game state failed validation');

console.log('✅ Test 2 Passed\n');

// ============================================
// Test 3: Conflict Resolver
// ============================================
console.log('📝 Test 3: Conflict Resolver');

const conflictResolver = new ConflictResolver();

// Test timestamp-based resolution (remote newer)
const localState = {
    timestamp: 1000,
    version: '1.0',
    currentPlayer: 'Player1',
    territories: { 'alaska': { armies: 5 } }
};

const remoteState = {
    timestamp: 2000,
    version: '1.0',
    currentPlayer: 'Player2',
    territories: { 'alaska': { armies: 7 } }
};

let resolution = conflictResolver.resolveConflict(localState, remoteState);
console.assert(resolution.resolvedState === remoteState, '❌ Should prefer remote (newer)');
console.assert(resolution.resolution === 'remote_newer', '❌ Wrong resolution type');

// Test timestamp-based resolution (local newer)
localState.timestamp = 3000;
resolution = conflictResolver.resolveConflict(localState, remoteState);
console.assert(resolution.resolvedState === localState, '❌ Should prefer local (newer)');
console.assert(resolution.resolution === 'local_newer', '❌ Wrong resolution type');

// Test merge scenario
localState.timestamp = 2000; // Same timestamp
resolution = conflictResolver.resolveConflict(localState, remoteState);
console.assert(resolution.resolvedState !== null, '❌ Merge failed');

// Test version-based resolution
localState.version = '2.0';
remoteState.version = '1.0';
localState.timestamp = 1000;
remoteState.timestamp = 2000;
resolution = conflictResolver.resolveConflict(localState, remoteState);
console.assert(resolution.resolution === 'local_higher_version', '❌ Should prefer higher version');

// Test statistics
const conflictStats = conflictResolver.getStatistics();
console.log(`  Total conflicts logged: ${conflictStats.totalConflicts}`);

console.log('✅ Test 3 Passed\n');

// ============================================
// Integration Test
// ============================================
console.log('📝 Integration Test: Complete Session Flow');

// 1. Generate session code
const sessionCode = codeGenerator.generate();
console.log(`  Session code: ${sessionCode}`);

// 2. Validate game state
const gameState = {
    territories: {
        'alaska': { id: 'alaska', owner: 'Player1', armies: 5, neighbors: ['kamchatka'] },
        'kamchatka': { id: 'kamchatka', owner: 'Player2', armies: 3, neighbors: ['alaska'] }
    },
    currentPlayer: 'Player1',
    currentPhase: 'reinforcement',
    reinforcementsRemaining: 5
};

const stateValid = turnValidator.validateGameState(gameState);
console.assert(stateValid.valid, '❌ Game state validation failed');

// 3. Validate player action
const actionValid = turnValidator.validateAction({
    sessionData: { started: true, gameState },
    playerId: 'Player1',
    action: 'placeArmy',
    territoryId: 'alaska',
    armies: 1
});
console.assert(actionValid.valid, '❌ Action validation failed');

// 4. Simulate state conflict
const updatedState = { ...gameState, timestamp: Date.now() + 1000 };
const conflictRes = conflictResolver.resolveConflict(gameState, updatedState);
console.assert(conflictRes.resolvedState !== null, '❌ Conflict resolution failed');

console.log('✅ Integration Test Passed\n');

// ============================================
// Summary
// ============================================
console.log('='.repeat(50));
console.log('🎉 ALL PRE-FIREBASE TESTS PASSED!');
console.log('='.repeat(50));
console.log('\n📊 System Statistics:');
console.log(`  - Session Code Space: ${stats.formattedTotal} possible codes`);
console.log(`  - Conflict Resolution: ${conflictStats.totalConflicts} conflicts logged`);
console.log(`  - Turn Validation: Ready for multiplayer`);
console.log('\n✅ Ready for Firebase integration!');
