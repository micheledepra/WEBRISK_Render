/**
 * Combat System Debugger
 * Provides comprehensive debugging utilities for the combat system
 *
 * Usage:
 * - window.combatDebugger.checkSystemHealth() - Check if all systems are available
 * - window.combatDebugger.validateTerritoryData(id) - Validate territory data
 * - window.combatDebugger.traceBattle(attackerId, defenderId) - Trace battle execution
 * - window.combatDebugger.exportLogs() - Export all debug logs
 */
class CombatDebugger {
  constructor() {
    this.logs = [];
    this.enabled = true;
    console.log("🐛 Combat Debugger initialized");
  }

  /**
   * Enable or disable debugging
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    console.log(`🐛 Combat debugging ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Log a debug message
   */
  log(category, message, data = null) {
    if (!this.enabled) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      category: category,
      message: message,
      data: data,
    };

    this.logs.push(logEntry);

    const emoji = this._getCategoryEmoji(category);
    console.log(`${emoji} [${category}] ${message}`, data || "");
  }

  /**
   * Get emoji for category
   */
  _getCategoryEmoji(category) {
    const emojiMap = {
      init: "🚀",
      validation: "✅",
      error: "❌",
      warning: "⚠️",
      combat: "⚔️",
      territory: "🏴",
      armies: "🪖",
      conquest: "🏆",
      transfer: "↔️",
      state: "💾",
      ui: "🖥️",
    };
    return emojiMap[category] || "📝";
  }

  /**
   * Check combat system health
   */
  checkSystemHealth() {
    console.log("🏥 === COMBAT SYSTEM HEALTH CHECK ===");

    const checks = {
      CombatValidator: typeof CombatValidator !== "undefined",
      CombatSystem: typeof CombatSystem !== "undefined",
      CombatUI: typeof CombatUI !== "undefined",
      "window.combatUI": typeof window.combatUI !== "undefined",
      gameState: typeof window.gameState !== "undefined",
      "gameState.territories": window.gameState?.territories !== undefined,
      "window.GameStateManager": typeof window.GameStateManager !== "undefined",
    };

    let allHealthy = true;

    for (const [check, passed] of Object.entries(checks)) {
      const status = passed ? "✅" : "❌";
      console.log(`${status} ${check}: ${passed ? "OK" : "MISSING"}`);
      if (!passed) allHealthy = false;
    }

    console.log(
      allHealthy ? "✅ All systems operational" : "❌ Some systems missing"
    );
    return allHealthy;
  }

  /**
   * Validate territory data
   */
  validateTerritoryData(territoryId) {
    console.log(`🔍 Validating territory: ${territoryId}`);

    const sources = {
      "window.gameState": window.gameState?.territories?.[territoryId],
      "window.riskMap": window.riskMap?.territories?.[territoryId],
      GameStateManager:
        typeof GameStateManager !== "undefined"
          ? GameStateManager.getTerritory?.(territoryId)
          : null,
    };

    let found = false;
    for (const [source, data] of Object.entries(sources)) {
      if (data) {
        console.log(`✅ ${source}:`, {
          id: data.id || territoryId,
          name: data.name,
          owner: data.owner,
          armies: data.armies,
        });
        found = true;
      } else {
        console.warn(`⚠️ ${source}: Territory not found`);
      }
    }

    if (!found) {
      console.error(`❌ Territory "${territoryId}" not found in any source!`);
    }

    return found;
  }

  /**
   * Trace battle execution
   */
  traceBattle(attackerId, defenderId) {
    console.log("⚔️ === BATTLE TRACE START ===");
    console.log(`Attacker: ${attackerId}`);
    console.log(`Defender: ${defenderId}`);

    const attackerValid = this.validateTerritoryData(attackerId);
    const defenderValid = this.validateTerritoryData(defenderId);

    if (attackerValid && defenderValid) {
      console.log("✅ Both territories found");
    } else {
      console.error("❌ One or both territories missing");
    }

    console.log("⚔️ === BATTLE TRACE END ===");
    return attackerValid && defenderValid;
  }

  /**
   * Test combat validation
   */
  testValidation() {
    if (typeof CombatValidator === "undefined") {
      console.error("❌ CombatValidator not available");
      return;
    }

    console.log("🧪 === COMBAT VALIDATION TESTS ===");

    const validator = new CombatValidator();

    // Test 1: Valid battle
    console.log("\n📝 Test 1: Valid battle (5→4 armies, 3→1 armies)");
    const test1 = validator.validateBattleResult(5, 3, 4, 1);
    console.log(test1.valid ? "✅ PASS" : "❌ FAIL", test1);

    // Test 2: Invalid - attacker gains armies
    console.log("\n📝 Test 2: Invalid - attacker gains armies (5→6)");
    const test2 = validator.validateBattleResult(5, 3, 6, 1);
    console.log(
      test2.valid ? "❌ SHOULD FAIL" : "✅ PASS (correctly rejected)",
      test2
    );

    // Test 3: Invalid - defender gains armies
    console.log("\n📝 Test 3: Invalid - defender gains armies (3→4)");
    const test3 = validator.validateBattleResult(5, 3, 4, 4);
    console.log(
      test3.valid ? "❌ SHOULD FAIL" : "✅ PASS (correctly rejected)",
      test3
    );

    // Test 4: Conquest (defender to 0)
    console.log("\n📝 Test 4: Valid conquest (5→4, 2→0)");
    const test4 = validator.validateBattleResult(5, 2, 4, 0);
    console.log(test4.valid && test4.isConquest ? "✅ PASS" : "❌ FAIL", test4);

    // Test 5: Invalid - attacker goes to 0
    console.log("\n📝 Test 5: Invalid - attacker to 0 armies");
    const test5 = validator.validateBattleResult(5, 3, 0, 2);
    console.log(
      test5.valid ? "❌ SHOULD FAIL" : "✅ PASS (correctly rejected)",
      test5
    );

    console.log("\n🧪 === TESTS COMPLETE ===");
  }

  /**
   * Export logs
   */
  exportLogs() {
    const logsJson = JSON.stringify(this.logs, null, 2);
    console.log("📋 Combat Logs:", logsJson);
    return logsJson;
  }

  /**
   * Clear logs
   */
  clearLogs() {
    this.logs = [];
    console.log("🗑️ Combat logs cleared");
  }

  /**
   * Get detailed system status
   */
  getSystemStatus() {
    const status = {
      validator: typeof CombatValidator !== "undefined",
      combatSystem: typeof CombatSystem !== "undefined",
      combatUI: typeof CombatUI !== "undefined",
      combatUIInstance: typeof window.combatUI !== "undefined",
      gameState: typeof window.gameState !== "undefined",
      territories: window.gameState?.territories
        ? Object.keys(window.gameState.territories).length
        : 0,
      gameStateManager: typeof window.GameStateManager !== "undefined",
      timestamp: new Date().toISOString(),
    };

    console.log("📊 System Status:", status);
    return status;
  }
}

// Create global debugger instance
if (typeof window !== "undefined") {
  window.combatDebugger = new CombatDebugger();

  // Create quick debug commands
  window.debugCombat = {
    // Check system health
    health: () => window.combatDebugger.checkSystemHealth(),

    // Validate a territory
    territory: (id) => window.combatDebugger.validateTerritoryData(id),

    // Trace a battle
    trace: (attacker, defender) =>
      window.combatDebugger.traceBattle(attacker, defender),

    // Export logs
    logs: () => window.combatDebugger.exportLogs(),

    // Clear logs
    clear: () => window.combatDebugger.clearLogs(),

    // Test combat validation
    testValidation: () => window.combatDebugger.testValidation(),

    // Get system status
    status: () => window.combatDebugger.getSystemStatus(),
  };

  console.log(
    "🐛 Combat Debugger ready! Use window.debugCombat for quick commands:"
  );
  console.log("  debugCombat.health() - Check system health");
  console.log("  debugCombat.territory(id) - Validate territory");
  console.log("  debugCombat.trace(attacker, defender) - Trace battle");
  console.log("  debugCombat.testValidation() - Test validation system");
  console.log("  debugCombat.status() - Get system status");
  console.log("  debugCombat.logs() - Export logs");
  console.log("  debugCombat.clear() - Clear logs");
}
