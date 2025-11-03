/**
 * TurnManager - Official Risk Rules Implementation
 * Manages turn progression following official Risk board game rules
 */
class TurnManager {
  constructor(gameState) {
    this.gameState = gameState;
    this.selectedTerritory = null;
    this.diceResults = null;
    this.lastAttackResult = null;
    this.attackLogic = new AttackLogic(gameState);
    this.directCombat = new DirectCombat(); // Direct army input system
    this.turnNumber = 0; // Start at Turn 0 (startup phase)
    this.currentPhase = "startup"; // Official Risk starts with startup phase
    this.startupComplete = false; // Track if one-time startup is done
    this.reinforcementManager = null;
    this.fortificationManager = null;
    this.phaseSynchronizer = null; // Set after initialization
    
    // Phase definitions following official Risk rules
    this.phaseDefinitions = {
      startup: {
        name: 'Startup',
        emoji: '🎮',
        description: 'Players take turns placing initial armies',
        mandatory: true,
        oneTimeOnly: true,
        canSkip: false
      },
      reinforcement: {
        name: 'Reinforcement',
        emoji: '💰',
        description: 'Calculate and deploy reinforcement armies',
        mandatory: true,
        oneTimeOnly: false,
        canSkip: false
      },
      attack: {
        name: 'Attack',
        emoji: '⚔️',
        description: 'Attack adjacent enemy territories',
        mandatory: false,
        oneTimeOnly: false,
        canSkip: true
      },
      fortification: {
        name: 'Fortification',
        emoji: '🛡️',
        description: 'Move armies between connected territories',
        mandatory: false,
        oneTimeOnly: false,
        canSkip: true
      }
    };
  }

  /**
   * Set phase synchronizer (called after all managers initialized)
   * @param {PhaseSynchronizer} synchronizer - Phase synchronizer instance
   */
  setPhaseSynchronizer(synchronizer) {
    this.phaseSynchronizer = synchronizer;
    console.log("[TurnManager] PhaseSynchronizer connected");
  }

  setReinforcementManager(reinforcementManager) {
    this.reinforcementManager = reinforcementManager;
  }

  setFortificationManager(fortificationManager) {
    this.fortificationManager = fortificationManager;
  }

  /**
   * Advance to next phase following official Risk turn order
   */
  advancePhase() {
    const phaseOrder = this.startupComplete 
      ? ['reinforcement', 'attack', 'fortification']
      : ['startup'];
    
    const currentIndex = phaseOrder.indexOf(this.currentPhase);
    
    if (currentIndex === -1) {
      console.error(`[TurnManager] Invalid phase: ${this.currentPhase}`);
      return false;
    }
    
    // If at end of phase cycle
    if (currentIndex === phaseOrder.length - 1) {
      // If in startup, check if ALL players have finished initial deployment
      if (this.currentPhase === 'startup') {
        // Check if all players have deployed all their initial armies
        const allPlayersFinished = this.gameState.players.every(player => 
          (this.gameState.remainingArmies[player] || 0) === 0
        );
        
        if (allPlayersFinished) {
          // All players finished - transition to regular turns
          this.startupComplete = true;
          this.currentPhase = 'reinforcement';
          this.turnNumber = 1;
          
          // Reset to first player
          this.gameState.currentPlayerIndex = 0;
          this.gameState.phase = 'reinforcement';
          
          // IMPORTANT: Clear all remainingArmies before calculating reinforcements
          // This prevents startup armies from carrying over
          this.gameState.players.forEach(player => {
            this.gameState.remainingArmies[player] = 0;
          });
          
          // Now calculate fresh reinforcements for first player
          this.calculateReinforcements();
          
          console.log('🎮 Initial Setup Complete! Beginning Turn 1 with reinforcement phase.');
          console.log(`First player: ${this.gameState.getCurrentPlayer()}`);
          console.log(`Reinforcements: ${this.gameState.remainingArmies[this.gameState.getCurrentPlayer()]}`);
          
          this.syncWithGameState();
          
          // Update UI
          if (window.updateTurnManagementUI) {
            window.updateTurnManagementUI();
          }
          if (window.updateReinforcementPanel) {
            window.updateReinforcementPanel();
          }
          
          return true;
        } else {
          // Some players still have armies to deploy - continue startup
          console.log('⏳ Initial setup continues - some players still have armies to deploy');
          return false;
        }
      }
      
      // Normal turn: End of fortification phase
      // This means current player has completed their turn
      // Advance to next player and restart at reinforcement phase
      console.log(`✅ ${this.gameState.getCurrentPlayer()} completed their turn (all 3 phases)`);
      
      this.currentPhase = 'reinforcement';
      const playerAdvanced = this.advancePlayer();
      
      if (playerAdvanced) {
        // Calculate reinforcements for the new player
        this.calculateReinforcements();
        console.log(`🎯 ${this.gameState.getCurrentPlayer()}'s turn begins - Reinforcement Phase`);
        console.log(`Reinforcements: ${this.gameState.remainingArmies[this.gameState.getCurrentPlayer()]}`);
      }
      
      return playerAdvanced;
    }
    
    // Move to next phase within the same player's turn
    const oldPhase = this.currentPhase;
    this.currentPhase = phaseOrder[currentIndex + 1];
    this.syncWithGameState();
    
    console.log(`[TurnManager] ${this.gameState.getCurrentPlayer()} advanced: ${oldPhase} → ${this.currentPhase}`);
    
    // Update UI
    if (window.updateTurnManagementUI) {
      window.updateTurnManagementUI();
    }
    if (window.updateReinforcementPanel) {
      window.updateReinforcementPanel();
    }
    
    return true;
  }

  /**
   * Skip current phase (only if optional)
   */
  skipPhase() {
    const phaseDef = this.phaseDefinitions[this.currentPhase];
    
    if (!phaseDef.canSkip) {
      console.warn(`[TurnManager] Cannot skip mandatory phase: ${this.currentPhase}`);
      return false;
    }
    
    console.log(`[TurnManager] Skipping ${this.currentPhase} phase`);
    return this.advancePhase();
  }

  /**
   * Advance to next player
   */
  advancePlayer() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const result = this.gameState.nextPlayer();
    const newPlayer = this.gameState.getCurrentPlayer();
    
    if (result.turnComplete) {
      this.turnNumber++;
      console.log(`🔄 Turn ${this.turnNumber} starting`);
    }
    
    console.log(`👤 Player change: ${currentPlayer} → ${newPlayer}`);
    
    // ✅ CRITICAL: Reset deployment tracking for new player
    // This ensures each player's deployment is tracked independently
    if (window.resetPhaseTracking) {
      window.resetPhaseTracking();
      console.log('[TurnManager] ✅ Deployment tracking reset for new player');
    }
    
    // Reset fortification for new player
    if (this.fortificationManager) {
      this.fortificationManager.resetForNewTurn();
      console.log('[TurnManager] Fortification reset for new player');
    }
    
    this.syncWithGameState();
    
    // Update UI
    if (window.updateTurnManagementUI) {
      window.updateTurnManagementUI();
    }
    if (window.updateReinforcementPanel) {
      window.updateReinforcementPanel();
    }
    
    return true;
  }

  /**
   * Check if current phase requirements are met
   */
  canAdvancePhase() {
    switch (this.currentPhase) {
      case 'startup':
        // Can advance when current player has deployed all startup armies
        const startupPlayer = this.gameState.getCurrentPlayer();
        return (this.gameState.remainingArmies[startupPlayer] || 0) === 0;
        
      case 'reinforcement':
        // Can advance when all reinforcements are deployed
        const player = this.gameState.getCurrentPlayer();
        return (this.gameState.remainingArmies[player] || 0) === 0;
        
      case 'attack':
      case 'fortification':
        // Optional phases can always be advanced/skipped
        return true;
        
      default:
        return true;
    }
  }

  /**
   * Get current phase
   * @returns {string} - Current phase name
   */
  getCurrentPhase() {
    return this.currentPhase;
  }

  /**
   * Get current phase information
   */
  getCurrentPhaseInfo() {
    return {
      phase: this.currentPhase,
      ...this.phaseDefinitions[this.currentPhase],
      canAdvance: this.canAdvancePhase(),
      turnNumber: this.turnNumber,
      currentPlayer: this.gameState.getCurrentPlayer(),
      startupComplete: this.startupComplete
    };
  }

  /**
   * Sync with GameState
   */
  syncWithGameState() {
    if (this.gameState) {
      this.gameState.phase = this.currentPhase;
      this.gameState.turnNumber = this.turnNumber;
    }
    
    if (this.phaseSynchronizer) {
      this.phaseSynchronizer.updatePhase(this.currentPhase, 'TurnManager');
    }
  }

  /**
   * Get phase order
   */
  getPhaseOrder() {
    return this.startupComplete 
      ? ['reinforcement', 'attack', 'fortification']
      : ['startup'];
  }

  /**
   * Sync current phase with game state
   */
  syncPhaseDisplay() {
    this.currentPhase = this.gameState.phase;
  }

  handleTerritoryClick(territory) {
    switch (this.gameState.phase) {
      case "startup":
        return this.handleStartupClick(territory);
      case "reinforcement":
        return this.handleReinforcementClick(territory);
      case "attack":
        return this.handleAttackClick(territory);
      case "fortification":
        return this.handleFortificationClick(territory);
      default:
        console.warn(`[TurnManager] Unknown phase: ${this.gameState.phase}`);
        return null;
    }
  }

  handleStartupClick(territory) {
    const territoryData = this.gameState.territories[territory];
    const currentPlayer = this.gameState.getCurrentPlayer();
    const remainingArmies = this.gameState.remainingArmies[currentPlayer];

    // During startup, players can claim unclaimed territories OR add to their own
    if (!territoryData.owner) {
      // Claim unclaimed territory with 1 army
      territoryData.owner = currentPlayer;
      territoryData.armies = 1;
      this.gameState.remainingArmies[currentPlayer]--;

      // Only advance to next player if current player has no armies left
      if (this.gameState.remainingArmies[currentPlayer] === 0) {
        const nextPlayerResult = this.gameState.nextPlayer();
        
        // Check if startup is complete (all players deployed AND we're back to first player)
        if (this.gameState.initialDeploymentComplete) {
          console.log('🎮 Startup phase complete! Transitioning to Turn 1...');
          
          // Transition to Turn 1 with reinforcement phase
          this.startupComplete = true;
          this.currentPhase = 'reinforcement';
          this.turnNumber = 1;
          this.gameState.phase = 'reinforcement';
          this.gameState.turnNumber = 1;
          this.gameState.currentPlayerIndex = 0; // Reset to first player
          
          // Clear all remainingArmies before calculating reinforcements
          this.gameState.players.forEach(player => {
            this.gameState.remainingArmies[player] = 0;
          });
          
          // Calculate reinforcements for first player
          this.calculateReinforcements();
          
          // Update PhaseSynchronizer if available
          if (this.phaseSynchronizer) {
            this.phaseSynchronizer.updatePhase('reinforcement', 'StartupComplete');
          }
          
          const firstPlayer = this.gameState.getCurrentPlayer();
          console.log(`✅ Turn 1 begins! ${firstPlayer} gets ${this.gameState.remainingArmies[firstPlayer]} reinforcements`);
        }
      }

      // Update UI to reflect current/next player
      if (window.updateTurnManagementUI) {
        window.updateTurnManagementUI();
      }
      if (window.updateReinforcementPanel) {
        window.updateReinforcementPanel();
      }

      return {
        type: "territory-claim",
        territory,
        owner: territoryData.owner,
        remainingArmies: this.gameState.remainingArmies[currentPlayer],
        nextPlayer: this.gameState.getCurrentPlayer(),
      };
    } else if (territoryData.owner === currentPlayer && remainingArmies > 0) {
      // Open bulk deployment modal for owned territories
      if (this.reinforcementManager) {
        this.reinforcementManager.openDeploymentModal(territory);
        return {
          type: "startup-modal-opened",
          territory,
          owner: territoryData.owner,
          armies: territoryData.armies,
          remainingArmies: this.gameState.remainingArmies[currentPlayer]
        };
      }
      
      // Fallback: Add single army if ReinforcementManager not available
      territoryData.armies++;
      this.gameState.remainingArmies[currentPlayer]--;

      // Only advance to next player if current player has no armies left
      if (this.gameState.remainingArmies[currentPlayer] === 0) {
        const nextPlayerResult = this.gameState.nextPlayer();
        
        // Check if startup is complete (all players deployed AND we're back to first player)
        if (this.gameState.initialDeploymentComplete) {
          console.log('🎮 Startup phase complete! Transitioning to Turn 1...');
          
          // Transition to Turn 1 with reinforcement phase
          this.startupComplete = true;
          this.currentPhase = 'reinforcement';
          this.turnNumber = 1;
          this.gameState.phase = 'reinforcement';
          this.gameState.turnNumber = 1;
          this.gameState.currentPlayerIndex = 0; // Reset to first player
          
          // Clear all remainingArmies before calculating reinforcements
          this.gameState.players.forEach(player => {
            this.gameState.remainingArmies[player] = 0;
          });
          
          // Calculate reinforcements for first player
          this.calculateReinforcements();
          
          // Update PhaseSynchronizer if available
          if (this.phaseSynchronizer) {
            this.phaseSynchronizer.updatePhase('reinforcement', 'StartupComplete');
          }
          
          const firstPlayer = this.gameState.getCurrentPlayer();
          console.log(`✅ Turn 1 begins! ${firstPlayer} gets ${this.gameState.remainingArmies[firstPlayer]} reinforcements`);
        }
      }

      // Update UI to reflect current/next player
      if (window.updateTurnManagementUI) {
        window.updateTurnManagementUI();
      }
      if (window.updateReinforcementPanel) {
        window.updateReinforcementPanel();
      }

      return {
        type: "startup-placement",
        territory,
        owner: territoryData.owner,
        armies: territoryData.armies,
        remainingArmies: this.gameState.remainingArmies[currentPlayer],
        nextPlayer: this.gameState.getCurrentPlayer(),
      };
    }
    return null;
  }

  handleReinforcementClick(territory) {
    const territoryData = this.gameState.territories[territory];
    const currentPlayer = this.gameState.getCurrentPlayer();
    const remainingArmies = this.gameState.remainingArmies[currentPlayer];

    if (territoryData.owner === currentPlayer && remainingArmies > 0) {
      territoryData.armies++;
      this.gameState.remainingArmies[currentPlayer]--;

      return {
        type: "reinforcement",
        territory,
        owner: territoryData.owner,
        armies: territoryData.armies,
        remainingArmies: this.gameState.remainingArmies[currentPlayer]
      };
    }
    return null;
  }

  // Legacy method support (redirect to new phase names)
  handleInitialSetupClick(territory) {
    return this.handleStartupClick(territory);
  }

  handleInitialPlacementClick(territory) {
    return this.handleStartupClick(territory);
  }

  handleDeployClick(territory) {
    return this.handleReinforcementClick(territory);
  }

  handleReinforceClick(territory) {
    return this.handleReinforcementClick(territory);
  }

  handleFortifyClick(territory) {
    return this.handleFortificationClick(territory);
  }

  handleFortificationClick(territory) {
    // Delegate to FortificationManager if available
    if (this.fortificationManager) {
      return this.fortificationManager.handleTerritoryClick(territory);
    }
    
    // Fallback: basic fortification logic if manager not available
    const territoryData = this.gameState.territories[territory];
    const currentPlayer = this.gameState.getCurrentPlayer();
    
    if (!territoryData || territoryData.owner !== currentPlayer) {
      return null;
    }
    
    return {
      type: "fortification",
      territory,
      owner: territoryData.owner,
      armies: territoryData.armies
    };
  }

  endTurn() {
    // Reset fortification state for new turn
    if (this.fortificationManager) {
      this.fortificationManager.resetForNewTurn();
    }

    // Advance to next player - starts new turn with reinforcement phase
    this.currentPhase = 'reinforcement';
    this.gameState.phase = 'reinforcement';
    
    const nextPlayer = this.gameState.nextPlayer();
    if (nextPlayer.turnComplete) {
      this.turnNumber++;
      this.gameState.turnNumber = this.turnNumber;
    }

    this.calculateReinforcements();
    this.syncWithGameState();
  }

  getTurnNumber() {
    return this.turnNumber;
  }

  getRemainingArmies() {
    return this.gameState.remainingArmies[this.gameState.getCurrentPlayer()];
  }

  calculateReinforcements() {
    const currentPlayer = this.gameState.getCurrentPlayer();
    const reinforcements = this.gameState.calculateReinforcements
      ? this.gameState.calculateReinforcements(currentPlayer)
      : Math.max(
          1,
          Math.floor(
            Object.values(this.gameState.territories).filter(
              (t) => t.owner === currentPlayer
            ).length / 3
          )
        );

    this.gameState.remainingArmies[currentPlayer] = reinforcements;
    return reinforcements;
  }

  handleAttackClick(territory) {
    if (!this.selectedTerritory) {
      // First click - select attacking territory
      if (this.attackLogic.canContinueAttacking(territory)) {
        this.selectedTerritory = territory;
        const validTargets =
          this.attackLogic.getPossibleAttackTargets(territory);
        return {
          type: "attack-select",
          territory,
          validTargets,
          maxDice: this.attackLogic.getMaxAttackingDice(territory),
        };
      }
    } else {
      // Second click - select target territory
      const validation = this.attackLogic.validateAttack(
        this.selectedTerritory,
        territory
      );
      if (validation.valid) {
        // Get max dice counts for both sides
        const maxAttackerDice = this.attackLogic.getMaxAttackingDice(
          this.selectedTerritory
        );
        const maxDefenderDice = this.attackLogic.getMaxDefendingDice(territory);

        // For now, always use maximum dice (can be made configurable)
        const result = this.attackLogic.resolveBattle(
          this.selectedTerritory,
          territory,
          maxAttackerDice,
          maxDefenderDice
        );

        const attackResult = {
          type: "attack-resolve",
          attackingTerritory: this.selectedTerritory,
          defendingTerritory: territory,
          attackerDice: result.attackerDice,
          defenderDice: result.defenderDice,
          attackerLosses: result.attacker,
          defenderLosses: result.defender,
          territoryConquered: result.territoryConquered,
        };

        this.lastAttackResult = attackResult;
        this.selectedTerritory = null;
        return attackResult;
      } else {
        // Invalid target - deselect
        this.selectedTerritory = null;
        return {
          type: "attack-invalid",
          reason: validation.reason,
        };
      }
    }
    return null;
  }

  canAttackFrom(territory) {
    // DEPRECATED: Use ValidationManager.validateAttacker() instead
    return ValidationManager.validateAttacker(territory).valid;
  }

  getValidAttackTargets(territory) {
    // DEPRECATED: Use ValidationManager.getValidAttackTargets() instead
    return ValidationManager.getValidAttackTargets(territory);
  }

  canFortifyFrom(territory) {
    const territoryData = this.gameState.territories[territory];
    return (
      territoryData.owner === this.gameState.getCurrentPlayer() &&
      territoryData.armies > 1 &&
      this.getValidFortifyTargets(territory).length > 0
    );
  }

  getValidFortifyTargets(territory) {
    return this.gameState.territories[territory].neighbors.filter((neighbor) =>
      this.gameState.isValidFortify(territory, neighbor)
    );
  }

  resolveAttack(attackingTerritory, defendingTerritory) {
    const attacker = this.gameState.territories[attackingTerritory];
    const defender = this.gameState.territories[defendingTerritory];

    // Determine number of dice
    // Use actual army counts for dice
    const attackerDice = Math.max(1, attacker.armies - 1);
    const defenderDice = Math.max(1, defender.armies);

    // Roll dice using centralized DiceRoller
    const attackerRolls = this.diceRoller.rollDice(attackerDice);
    const defenderRolls = this.diceRoller.rollDice(defenderDice);

    // Resolve combat
    const losses = this.gameState.resolveCombat(attackerRolls, defenderRolls);

    // Apply losses
    attacker.armies -= losses.attacker;
    defender.armies -= losses.defender;

    // Check if territory is conquered
    let conquered = false;
    if (defender.armies === 0) {
      const conquerer = attacker.owner;
      defender.owner = conquerer;
      defender.armies = attackerDice;
      attacker.armies -= attackerDice;
      conquered = true;
      
      // ✅ CRITICAL: Update territory color immediately
      this.updateTerritoryColor(defendingTerritory, conquerer);
      
      console.log(`🎯 ${defendingTerritory} conquered by ${conquerer}!`);
    }

    return {
      type: "attack-resolve",
      attackingTerritory,
      defendingTerritory,
      attackerDice: attackerRolls,
      defenderDice: defenderRolls,
      attackerLosses: losses.attacker,
      defenderLosses: losses.defender,
      conquered,
      newAttackerArmies: attacker.armies,
      newDefenderArmies: defender.armies,
      newDefenderOwner: defender.owner,
    };
  }

  /**
   * Update territory color after ownership change
   * @param {string} territoryId - Territory to update
   * @param {string} newOwner - New owner
   */
  updateTerritoryColor(territoryId, newOwner) {
    const playerColor = this.gameState.playerColors[newOwner];
    if (!playerColor) {
      console.warn(`No color found for player: ${newOwner}`);
      return;
    }
    
    // Use ColorManager's official dynamic opacity system
    if (window.riskUI && window.riskUI.colorManager) {
      window.riskUI.colorManager.updateTerritoryColorWithOpacity(territoryId, newOwner, this.gameState);
      console.log(`✅ TurnManager: Updated ${territoryId} using dynamic opacity system`);
      return;
    }
    
    // FALLBACK: Direct DOM manipulation (should rarely be used)
    console.warn('⚠️ TurnManager using fallback - ColorManager not available');
    const territoryElement = document.getElementById(territoryId);
    if (!territoryElement) {
      console.warn(`Territory element not found: ${territoryId}`);
      return;
    }
    
    // Calculate dynamic opacity (25% min, 90% max)
    const territory = this.gameState.territories[territoryId];
    const armies = territory ? territory.armies : 1;
    const maxArmies = Math.max(
      ...Object.values(this.gameState.territories).map(t => t.armies || 1),
      1
    );
    const opacity = maxArmies === 1 ? 0.25 : 
      0.25 + ((armies - 1) / (maxArmies - 1)) * 0.65;
    
    // Convert to RGBA
    const hex = playerColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    
    territoryElement.style.fill = rgbaColor;
    territoryElement.style.stroke = playerColor;
    territoryElement.style.strokeWidth = '0.5';
    console.log(`✅ TurnManager fallback: Updated ${territoryId} with ${(opacity * 100).toFixed(0)}% opacity`);
  }

  resolveFortify(fromTerritory, toTerritory) {
    const from = this.gameState.territories[fromTerritory];
    const to = this.gameState.territories[toTerritory];

    // Move half of armies by default
    const armiesToMove = Math.floor((from.armies - 1) / 2);
    this.gameState.moveArmies(fromTerritory, toTerritory, armiesToMove);

    // End fortification phase
    this.gameState.nextPhase();

    return {
      type: "fortify-resolve",
      fromTerritory,
      toTerritory,
      armiesMoved: armiesToMove,
      newFromArmies: from.armies,
      newToArmies: to.armies,
    };
  }

  endPhase() {
    this.selectedTerritory = null;
    this.gameState.nextPhase();
    return {
      type: "phase-change",
      newPhase: this.gameState.phase,
      currentPlayer: this.gameState.getCurrentPlayer(),
      reinforcements:
        this.gameState.remainingArmies[this.gameState.getCurrentPlayer()],
    };
  }
}

// Make TurnManager available globally
if (typeof window !== 'undefined') {
  window.TurnManager = TurnManager;
}
