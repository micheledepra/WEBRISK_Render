/**
 * ═══════════════════════════════════════════════════════════════════════════
 * COMBAT MANAGER USAGE EXAMPLES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Practical examples demonstrating how to use CombatManager in your Risk game.
 * Copy and adapt these examples for your specific needs.
 */

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 1: Basic Combat Flow
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete combat flow from initiation to conclusion
 */
function example1_BasicCombat() {
  console.log("═══ EXAMPLE 1: Basic Combat Flow ═══");

  // Initialize combat manager (typically done once at game start)
  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Territory IDs for this example
  const attackerId = "western-united-states";
  const defenderId = "alberta";

  // 1. Validate attack before starting
  console.log("\n1️⃣ Validating attack...");
  const validation = combatManager.validateAttack(attackerId, defenderId);

  if (!validation.valid) {
    console.error("❌ Cannot attack:", validation.reason);
    return;
  }
  console.log("✅ Attack is valid");

  // 2. Initiate combat
  console.log("\n2️⃣ Initiating combat...");
  const initResult = combatManager.initiateCombat(attackerId, defenderId);

  if (!initResult.success) {
    console.error("❌ Failed to initiate:", initResult.error);
    return;
  }

  console.log("✅ Combat initiated");
  console.log("   Attacker:", initResult.combatState.attacker.name);
  console.log(
    "   Attacker armies:",
    initResult.combatState.attacker.currentArmies
  );
  console.log("   Defender:", initResult.combatState.defender.name);
  console.log(
    "   Defender armies:",
    initResult.combatState.defender.currentArmies
  );

  // 3. Process battle (user inputs outcome)
  console.log("\n3️⃣ Processing battle...");
  const battleResult = combatManager.processBattle({
    attackerRemaining: 4, // Attacker loses 1 army
    defenderRemaining: 1, // Defender loses 1 army
  });

  if (!battleResult.success) {
    console.error("❌ Battle processing failed:", battleResult.error);
    return;
  }

  console.log("✅ Battle processed");
  console.log("   Attacker losses:", battleResult.attackerLosses);
  console.log("   Defender losses:", battleResult.defenderLosses);
  console.log("   Is conquest:", battleResult.isConquest);
  console.log("   Can continue:", battleResult.canContinue);

  // 4. End combat (attacker chooses to stop)
  console.log("\n4️⃣ Ending combat...");
  const endResult = combatManager.endCombat();

  console.log("✅ Combat ended");
  console.log("   Total rounds:", endResult.finalState.rounds);
  console.log("   Duration:", endResult.finalState.duration + "ms");
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 2: Conquest Scenario
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Complete conquest with army transfer
 */
function example2_ConquestScenario() {
  console.log("═══ EXAMPLE 2: Conquest Scenario ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Start combat
  console.log("\n1️⃣ Starting combat...");
  const initResult = combatManager.initiateCombat(
    "central-america",
    "venezuela"
  );

  if (!initResult.success) {
    console.error("❌ Cannot start combat:", initResult.error);
    return;
  }

  const initialAttackerArmies = initResult.combatState.attacker.currentArmies;
  console.log(
    "✅ Combat started with",
    initialAttackerArmies,
    "attacker armies"
  );

  // Battle resulting in conquest
  console.log("\n2️⃣ Processing conquest battle...");
  const battleResult = combatManager.processBattle({
    attackerRemaining: 3, // Attacker loses some armies
    defenderRemaining: 0, // Defender eliminated (CONQUEST!)
  });

  if (!battleResult.success) {
    console.error("❌ Battle failed:", battleResult.error);
    return;
  }

  if (!battleResult.isConquest) {
    console.error("❌ Expected conquest but defender not eliminated");
    return;
  }

  console.log("🏆 Territory conquered!");
  console.log(
    "   Attacker remaining:",
    battleResult.afterState.attacker.armies
  );

  // Complete conquest by transferring armies
  console.log("\n3️⃣ Completing conquest...");
  const armiesToMove = 2; // Move 2 armies into conquered territory

  const conquestResult = combatManager.completeConquest(armiesToMove);

  if (!conquestResult.success) {
    console.error("❌ Conquest completion failed:", conquestResult.error);
    return;
  }

  console.log("✅ Conquest complete!");
  console.log(
    "   Armies transferred:",
    conquestResult.conquestState.armiesTransferred
  );
  console.log("   New owner:", conquestResult.conquestState.conqueror);
  console.log(
    "   Attacker final armies:",
    conquestResult.conquestState.finalStates.attacker.armies
  );
  console.log(
    "   Conquered territory armies:",
    conquestResult.conquestState.finalStates.conquered.armies
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 3: Multi-Round Battle
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Battle with multiple rounds until conquest
 */
function example3_MultiRoundBattle() {
  console.log("═══ EXAMPLE 3: Multi-Round Battle ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Start combat
  const initResult = combatManager.initiateCombat("alaska", "kamchatka");
  if (!initResult.success) return;

  console.log("✅ Combat started");

  // Simulate multiple battle rounds
  let roundNumber = 1;
  let conquered = false;

  while (!conquered && combatManager.isCombatActive()) {
    console.log(`\n🎲 Round ${roundNumber}:`);

    // Get current state
    const state = combatManager.getCurrentCombatState();
    console.log("   Attacker:", state.attacker.currentArmies, "armies");
    console.log("   Defender:", state.defender.currentArmies, "armies");

    // Determine battle outcome (simplified for example)
    const attackerLosses = Math.random() < 0.5 ? 1 : 0;
    const defenderLosses = Math.random() < 0.7 ? 1 : 0;

    const battleResult = combatManager.processBattle({
      attackerRemaining: state.attacker.currentArmies - attackerLosses,
      defenderRemaining: state.defender.currentArmies - defenderLosses,
    });

    if (!battleResult.success) {
      console.error("❌ Battle failed:", battleResult.error);
      break;
    }

    console.log(
      "   Result: -",
      attackerLosses,
      "attacker, -",
      defenderLosses,
      "defender"
    );

    if (battleResult.isConquest) {
      console.log("🏆 Conquest achieved in round", roundNumber);
      conquered = true;

      // Complete conquest
      const conquestResult = combatManager.completeConquest(
        battleResult.afterState.attacker.armies - 1
      );
      console.log("✅ Conquest completed");
      break;
    }

    if (!battleResult.canContinue) {
      console.log("⚠️ Attacker cannot continue");
      combatManager.endCombat();
      break;
    }

    // User decides to continue
    roundNumber++;

    if (roundNumber > 10) {
      console.log("⚠️ Battle limit reached, ending combat");
      combatManager.endCombat();
      break;
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 4: Using Battle Suggestions
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Use AI-generated battle suggestions to help user
 */
function example4_BattleSuggestions() {
  console.log("═══ EXAMPLE 4: Battle Suggestions ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Start combat
  const initResult = combatManager.initiateCombat(
    "western-europe",
    "northern-europe"
  );
  if (!initResult.success) return;

  console.log("✅ Combat started");

  // Get battle suggestions
  console.log("\n📋 Battle Suggestions:");
  const options = combatManager.getBattleOptions();

  if (options.error) {
    console.error("❌ Cannot get options:", options.error);
    return;
  }

  console.log("\n📊 Current State:");
  console.log("   Attacker armies:", options.currentState.attackerArmies);
  console.log("   Defender armies:", options.currentState.defenderArmies);

  console.log("\n📐 Valid Ranges:");
  console.log(
    "   Attacker can have:",
    options.constraints.attackerRemaining.min,
    "-",
    options.constraints.attackerRemaining.max,
    "armies"
  );
  console.log(
    "   Defender can have:",
    options.constraints.defenderRemaining.min,
    "-",
    options.constraints.defenderRemaining.max,
    "armies"
  );

  console.log("\n💡 Suggestions:");
  options.suggestions.forEach((suggestion, index) => {
    console.log(`\n   ${index + 1}. ${suggestion.description}`);
    console.log(
      "      Attacker: -",
      suggestion.attackerLosses,
      "armies →",
      suggestion.attackerRemaining,
      "remaining"
    );
    console.log(
      "      Defender: -",
      suggestion.defenderLosses,
      "armies →",
      suggestion.defenderRemaining,
      "remaining"
    );
    console.log("      Outcome:", suggestion.probability);
  });

  // User chooses suggestion #2 (balanced outcome)
  console.log("\n👤 User selects suggestion #2 (Balanced battle)");
  const chosenSuggestion = options.suggestions[1];

  const battleResult = combatManager.processBattle({
    attackerRemaining: chosenSuggestion.attackerRemaining,
    defenderRemaining: chosenSuggestion.defenderRemaining,
  });

  if (battleResult.success) {
    console.log("✅ Battle processed successfully");
  }

  combatManager.endCombat();
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 5: Attack Planning
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Query attackable territories to plan strategy
 */
function example5_AttackPlanning() {
  console.log("═══ EXAMPLE 5: Attack Planning ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Get territories player can attack from
  const myTerritories = ["alaska", "northwest-territory", "alberta"];

  console.log("📊 Attack Planning for Player territories:\n");

  myTerritories.forEach((territoryId) => {
    const territory = window.gameState.territories[territoryId];
    if (!territory) return;

    console.log(`\n🏴 ${territory.name} (${territory.armies} armies):`);

    const targets = combatManager.getAttackableTargets(territoryId);

    if (targets.length === 0) {
      console.log("   ❌ No valid targets");
    } else {
      console.log(`   ✅ Can attack ${targets.length} territories:`);
      targets.forEach((target) => {
        console.log(
          `      → ${target.name} (${target.armies} armies, owned by ${target.owner})`
        );
      });
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 6: Combat Statistics
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Track and display combat statistics
 */
function example6_CombatStatistics() {
  console.log("═══ EXAMPLE 6: Combat Statistics ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Simulate several battles
  console.log("📊 Simulating battles...\n");

  for (let i = 0; i < 3; i++) {
    // Start battle
    const initResult = combatManager.initiateCombat("alaska", "kamchatka");
    if (!initResult.success) continue;

    // Process battle
    const battleResult = combatManager.processBattle({
      attackerRemaining: 3,
      defenderRemaining: i === 2 ? 0 : 2, // Last battle is conquest
    });

    if (battleResult.isConquest) {
      combatManager.completeConquest(2);
    } else {
      combatManager.endCombat();
    }
  }

  // Display statistics
  console.log("📈 Combat Statistics:");
  const stats = combatManager.getStatistics();

  console.log("\n🎮 Overall Stats:");
  console.log("   Total battles:", stats.totalBattles);
  console.log("   Total conquests:", stats.totalConquests);
  console.log("   Conquest rate:", stats.conquestRate + "%");
  console.log("   Average duration:", stats.averageDuration + "ms");

  console.log("\n💀 Army Losses:");
  console.log("   Attackers lost:", stats.totalArmiesLost.attacker, "armies");
  console.log("   Defenders lost:", stats.totalArmiesLost.defender, "armies");
  console.log(
    "   Total casualties:",
    stats.totalArmiesLost.attacker + stats.totalArmiesLost.defender
  );

  console.log("\n📜 Battle History:");
  const history = combatManager.getBattleHistory(3);
  history.forEach((battle, index) => {
    console.log(`\n   Battle ${index + 1}:`);
    console.log("      ID:", battle.id);
    console.log(
      "      Route:",
      battle.attackingTerritory,
      "→",
      battle.defendingTerritory
    );
    console.log("      Rounds:", battle.rounds.length);
    console.log("      Status:", battle.status);
    console.log("      Duration:", battle.duration + "ms");

    if (battle.status === "completed") {
      console.log(
        "      🏆 Conquest! Transferred:",
        battle.conquestArmiesTransferred,
        "armies"
      );
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 7: Error Handling
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Proper error handling patterns
 */
function example7_ErrorHandling() {
  console.log("═══ EXAMPLE 7: Error Handling ═══");

  const combatManager = new CombatManager(window.gameState, window.combatUI);

  // Error 1: Invalid territory
  console.log("\n❌ Test 1: Invalid territory");
  const result1 = combatManager.initiateCombat("invalid-territory", "alberta");
  console.log("   Success:", result1.success);
  console.log("   Error:", result1.error);
  console.log("   Code:", result1.validation?.code);

  // Error 2: Insufficient armies
  console.log("\n❌ Test 2: Insufficient armies");
  // Assume 'greenland' has only 1 army
  const result2 = combatManager.validateAttack("greenland", "iceland");
  console.log("   Valid:", result2.valid);
  console.log("   Reason:", result2.reason);
  console.log("   Code:", result2.code);

  // Error 3: Not adjacent
  console.log("\n❌ Test 3: Not adjacent territories");
  const result3 = combatManager.validateAttack("alaska", "argentina");
  console.log("   Valid:", result3.valid);
  console.log("   Reason:", result3.reason);
  console.log("   Code:", result3.code);

  // Error 4: Same owner
  console.log("\n❌ Test 4: Same owner");
  const result4 = combatManager.validateAttack("alaska", "northwest-territory");
  console.log("   Valid:", result4.valid);
  console.log("   Reason:", result4.reason);
  console.log("   Code:", result4.code);

  // Error 5: Invalid battle result
  console.log("\n❌ Test 5: Invalid battle result");
  combatManager.initiateCombat("alaska", "kamchatka");
  const result5 = combatManager.processBattle({
    attackerRemaining: 10, // More than started with!
    defenderRemaining: 2,
  });
  console.log("   Success:", result5.success);
  console.log("   Error:", result5.error);

  // Error 6: No active combat
  console.log("\n❌ Test 6: No active combat");
  combatManager.endCombat(); // End any active combat
  const result6 = combatManager.processBattle({
    attackerRemaining: 3,
    defenderRemaining: 2,
  });
  console.log("   Success:", result6.success);
  console.log("   Error:", result6.error);
}

// ═══════════════════════════════════════════════════════════════════════════
// EXAMPLE 8: Integration with UI
// ═══════════════════════════════════════════════════════════════════════════

/**
 * How CombatManager integrates with your UI
 */
function example8_UIIntegration() {
  console.log("═══ EXAMPLE 8: UI Integration ═══");

  // CombatManager automatically handles UI updates
  const combatManager = new CombatManager(window.gameState, window.combatUI);

  console.log("\n1️⃣ When combat starts:");
  console.log(
    "   → combatManager.initiateCombat() calls combatUI.startAttack()"
  );
  console.log("   → Attack modal opens automatically");

  console.log("\n2️⃣ When battle is processed:");
  console.log(
    "   → combatManager.processBattle() calls combatUI.showBattleResults()"
  );
  console.log("   → Results displayed in modal");

  console.log("\n3️⃣ When combat ends:");
  console.log("   → combatManager.endCombat() calls combatUI.endAttack()");
  console.log("   → Modal closes automatically");

  console.log("\n✅ No manual UI updates needed!");
  console.log("   CombatManager handles everything automatically");
}

// ═══════════════════════════════════════════════════════════════════════════
// RUN ALL EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Run all examples (for demonstration)
 */
function runAllExamples() {
  console.log("\n".repeat(3));
  console.log("═════════════════════════════════════════════════════════════");
  console.log("        COMBAT MANAGER - USAGE EXAMPLES");
  console.log("═════════════════════════════════════════════════════════════");

  // Run each example with a delay
  const examples = [
    example1_BasicCombat,
    example2_ConquestScenario,
    example3_MultiRoundBattle,
    example4_BattleSuggestions,
    example5_AttackPlanning,
    example6_CombatStatistics,
    example7_ErrorHandling,
    example8_UIIntegration,
  ];

  console.log("\n💡 Tip: Run individual examples by calling them directly:");
  examples.forEach((fn, index) => {
    console.log(`   ${fn.name}()`);
  });

  console.log("\n   Or run all: runAllExamples()");
  console.log(
    "\n═════════════════════════════════════════════════════════════\n"
  );

  // Uncomment to run all examples sequentially
  // examples.forEach((example, index) => {
  //   setTimeout(() => {
  //     console.log('\n'.repeat(2));
  //     example();
  //   }, index * 2000);
  // });
}

// Make examples available globally
if (typeof window !== "undefined") {
  window.CombatManagerExamples = {
    example1_BasicCombat,
    example2_ConquestScenario,
    example3_MultiRoundBattle,
    example4_BattleSuggestions,
    example5_AttackPlanning,
    example6_CombatStatistics,
    example7_ErrorHandling,
    example8_UIIntegration,
    runAllExamples,
  };

  console.log("✅ CombatManager examples loaded!");
  console.log("   Call runAllExamples() to see all examples");
}
