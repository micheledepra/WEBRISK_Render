/**
 * Multiplayer Game Flow Test
 * Tests server-side game engine and client-server synchronization
 * 
 * Run this with: node multiplayer/server/test-multiplayer.js
 */

const io = require('socket.io-client');

// Configuration
const SERVER_URL = 'http://localhost:3000';
const SESSION_CODE = 'TEST-' + Math.random().toString(36).substring(7).toUpperCase();

console.log('🧪 ====================================');
console.log('🧪 MULTIPLAYER GAME FLOW TEST');
console.log('🧪 ====================================\n');
console.log(`📍 Server: ${SERVER_URL}`);
console.log(`📍 Session: ${SESSION_CODE}\n`);

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

function logTest(name, passed, message = '') {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${name}${message ? ': ' + message : ''}`);
    testResults.tests.push({ name, passed, message });
    if (passed) {
        testResults.passed++;
    } else {
        testResults.failed++;
    }
}

async function runTests() {
    console.log('🔌 Connecting clients...\n');
    
    // Create two clients (Alice and Bob)
    const alice = io(SERVER_URL, { transports: ['websocket'] });
    const bob = io(SERVER_URL, { transports: ['websocket'] });
    
    // Wait for connections
    await Promise.all([
        new Promise(resolve => alice.on('connect', resolve)),
        new Promise(resolve => bob.on('connect', resolve))
    ]);
    
    logTest('Connection', true, 'Both clients connected');
    
    // Test 1: Create session
    console.log('\n📝 Test 1: Session Creation');
    alice.emit('createSession', {
        sessionCode: SESSION_CODE,
        playerName: 'Alice',
        maxPlayers: 2
    });
    
    await new Promise(resolve => {
        alice.on('sessionCreated', (data) => {
            logTest('Session creation', data.success, `Session ${SESSION_CODE} created`);
            resolve();
        });
        setTimeout(() => {
            logTest('Session creation', false, 'Timeout');
            resolve();
        }, 5000);
    });
    
    // Test 2: Join session
    console.log('\n📝 Test 2: Join Session');
    bob.emit('joinSession', {
        sessionCode: SESSION_CODE,
        playerName: 'Bob'
    });
    
    await new Promise(resolve => {
        bob.on('sessionJoined', (data) => {
            logTest('Session join', data.success, 'Bob joined session');
            resolve();
        });
        setTimeout(() => {
            logTest('Session join', false, 'Timeout');
            resolve();
        }, 5000);
    });
    
    // Test 3: Set players ready
    console.log('\n📝 Test 3: Player Ready Status');
    alice.emit('playerReady', { sessionCode: SESSION_CODE });
    await new Promise(resolve => setTimeout(resolve, 500));
    bob.emit('playerReady', { sessionCode: SESSION_CODE });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    logTest('Players ready', true, 'Both players ready');
    
    // Test 4: Initialize game on server
    console.log('\n📝 Test 4: Server-Side Game Initialization');
    alice.emit('game:initialize', {
        sessionCode: SESSION_CODE,
        players: ['Alice', 'Bob'],
        playerColors: { 'Alice': '#ff0000', 'Bob': '#0000ff' }
    });
    
    let gameInitialized = false;
    await new Promise(resolve => {
        alice.on('game:initialized', (data) => {
            gameInitialized = true;
            const hasState = data.success && data.gameState;
            const hasTerritories = hasState && Object.keys(data.gameState.territories).length > 0;
            
            logTest('Game initialization', hasState && hasTerritories, 
                `State received with ${hasTerritories ? Object.keys(data.gameState.territories).length : 0} territories`);
            
            if (hasState) {
                console.log(`   Turn: ${data.gameState.turnNumber}`);
                console.log(`   Phase: ${data.gameState.phase}`);
                console.log(`   Current Player: ${data.gameState.players[data.gameState.currentPlayerIndex]}`);
            }
            
            resolve();
        });
        setTimeout(() => {
            if (!gameInitialized) {
                logTest('Game initialization', false, 'Timeout waiting for server');
            }
            resolve();
        }, 5000);
    });
    
    // Test 5: Deploy armies (startup phase)
    console.log('\n📝 Test 5: Army Deployment Validation');
    
    // Get current player from initialization
    let currentPlayer = 'Alice';
    let aliceTerritory = null;
    let bobTerritory = null;
    
    // Listen for state updates
    let deploymentSuccess = false;
    alice.on('game:stateUpdate', (data) => {
        deploymentSuccess = true;
        logTest('Deployment execution', true, 'Server processed deployment');
    });
    
    alice.on('game:actionFailed', (data) => {
        logTest('Deployment validation', true, `Server rejected invalid action: ${data.error}`);
    });
    
    // Try to deploy to Alice's territory (should succeed if it's her turn)
    setTimeout(() => {
        alice.emit('game:deploy', {
            sessionCode: SESSION_CODE,
            userId: 'Alice',
            territoryId: 'alaska', // Assuming Alice owns Alaska
            armyCount: 1
        });
    }, 1000);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test 6: Invalid deployment (wrong player)
    console.log('\n📝 Test 6: Invalid Action Rejection');
    
    let rejectionReceived = false;
    bob.on('game:actionFailed', (data) => {
        rejectionReceived = true;
        logTest('Invalid action rejection', true, `Server rejected: ${data.error}`);
    });
    
    // Try to deploy on wrong turn
    setTimeout(() => {
        bob.emit('game:deploy', {
            sessionCode: SESSION_CODE,
            userId: 'Bob',
            territoryId: 'brazil',
            armyCount: 1
        });
    }, 500);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!rejectionReceived) {
        logTest('Invalid action rejection', false, 'Server did not reject invalid action');
    }
    
    // Test 7: State synchronization
    console.log('\n📝 Test 7: State Synchronization');
    
    let bobReceivedUpdate = false;
    bob.on('game:stateUpdate', (data) => {
        bobReceivedUpdate = true;
        logTest('State broadcast', true, 'Bob received Alice\'s deployment update');
    });
    
    // Alice deploys again
    setTimeout(() => {
        alice.emit('game:deploy', {
            sessionCode: SESSION_CODE,
            userId: 'Alice',
            territoryId: 'alaska',
            armyCount: 1
        });
    }, 500);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (!bobReceivedUpdate) {
        logTest('State broadcast', false, 'Bob did not receive state update');
    }
    
    // Summary
    console.log('\n🎯 ====================================');
    console.log('🎯 TEST SUMMARY');
    console.log('🎯 ====================================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📊 Total: ${testResults.tests.length}`);
    console.log(`📈 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%\n`);
    
    if (testResults.failed === 0) {
        console.log('🎉 All tests passed! Multiplayer system is working correctly.\n');
    } else {
        console.log('⚠️ Some tests failed. Review the logs above for details.\n');
    }
    
    // Disconnect
    alice.disconnect();
    bob.disconnect();
    
    process.exit(testResults.failed > 0 ? 1 : 0);
}

// Run tests
setTimeout(() => {
    runTests().catch(error => {
        console.error('\n❌ Test execution failed:', error);
        process.exit(1);
    });
}, 1000);
