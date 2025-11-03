/**
 * Shared Constants for Multiplayer Risk Game
 * Used by both client and server
 */

// Socket event types
const EVENTS = {
  // Connection events
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  
  // Session events
  SESSION_CREATE: 'session:create',
  SESSION_JOIN: 'session:join',
  SESSION_LEAVE: 'session:leave',
  SESSION_START: 'session:start',
  SESSION_UPDATE: 'session:update',
  SESSION_PLAYER_UPDATE: 'session:playersUpdate',
  SESSION_ERROR: 'session:error',
  
  // Game state events
  GAME_STATE_UPDATE: 'gameState:update',
  GAME_STATE_SYNC: 'gameState:sync',
  
  // Player action events
  PLAYER_ACTION: 'player:action',
  PLAYER_READY: 'player:ready',
  PLAYER_CONNECTED: 'player:connected',
  PLAYER_DISCONNECTED: 'player:disconnected',
  
  // Turn events
  TURN_START: 'turn:start',
  TURN_END: 'turn:end',
  TURN_VALIDATION_ERROR: 'turn:validationError',
  
  // Error events
  ERROR: 'error'
};

// Action types that can be sent to the server
const ACTION_TYPES = {
  END_TURN: 'endTurn',
  END_PHASE: 'endPhase',
  DEPLOY_ARMY: 'deployArmy',
  SELECT_ATTACK_TERRITORY: 'selectAttackTerritory',
  SELECT_DEFEND_TERRITORY: 'selectDefendTerritory',
  EXECUTE_ATTACK: 'executeAttack',
  FORTIFY: 'fortify',
  CLAIM_TERRITORY: 'claimTerritory'
};

// Game phases
const GAME_PHASES = {
  STARTUP: 'startup',
  REINFORCEMENT: 'reinforcement',
  ATTACK: 'attack',
  FORTIFY: 'fortify'
};

// Session states
const SESSION_STATES = {
  WAITING: 'waiting',
  READY: 'ready',
  IN_PROGRESS: 'in_progress',
  FINISHED: 'finished'
};

// Player states
const PLAYER_STATES = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  READY: 'ready',
  NOT_READY: 'not_ready'
};

// Maximum players per game
const MAX_PLAYERS = 6;
const MIN_PLAYERS = 2;

// Session ID length
const SESSION_ID_LENGTH = 6;

// Export for both Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EVENTS,
    ACTION_TYPES,
    GAME_PHASES,
    SESSION_STATES,
    PLAYER_STATES,
    MAX_PLAYERS,
    MIN_PLAYERS,
    SESSION_ID_LENGTH
  };
}
