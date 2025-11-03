class AttackLogic {
  constructor(gameState) {
    this.gameState = gameState;
    this.directCombat = new DirectCombat(); // Use direct army input system
  }

  validateAttack(fromTerritory, toTerritory) {
    // DEPRECATED: Use ValidationManager.validateAttack() instead
    return ValidationManager.validateAttack(fromTerritory, toTerritory);
  }

  // Method replaced with direct combat approach
  determineArmyCounts(attackerArmies, defenderArmies) {
    // Determine remaining armies based on combat rules
    return {
      remainingAttackerArmies: attackerArmies - 1, // Default to losing 1 army
      remainingDefenderArmies: Math.max(0, defenderArmies - 1), // Default to losing 1 army or all if only had 1
    };
  }

  resolveBattle(
    attackingTerritory,
    defendingTerritory,
    attackerRemainingArmies,
    defenderRemainingArmies
  ) {
    // Get territories
    const attacker = this.gameState.territories[attackingTerritory];
    const defender = this.gameState.territories[defendingTerritory];

    // If no remaining armies specified, use default values
    if (attackerRemainingArmies === undefined) {
      attackerRemainingArmies = attacker.armies - 1;
    }
    if (defenderRemainingArmies === undefined) {
      defenderRemainingArmies = Math.max(0, defender.armies - 1);
    }

    // Calculate losses
    const attackerLosses = attacker.armies - attackerRemainingArmies;
    const defenderLosses = defender.armies - defenderRemainingArmies;

    // Validate inputs
    if (attackerRemainingArmies < 1) {
      console.error("Invalid attacker remaining armies: must be at least 1");
      return {
        success: false,
        error: "Attacker must have at least 1 army remaining",
      };
    }

    if (attackerRemainingArmies > attacker.armies) {
      console.error(
        "Invalid attacker remaining armies: cannot exceed current armies"
      );
      return {
        success: false,
        error: "Remaining armies cannot exceed current armies",
      };
    }

    if (defenderRemainingArmies < 0) {
      console.error("Invalid defender remaining armies: cannot be negative");
      return { success: false, error: "Defender armies cannot be negative" };
    }

    if (defenderRemainingArmies > defender.armies) {
      console.error(
        "Invalid defender remaining armies: cannot exceed current armies"
      );
      return {
        success: false,
        error: "Remaining armies cannot exceed current armies",
      };
    }

    const losses = {
      attacker: attackerLosses,
      defender: defenderLosses,
    };

    // Apply losses
    attacker.armies = attackerRemainingArmies;
    defender.armies = defenderRemainingArmies;

    // Dispatch army change events for real-time updates
    window.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: attackingTerritory, armies: attacker.armies }
    }));
    window.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: defendingTerritory, armies: defender.armies }
    }));

    // Check if territory is conquered
    if (defender.armies === 0) {
      losses.territoryConquered = true;
      const conquerer = attacker.owner;
      defender.owner = conquerer;
      // Default move is 1 army
      defender.armies = 1;
      attacker.armies -= 1;
      
      // Dispatch conquest event
      window.dispatchEvent(new CustomEvent('territoryConquered', {
        detail: { 
          territoryId: defendingTerritory, 
          newOwner: conquerer,
          armies: defender.armies 
        }
      }));
      
      // ✅ Update territory visuals with dynamic opacity
      this.updateTerritoryVisuals(defendingTerritory, conquerer);
      
      console.log(`🎯 Territory conquered! ${defendingTerritory} now owned by ${conquerer}`);
    } else {
      // Update both territories' opacity after battle (armies changed)
      this.updateTerritoryVisuals(attackingTerritory, attacker.owner);
      this.updateTerritoryVisuals(defendingTerritory, defender.owner);
    }

    return losses;
  }

  /**
   * Update territory visuals including dynamic opacity
   * @param {string} territoryId - Territory to update
   * @param {string} owner - Territory owner
   */
  updateTerritoryVisuals(territoryId, owner) {
    // Use ColorManager if available for dynamic opacity
    if (window.riskUI && window.riskUI.colorManager) {
      window.riskUI.colorManager.updateTerritoryColorWithOpacity(territoryId, owner, this.gameState);
    } else {
      // Fallback to direct update with opacity calculation
      this.updateTerritoryColor(territoryId, owner);
    }
  }

  /**
   * Update territory color in the UI (fallback method)
   * Now uses ColorManager's official dynamic opacity system
   * @param {string} territoryId - Territory to update
   * @param {string} owner - New owner
   */
  updateTerritoryColor(territoryId, owner) {
    // Prefer using ColorManager's official method
    if (window.riskUI && window.riskUI.colorManager) {
      if (typeof window.riskUI.colorManager.updateTerritoryColorWithOpacity === 'function') {
        window.riskUI.colorManager.updateTerritoryColorWithOpacity(territoryId, owner, this.gameState);
        console.log(`✅ Updated ${territoryId} using ColorManager dynamic opacity system`);
        return;
      } else if (typeof window.riskUI.colorManager.updateTerritoryColor === 'function') {
        window.riskUI.colorManager.updateTerritoryColor(territoryId, owner, this.gameState);
        console.log(`✅ Updated ${territoryId} using ColorManager`);
        return;
      }
    }
    
    // FALLBACK: Manual implementation (should rarely be used)
    console.warn('⚠️ Using fallback territory color update - ColorManager not available');
    const pathElement = document.getElementById(territoryId);
    if (!pathElement) {
      console.warn(`Territory element not found: ${territoryId}`);
      return;
    }
    
    // Get player color from GameState
    const playerColor = this.gameState.playerColors[owner];
    if (!playerColor) {
      console.warn(`No color found for player: ${owner}`);
      return;
    }
    
    // Get territory army count
    const territory = this.gameState.territories[territoryId];
    const armies = territory ? territory.armies : 1;
    
    // Calculate dynamic opacity (25% min, 90% max)
    const maxArmies = Math.max(
      ...Object.values(this.gameState.territories).map(t => t.armies || 1),
      1
    );
    const opacity = maxArmies === 1 ? 0.25 : 
      0.25 + ((armies - 1) / (maxArmies - 1)) * 0.65;
    
    // Convert hex to RGBA
    const hex = playerColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const rgbaColor = `rgba(${r}, ${g}, ${b}, ${opacity})`;
    
    // Create darker border color (20% darker)
    const factor = 0.8;
    const darkR = Math.round(r * factor);
    const darkG = Math.round(g * factor);
    const darkB = Math.round(b * factor);
    const toHex = (value) => value.toString(16).padStart(2, '0');
    const darkerBorderColor = `#${toHex(darkR)}${toHex(darkG)}${toHex(darkB)}`;
    
    // Update SVG path element with RGBA color and darker border
    pathElement.style.fill = rgbaColor;
    pathElement.style.stroke = darkerBorderColor;
    pathElement.style.strokeWidth = '0.5';
    console.log(`✅ Fallback: Updated ${territoryId} color to ${rgbaColor} (${armies} armies, ${(opacity * 100).toFixed(0)}% opacity)`);
  }

  getMaxAttackingDice(territory) {
    const armies = this.gameState.territories[territory].armies;
    // Use actual army count instead of hardcoded 3
    // Attacker can use armies-1 (must leave 1 behind)
    return Math.max(1, armies);
  }

  getMaxDefendingDice(territory) {
    const armies = this.gameState.territories[territory].armies;
    // Use actual army count instead of hardcoded 2
    // Defender can use all their armies
    return Math.max(1, armies);
  }

  canContinueAttacking(fromTerritory) {
    const territory = this.gameState.territories[fromTerritory];
    if (!territory || territory.armies <= 1) {
      return false;
    }

    // Check if there are any valid targets
    return territory.neighbors.some((neighbor) => {
      const neighborTerritory = this.gameState.territories[neighbor];
      return neighborTerritory.owner !== territory.owner;
    });
  }

  getPossibleAttackTargets(fromTerritory) {
    const territory = this.gameState.territories[fromTerritory];
    if (!territory || territory.armies <= 1) {
      return [];
    }

    return territory.neighbors.filter((neighbor) => {
      const neighborTerritory = this.gameState.territories[neighbor];
      return neighborTerritory.owner !== territory.owner;
    });
  }

  moveTroopsAfterConquest(fromTerritory, toTerritory, amount) {
    const from = this.gameState.territories[fromTerritory];
    const to = this.gameState.territories[toTerritory];

    if (amount >= from.armies) {
      throw new Error("Must leave at least one army in attacking territory");
    }

    if (amount < 1) {
      throw new Error("Must move at least one army to conquered territory");
    }

    from.armies -= amount;
    to.armies += amount;

    // Dispatch army movement events for real-time updates
    window.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: fromTerritory, armies: from.armies }
    }));
    window.dispatchEvent(new CustomEvent('armyCountChanged', {
      detail: { territoryId: toTerritory, armies: to.armies }
    }));

    return {
      fromCount: from.armies,
      toCount: to.armies,
    };
  }
}
