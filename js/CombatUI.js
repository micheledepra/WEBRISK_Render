/**
 * RISK COMBAT UI
 *
 * Handles the user interface aspects of the combat system
 * Connects the core combat logic with the visual elements
 */

/**
 * Combat UI System
 * Manages visual interactions with the combat system
 */
class CombatUI {
  /**
   * Create a new combat UI manager
   * @param {CombatSystem} combatSystem - The combat system instance
   * @param {Object} gameUtils - Game utilities for safe DOM access
   */
  constructor(combatSystem, gameUtils) {
    this.combatSystem = combatSystem;
    this.gameUtils = gameUtils || window.GameUtils;
    this.currentAttackingTerritory = null;
    this.currentDefendingTerritory = null;

    // Store conquest info separately so it survives combat instance clearing
    this.pendingConquest = null;

    // CRITICAL: Complete data flow tracking for battle management
    // This object tracks the ENTIRE battle lifecycle with REAL values only
    this.battleDataFlow = {
      // Source of truth for current battle
      attackingTerritoryId: null,
      defendingTerritoryId: null,

      // Initial state (from game state - REAL values)
      initialAttackerArmies: 0,
      initialDefenderArmies: 0,

      // Battle result (from user input)
      finalAttackerArmies: 0,
      finalDefenderArmies: 0,

      // Calculated losses
      attackerLosses: 0,
      defenderLosses: 0,

      // Conquest tracking
      isConquest: false,

      // Transfer tracking (only for conquests)
      transferAmount: 0,
      finalSourceArmies: 0,
      finalDestinationArmies: 0,
    };

    // Execution control flags
    this._executingAttack = false;

    console.log("🚀 Initializing CombatUI with super-robust element handling");

    // Ultra-robust element getter with advanced creation fallback
    const safeGetElement = (id, warnOnMissing = true) => {
      // First try direct access - fastest method
      let element = document.getElementById(id);

      // If element exists, return it immediately
      if (element) return element;

      // Element not found directly, try to make the modal visible first
      const attackModal = document.getElementById("attack-modal");
      if (attackModal) {
        // Save original display state
        const originalDisplay = attackModal.style.display;

        // Temporarily make visible
        if (originalDisplay === "none" || originalDisplay === "") {
          console.log(`🔍 Temporarily showing attack modal to find ${id}`);
          attackModal.style.display = "block";

          // Try again after making visible
          element = document.getElementById(id);

          // Restore original state
          attackModal.style.display = originalDisplay || "none";

          // If found, return it
          if (element) {
            console.log(`✅ Found ${id} after making modal visible`);
            return element;
          }
        }
      }

      // Try gameUtils if available
      if (
        this.gameUtils &&
        typeof this.gameUtils.safeGetElement === "function"
      ) {
        element = this.gameUtils.safeGetElement(id, false); // Don't warn here
        if (element) return element;
      }

      // Still not found, perform advanced creation
      if (warnOnMissing) {
        console.warn(
          `⚠️ CombatUI: Element not found: ${id}, creating robust fallback`
        );
      }

      // Critical combat elements that must exist
      const criticalElements = {
        "attack-modal-attacking-name": {
          parent: ".attack-territory",
          className: "territory-name",
          text: "-",
        },
        "attack-modal-attacking-armies": {
          parent: ".attack-territory",
          className: "territory-armies",
          text: "0 armies",
        },
        "attack-modal-defending-name": {
          parent: ".defend-territory",
          className: "territory-name",
          text: "Select target",
        },
        "attack-modal-defending-armies": {
          parent: ".defend-territory",
          className: "territory-armies",
          text: "0 armies",
        },
      };

      // If this is a critical element, create it properly
      if (id in criticalElements) {
        const config = criticalElements[id];

        // Find or create parent container first
        let parent = null;

        if (
          config.parent === ".attack-territory" ||
          config.parent === ".defend-territory"
        ) {
          // Find attack modal and selection container
          const modal = document.getElementById("attack-modal");
          if (!modal) {
            console.error("❌ Cannot create element: attack-modal not found");
            return createPlaceholder(id);
          }

          let selection = modal.querySelector("#attack-modal-selection");
          if (!selection) {
            // Create selection container
            const modalContent = modal.querySelector(".modal-content");
            if (!modalContent) {
              console.error(
                "❌ Cannot create element: modal-content not found"
              );
              return createPlaceholder(id);
            }

            selection = document.createElement("div");
            selection.id = "attack-modal-selection";
            selection.className = "attack-selection";
            modalContent.appendChild(selection);
          }

          // Create territory containers if needed
          if (config.parent === ".attack-territory") {
            parent = modal.querySelector(".attack-territory");
            if (!parent) {
              parent = document.createElement("div");
              parent.className = "attack-territory";

              // Add label
              const label = document.createElement("div");
              label.className = "territory-label";
              label.textContent = "🗡️ Attacking From";
              parent.appendChild(label);

              selection.appendChild(parent);

              // Add separator if needed
              if (!selection.querySelector(".attack-vs")) {
                const separator = document.createElement("div");
                separator.className = "attack-vs";
                separator.textContent = "VS";
                selection.appendChild(separator);
              }
            }
          } else {
            parent = modal.querySelector(".defend-territory");
            if (!parent) {
              parent = document.createElement("div");
              parent.className = "defend-territory";

              // Add label
              const label = document.createElement("div");
              label.className = "territory-label";
              label.textContent = "🛡️ Defending";
              parent.appendChild(label);

              selection.appendChild(parent);
            }
          }
        } else {
          // Try to find via selector
          const parentElements = document.querySelectorAll(config.parent);
          if (parentElements.length > 0) {
            parent = parentElements[0];
          }
        }

        // Create the element if we have a parent
        if (parent) {
          console.log(
            `🔧 Creating robust element ${id} with proper DOM structure`
          );
          element = document.createElement("div");
          element.id = id;
          element.className = config.className;
          element.textContent = config.text;
          parent.appendChild(element);
          return element;
        }
      }

      // Create simple placeholder element as last resort
      return createPlaceholder(id);
    };

    // Create a simple placeholder element
    const createPlaceholder = (id) => {
      console.log(`🔧 Creating simple placeholder for ${id}`);
      const element = document.createElement("div");
      element.id = id;
      element.style.display = "none";
      element.dataset.placeholder = "true";
      document.body.appendChild(element);
      return element;
    };

    // Make sure modals exist in the DOM
    this.ensureModalsExist();

    // Verify that critical elements are available before proceeding
    const attackModal = document.getElementById("attack-modal");
    if (!attackModal) {
      console.error('❌ CombatUI: Critical element "attack-modal" is missing!');
    }

    // UI elements with ultra-safe fallback mechanism
    this.elements = {
      // Attack modal elements
      attackModal: safeGetElement("attack-modal", false),
      attackerName: safeGetElement("attack-modal-attacking-name", false),
      attackerArmies: safeGetElement("attack-modal-attacking-armies", false),
      defenderName: safeGetElement("attack-modal-defending-name", false),
      defenderArmies: safeGetElement("attack-modal-defending-armies", false),
      armyInputSection:
        gameUtils.safeGetElement("attack-modal-army-input") ||
        document.getElementById("attack-modal-army-input"),
      attackerArmyInput:
        gameUtils.safeGetElement("attack-modal-attacker-armies-input") ||
        document.getElementById("attack-modal-attacker-armies-input"),
      defenderArmyInput:
        gameUtils.safeGetElement("attack-modal-defender-armies-input") ||
        document.getElementById("attack-modal-defender-armies-input"),
      executeButton:
        gameUtils.safeGetElement("attack-modal-execute") ||
        document.getElementById("attack-modal-execute"),
      resultsSection:
        gameUtils.safeGetElement("attack-modal-results") ||
        document.getElementById("attack-modal-results"),
      attackerLossesDisplay:
        gameUtils.safeGetElement("attack-modal-attacker-losses") ||
        document.getElementById("attack-modal-attacker-losses"),
      defenderLossesDisplay:
        gameUtils.safeGetElement("attack-modal-defender-losses") ||
        document.getElementById("attack-modal-defender-losses"),
      battleResult:
        gameUtils.safeGetElement("attack-modal-battle-result") ||
        document.getElementById("attack-modal-battle-result"),
      continueButton:
        gameUtils.safeGetElement("attack-modal-continue") ||
        document.getElementById("attack-modal-continue"),
      endButton:
        gameUtils.safeGetElement("attack-modal-end") ||
        document.getElementById("attack-modal-end"),
      resetButton:
        gameUtils.safeGetElement("attack-modal-reset") ||
        document.getElementById("attack-modal-reset"),
    };

    // Conquest elements with fallback mechanism
    this.conquestElements = {
      modal:
        gameUtils.safeGetElement("unit-transfer-modal") ||
        document.getElementById("unit-transfer-modal"),
      sourceName:
        gameUtils.safeGetElement("transfer-source-name") ||
        document.getElementById("transfer-source-name"),
      sourceArmies:
        gameUtils.safeGetElement("transfer-source-armies") ||
        document.getElementById("transfer-source-armies"),
      destName:
        gameUtils.safeGetElement("transfer-destination-name") ||
        document.getElementById("transfer-destination-name"),
      destArmies:
        gameUtils.safeGetElement("transfer-destination-armies") ||
        document.getElementById("transfer-destination-armies"),
      slider:
        gameUtils.safeGetElement("transfer-slider") ||
        document.getElementById("transfer-slider"),
      input:
        gameUtils.safeGetElement("transfer-input") ||
        document.getElementById("transfer-input"),
      sliderMaxLabel:
        gameUtils.safeGetElement("slider-max-label") ||
        document.getElementById("slider-max-label"),
      transferRange:
        gameUtils.safeGetElement("transfer-range") ||
        document.getElementById("transfer-range"),
      previewSource:
        gameUtils.safeGetElement("preview-source-name") ||
        document.getElementById("preview-source-name"),
      previewSourceArmies:
        gameUtils.safeGetElement("preview-source-armies") ||
        document.getElementById("preview-source-armies"),
      previewDest:
        gameUtils.safeGetElement("preview-destination-name") ||
        document.getElementById("preview-destination-name"),
      previewDestArmies:
        gameUtils.safeGetElement("preview-destination-armies") ||
        document.getElementById("preview-destination-armies"),
      confirmButton:
        gameUtils.safeGetElement("confirm-transfer-btn") ||
        document.getElementById("confirm-transfer-btn"),
      cancelButton:
        gameUtils.safeGetElement("use-minimum-btn") ||
        document.getElementById("use-minimum-btn"),
    };

    // Initialize event listeners
    this.initializeEventListeners();
  }

  /**
   * Make sure all required modal elements exist in the DOM
   * This function ensures the HTML structure is correct
   */
  ensureModalsExist() {
    // Check if attack modal exists
    let attackModal = document.getElementById("attack-modal");
    if (!attackModal) {
      console.log("Attack modal not found, ensuring it exists");
      this.createAttackModal();
    } else {
      // Save original display style
      const originalDisplay = attackModal.style.display;

      // Temporarily make modal visible to ensure all elements are accessible
      if (originalDisplay === "none" || originalDisplay === "") {
        console.log(
          "🔍 CombatUI: Temporarily making attack-modal visible for initialization"
        );
        attackModal.style.display = "flex";
      }

      // Check for specific elements in attack modal and create if missing
      this.ensureAttackModalElements();

      // Restore original display style
      if (originalDisplay === "none" || originalDisplay === "") {
        console.log("🔍 CombatUI: Restoring attack-modal to hidden state");
        attackModal.style.display = originalDisplay || "none";
      }
    }

    // Check if unit transfer modal exists
    let transferModal = document.getElementById("unit-transfer-modal");
    if (!transferModal) {
      console.log("Transfer modal not found, ensuring it exists");
      this.createTransferModal();
    } else {
      // Save original display style
      const originalDisplay = transferModal.style.display;

      // Temporarily make modal visible to ensure all elements are accessible
      if (originalDisplay === "none" || originalDisplay === "") {
        console.log(
          "🔍 CombatUI: Temporarily making transfer-modal visible for initialization"
        );
        transferModal.style.display = "flex";
      }

      // Check for specific elements in transfer modal and create if missing
      this.ensureTransferModalElements();

      // Restore original display style
      if (originalDisplay === "none" || originalDisplay === "") {
        console.log("🔍 CombatUI: Restoring transfer-modal to hidden state");
        transferModal.style.display = originalDisplay || "none";
      }
    }
  }

  /**
   * Ensure all attack modal elements exist
   */
  ensureAttackModalElements() {
    const attackModal = document.getElementById("attack-modal");
    if (!attackModal) return; // Can't add elements if modal doesn't exist

    const modalContent = attackModal.querySelector(".modal-content");
    if (!modalContent) return;

    // Check and create attacker name
    if (!document.getElementById("attack-modal-attacking-name")) {
      const attackSelection = modalContent.querySelector(".attack-selection");
      if (attackSelection) {
        const attackerDiv = attackSelection.querySelector(".attacker");
        if (
          attackerDiv &&
          !attackerDiv.querySelector("#attack-modal-attacking-name")
        ) {
          const nameDiv = document.createElement("div");
          nameDiv.id = "attack-modal-attacking-name";
          nameDiv.className = "territory-name";
          nameDiv.textContent = "-";
          attackerDiv.appendChild(nameDiv);
        }
      }
    }

    // Check and create attacker armies
    if (!document.getElementById("attack-modal-attacking-armies")) {
      const attackSelection = modalContent.querySelector(".attack-selection");
      if (attackSelection) {
        const attackerDiv = attackSelection.querySelector(".attacker");
        if (
          attackerDiv &&
          !attackerDiv.querySelector("#attack-modal-attacking-armies")
        ) {
          const armiesDiv = document.createElement("div");
          armiesDiv.id = "attack-modal-attacking-armies";
          armiesDiv.className = "territory-armies";
          armiesDiv.textContent = "0 armies";
          attackerDiv.appendChild(armiesDiv);
        }
      }
    }

    // Check and create defender name
    if (!document.getElementById("attack-modal-defending-name")) {
      const attackSelection = modalContent.querySelector(".attack-selection");
      if (attackSelection) {
        const defenderDiv = attackSelection.querySelector(".defender");
        if (
          defenderDiv &&
          !defenderDiv.querySelector("#attack-modal-defending-name")
        ) {
          const nameDiv = document.createElement("div");
          nameDiv.id = "attack-modal-defending-name";
          nameDiv.className = "territory-name";
          nameDiv.textContent = "Select target";
          defenderDiv.appendChild(nameDiv);
        }
      }
    }

    // Check and create defender armies
    if (!document.getElementById("attack-modal-defending-armies")) {
      const attackSelection = modalContent.querySelector(".attack-selection");
      if (attackSelection) {
        const defenderDiv = attackSelection.querySelector(".defender");
        if (
          defenderDiv &&
          !defenderDiv.querySelector("#attack-modal-defending-armies")
        ) {
          const armiesDiv = document.createElement("div");
          armiesDiv.id = "attack-modal-defending-armies";
          armiesDiv.className = "territory-armies";
          armiesDiv.textContent = "0 armies";
          defenderDiv.appendChild(armiesDiv);
        }
      }
    }

    // Check and create end button
    if (!document.getElementById("attack-modal-end")) {
      const resultsSection = modalContent.querySelector(".combat-results");
      if (resultsSection) {
        const endBtn = document.createElement("button");
        endBtn.id = "attack-modal-end";
        endBtn.className = "attack-btn";
        endBtn.style.background = "#6c757d";
        endBtn.textContent = "End Attack";
        endBtn.addEventListener("click", () => this.endAttack());
        resultsSection.appendChild(endBtn);
      }
    }

    // Check and create reset button
    if (!document.getElementById("attack-modal-reset")) {
      const modalContent = attackModal.querySelector(".modal-content");
      if (modalContent) {
        const resetBtn = document.createElement("button");
        resetBtn.id = "attack-modal-reset";
        resetBtn.className = "attack-btn";
        resetBtn.style.display = "none";
        resetBtn.style.background = "#ffc107";
        resetBtn.style.color = "#000";
        resetBtn.style.marginTop = "10px";
        resetBtn.textContent = "New Attack";
        resetBtn.addEventListener("click", () => this.resetAttack());
        modalContent.appendChild(resetBtn);
      }
    }
  }

  /**
   * Ensure all transfer modal elements exist
   */
  ensureTransferModalElements() {
    const transferModal = document.getElementById("unit-transfer-modal");
    if (!transferModal) return; // Can't add elements if modal doesn't exist

    const modalContent = transferModal.querySelector(".modal-content");
    if (!modalContent) return;

    // Check and create source name
    if (!document.getElementById("transfer-source-name")) {
      const sourceDiv = modalContent.querySelector(
        ".transfer-territory.source"
      );
      if (sourceDiv) {
        const nameDiv = document.createElement("div");
        nameDiv.id = "transfer-source-name";
        nameDiv.className = "territory-name";
        nameDiv.textContent = "Attacking Territory";
        sourceDiv.appendChild(nameDiv);
      }
    }

    // Check and create source armies
    if (!document.getElementById("transfer-source-armies")) {
      const sourceDiv = modalContent.querySelector(
        ".transfer-territory.source"
      );
      if (sourceDiv) {
        const armiesDiv = document.createElement("div");
        armiesDiv.id = "transfer-source-armies";
        armiesDiv.className = "territory-armies";
        armiesDiv.textContent = "0 armies";
        sourceDiv.appendChild(armiesDiv);
      }
    }

    // Check and create destination name
    if (!document.getElementById("transfer-destination-name")) {
      const destDiv = modalContent.querySelector(
        ".transfer-territory.destination"
      );
      if (destDiv) {
        const nameDiv = document.createElement("div");
        nameDiv.id = "transfer-destination-name";
        nameDiv.className = "territory-name";
        nameDiv.textContent = "Conquered Territory";
        destDiv.appendChild(nameDiv);
      }
    }

    // Check and create destination armies
    if (!document.getElementById("transfer-destination-armies")) {
      const destDiv = modalContent.querySelector(
        ".transfer-territory.destination"
      );
      if (destDiv) {
        const armiesDiv = document.createElement("div");
        armiesDiv.id = "transfer-destination-armies";
        armiesDiv.className = "territory-armies";
        armiesDiv.textContent = "1 army (minimum)";
        destDiv.appendChild(armiesDiv);
      }
    }

    // Check and create preview source name
    if (!document.getElementById("preview-source-name")) {
      const previewDiv = modalContent.querySelector(".transfer-result");
      if (previewDiv) {
        const resultItem = document.createElement("div");
        resultItem.className = "result-item";

        const nameSpan = document.createElement("span");
        nameSpan.id = "preview-source-name";
        nameSpan.textContent = "Attacking Territory";

        const colonSpan = document.createTextNode(": ");

        const armiesSpan = document.createElement("span");
        armiesSpan.id = "preview-source-armies";
        armiesSpan.textContent = "0 armies remaining";

        resultItem.appendChild(nameSpan);
        resultItem.appendChild(colonSpan);
        resultItem.appendChild(armiesSpan);
        previewDiv.appendChild(resultItem);
      }
    }

    // Check and create preview destination name
    if (!document.getElementById("preview-destination-name")) {
      const previewDiv = modalContent.querySelector(".transfer-result");
      if (previewDiv) {
        const resultItem = document.createElement("div");
        resultItem.className = "result-item";

        const nameSpan = document.createElement("span");
        nameSpan.id = "preview-destination-name";
        nameSpan.textContent = "Conquered Territory";

        const colonSpan = document.createTextNode(": ");

        const armiesSpan = document.createElement("span");
        armiesSpan.id = "preview-destination-armies";
        armiesSpan.textContent = "1 army total";

        resultItem.appendChild(nameSpan);
        resultItem.appendChild(colonSpan);
        resultItem.appendChild(armiesSpan);
        previewDiv.appendChild(resultItem);
      }
    }
  }

  /**
   * Create the attack modal if it doesn't exist
   */
  createAttackModal() {
    // Attack modal already exists in the HTML, this is just a fallback
    // No need to implement as the HTML structure is already present
  }

  /**
   * Create the transfer modal if it doesn't exist
   */
  createTransferModal() {
    // Transfer modal already exists in the HTML, this is just a fallback
    // No need to implement as the HTML structure is already present
  }

  /**
   * Initialize event listeners for combat UI
   */
  initializeEventListeners() {
    // Make sure these elements exist before attaching listeners
    if (this.elements.executeButton) {
      this.elements.executeButton.addEventListener("click", () =>
        this.executeAttack()
      );
    }

    if (this.elements.continueButton) {
      this.elements.continueButton.addEventListener("click", () =>
        this.continueAttack()
      );
    }

    if (this.elements.endButton) {
      this.elements.endButton.addEventListener("click", () => this.endAttack());
    }

    if (this.elements.resetButton) {
      this.elements.resetButton.addEventListener("click", () =>
        this.resetAttack()
      );
    }

    // Conquest modal events
    if (this.conquestElements.slider) {
      this.conquestElements.slider.addEventListener("input", () =>
        this.updateTransferPreview()
      );
    }

    if (this.conquestElements.input) {
      this.conquestElements.input.addEventListener("input", () =>
        this.updateTransferFromInput()
      );
    }

    // Conquest modal buttons
    if (this.conquestElements.confirmButton) {
      this.conquestElements.confirmButton.addEventListener("click", () =>
        this.confirmTransfer()
      );
      console.log("✅ Conquest confirm button event listener attached");
    }

    if (this.conquestElements.cancelButton) {
      this.conquestElements.cancelButton.addEventListener("click", () =>
        this.cancelTransfer()
      );
      console.log("✅ Conquest cancel button event listener attached");
    }
  }

  /**
   * Start a new attack between two territories
   * @param {string} attackingTerritoryId - Attacking territory ID
   * @param {string} defendingTerritoryId - Defending territory ID
   * @returns {boolean} - Whether the attack was started
   */

  /**
   * Initialize battle with REAL data from game state
   * This is the ONLY entry point for battle initialization
   * NO MOCK VALUES - all data comes from game state
   */
  startAttack(attackingTerritoryId, defendingTerritoryId) {
    console.log("🎯 Starting attack - initializing with REAL data");

    // Step 1: Start combat in combat system first
    const result = this.combatSystem.startCombat(
      attackingTerritoryId,
      defendingTerritoryId
    );

    if (!result.success) {
      console.error("❌ Failed to start attack:", result.error);
      return false;
    }

    // Step 2: Store territory IDs
    const combat = result.combat;
    this.currentAttackingTerritory =
      combat.attackingTerritory ||
      combat.attackingTerritoryId ||
      attackingTerritoryId;
    this.currentDefendingTerritory =
      combat.defendingTerritory ||
      combat.defendingTerritoryId ||
      defendingTerritoryId;

    if (!this.currentAttackingTerritory || !this.currentDefendingTerritory) {
      console.error("❌ Cannot start attack without both territories");
      return false;
    }

    // Step 3: Get ACTUAL territory data from game state (PRIMARY source)
    const attackingTerr = this._getActualTerritoryData(
      this.currentAttackingTerritory
    );
    const defendingTerr = this._getActualTerritoryData(
      this.currentDefendingTerritory
    );

    if (!attackingTerr || !defendingTerr) {
      console.error("❌ Could not retrieve territory data from game state");
      return false;
    }

    // Step 4: Initialize battle data flow with REAL values (NO DEFAULTS)
    this.battleDataFlow = {
      attackingTerritoryId: this.currentAttackingTerritory,
      defendingTerritoryId: this.currentDefendingTerritory,

      // REAL initial values from game state
      initialAttackerArmies: attackingTerr.armies,
      initialDefenderArmies: defendingTerr.armies,

      // User will input these
      finalAttackerArmies: 0,
      finalDefenderArmies: 0,

      // Will be calculated
      attackerLosses: 0,
      defenderLosses: 0,
      isConquest: false,

      // For conquest transfers
      transferAmount: 0,
      finalSourceArmies: 0,
      finalDestinationArmies: 0,
    };

    console.log("📊 Battle initialized with REAL data:", {
      attacker: this.currentAttackingTerritory,
      attackerArmies: this.battleDataFlow.initialAttackerArmies,
      defender: this.currentDefendingTerritory,
      defenderArmies: this.battleDataFlow.initialDefenderArmies,
    });

    // Step 5: Update modal with REAL values (NO DEFAULTS)
    this._updateModalWithRealData(attackingTerr, defendingTerr);

    // Step 7: Show modal
    if (this.elements.attackModal) {
      this.elements.attackModal.style.display = "flex";
    }

    return true;
  }

  /**
   * Get actual territory data from game state
   * NO MOCKING - returns null if data not available
   * @private
   * @param {string} territoryId - Territory ID
   * @returns {Object|null} Territory object or null
   */
  _getActualTerritoryData(territoryId) {
    console.log(`🔍 Getting REAL data for territory: ${territoryId}`);

    // Priority 1: GameStateManager
    if (
      window.GameStateManager &&
      typeof window.GameStateManager.getTerritory === "function"
    ) {
      const territory = window.GameStateManager.getTerritory(territoryId);
      if (territory && typeof territory.armies === "number") {
        console.log(
          `✅ Got data from GameStateManager: ${territory.armies} armies`
        );
        return territory;
      }
    }

    // Priority 2: window.gameState
    if (
      window.gameState &&
      window.gameState.territories &&
      window.gameState.territories[territoryId]
    ) {
      const territory = window.gameState.territories[territoryId];
      if (typeof territory.armies === "number") {
        console.log(
          `✅ Got data from window.gameState: ${territory.armies} armies`
        );
        return territory;
      }
    }

    // Priority 3: combatSystem.gameState
    if (
      this.combatSystem &&
      this.combatSystem.gameState &&
      this.combatSystem.gameState.territories &&
      this.combatSystem.gameState.territories[territoryId]
    ) {
      const territory = this.combatSystem.gameState.territories[territoryId];
      if (typeof territory.armies === "number") {
        console.log(
          `✅ Got data from combatSystem.gameState: ${territory.armies} armies`
        );
        return territory;
      }
    }

    console.error(`❌ Could not find REAL data for territory: ${territoryId}`);
    return null;
  }

  /**
   * Update modal UI with REAL data from territories
   * NO DEFAULT VALUES - only real data
   * @private
   * @param {Object} attackingTerr - Attacking territory object
   * @param {Object} defendingTerr - Defending territory object
   */
  _updateModalWithRealData(attackingTerr, defendingTerr) {
    console.log("🖥️ Updating modal with REAL data (no defaults)");

    // Update attacking territory display
    if (this.elements.attackerName) {
      this.elements.attackerName.textContent =
        attackingTerr.name ||
        this.currentAttackingTerritory.replace(/-/g, " ").toUpperCase();
    }

    if (this.elements.attackerArmies) {
      const actualArmies = attackingTerr.armies;
      this.elements.attackerArmies.textContent = `${actualArmies} armies`;
      console.log(`✅ Set attacker display: ${actualArmies} armies`);
    }

    // Update defending territory display
    if (this.elements.defenderName) {
      this.elements.defenderName.textContent =
        defendingTerr.name ||
        this.currentDefendingTerritory.replace(/-/g, " ").toUpperCase();
    }

    if (this.elements.defenderArmies) {
      const actualArmies = defendingTerr.armies;
      this.elements.defenderArmies.textContent = `${actualArmies} armies`;
      console.log(`✅ Set defender display: ${actualArmies} armies`);
    }

    // Set up input fields with REAL ranges (NO MOCK VALUES)
    if (this.elements.attackerArmyInput) {
      this.elements.attackerArmyInput.min = 1;
      this.elements.attackerArmyInput.max = attackingTerr.armies;
      this.elements.attackerArmyInput.value = attackingTerr.armies; // Default: no losses

      // Force attribute update for HTML validation
      this.elements.attackerArmyInput.setAttribute("min", "1");
      this.elements.attackerArmyInput.setAttribute(
        "max",
        attackingTerr.armies.toString()
      );

      console.log(
        `📊 Attacker input: min=1, max=${attackingTerr.armies}, value=${attackingTerr.armies}`
      );
      console.log("🔍 Attacker input attributes:", {
        min: this.elements.attackerArmyInput.getAttribute("min"),
        max: this.elements.attackerArmyInput.getAttribute("max"),
        value: this.elements.attackerArmyInput.value,
      });
    }

    if (this.elements.defenderArmyInput) {
      this.elements.defenderArmyInput.min = 0;
      this.elements.defenderArmyInput.max = defendingTerr.armies;
      this.elements.defenderArmyInput.value = Math.max(
        0,
        defendingTerr.armies - 1
      ); // Default: lose 1

      // Force attribute update for HTML validation
      this.elements.defenderArmyInput.setAttribute("min", "0");
      this.elements.defenderArmyInput.setAttribute(
        "max",
        defendingTerr.armies.toString()
      );

      console.log(
        `📊 Defender input: min=0, max=${
          defendingTerr.armies
        }, value=${Math.max(0, defendingTerr.armies - 1)}`
      );
      console.log("🔍 Defender input attributes:", {
        min: this.elements.defenderArmyInput.getAttribute("min"),
        max: this.elements.defenderArmyInput.getAttribute("max"),
        value: this.elements.defenderArmyInput.value,
      });
    }

    // Show the input section
    if (this.elements.armyInputSection) {
      this.elements.armyInputSection.style.display = "block";
    }

    // Show execute button
    if (this.elements.executeButton) {
      this.elements.executeButton.style.display = "block";
    }

    // Hide results section initially
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "none";
    }
  }

  /**
   * Update attack modal with current combat info
   * @param {Object} combat - Current combat state
   */
  updateAttackModalInfo(combat) {
    console.log("🔍 updateAttackModalInfo called with combat:", combat);

    // Get territory data from ALL possible sources for debugging
    const sources = {
      GameStateManager: null,
      windowGameState: null,
      combatSystemState: null,
    };

    // Try GameStateManager
    if (
      typeof GameStateManager !== "undefined" &&
      GameStateManager.getTerritory
    ) {
      sources.GameStateManager = {
        attacker: GameStateManager.getTerritory(combat.attackingTerritory),
        defender: GameStateManager.getTerritory(combat.defendingTerritory),
      };
    }

    // Try window.gameState
    if (window.gameState && window.gameState.territories) {
      sources.windowGameState = {
        attacker: window.gameState.territories[combat.attackingTerritory],
        defender: window.gameState.territories[combat.defendingTerritory],
      };
    }

    // Try combatSystem.gameState
    if (
      this.combatSystem &&
      this.combatSystem.gameState &&
      this.combatSystem.gameState.territories
    ) {
      sources.combatSystemState = {
        attacker:
          this.combatSystem.gameState.territories[combat.attackingTerritory],
        defender:
          this.combatSystem.gameState.territories[combat.defendingTerritory],
      };
    }

    // Log all sources for debugging
    console.log("📊 Territory data from all sources:");
    Object.entries(sources).forEach(([sourceName, data]) => {
      if (data && data.attacker && data.defender) {
        console.log(`  ${sourceName}:`, {
          attacker: {
            id: combat.attackingTerritory,
            name: data.attacker.name,
            armies: data.attacker.armies,
            owner: data.attacker.owner,
          },
          defender: {
            id: combat.defendingTerritory,
            name: data.defender.name,
            armies: data.defender.armies,
            owner: data.defender.owner,
          },
        });
      } else {
        console.log(`  ${sourceName}: NOT AVAILABLE`);
      }
    });

    // Use GameStateManager as primary source (most reliable)
    let attackingTerritory = sources.GameStateManager?.attacker;
    let defendingTerritory = sources.GameStateManager?.defender;

    // Fallback to window.gameState if GameStateManager not available
    if (!attackingTerritory || !defendingTerritory) {
      console.warn(
        "⚠️ GameStateManager data not available, falling back to window.gameState"
      );
      attackingTerritory = sources.windowGameState?.attacker;
      defendingTerritory = sources.windowGameState?.defender;
    }

    // Last resort: combatSystem.gameState
    if (!attackingTerritory || !defendingTerritory) {
      console.warn(
        "⚠️ window.gameState not available, falling back to combatSystem.gameState"
      );
      attackingTerritory = sources.combatSystemState?.attacker;
      defendingTerritory = sources.combatSystemState?.defender;
    }

    if (!attackingTerritory || !defendingTerritory) {
      console.error("❌ Territory not found in any source:", {
        attacking: combat.attackingTerritory,
        defending: combat.defendingTerritory,
        availableSources: Object.keys(sources).filter((k) => sources[k]),
      });
      return;
    }

    console.log("✅ Using territory data:", {
      attacker: {
        name: attackingTerritory.name,
        armies: attackingTerritory.armies,
        owner: attackingTerritory.owner,
      },
      defender: {
        name: defendingTerritory.name,
        armies: defendingTerritory.armies,
        owner: defendingTerritory.owner,
      },
    });

    // Update territory names and armies with safe checks
    if (this.elements.attackerName) {
      this.elements.attackerName.textContent =
        attackingTerritory.name || combat.attackingTerritory;
      console.log(`📝 Set attacker name: "${attackingTerritory.name}"`);
    }

    if (this.elements.attackerArmies) {
      const armyText = `${attackingTerritory.armies} armies`;
      this.elements.attackerArmies.textContent = armyText;
      console.log(`📝 Set attacker armies display: "${armyText}"`);
    }

    if (this.elements.defenderName) {
      this.elements.defenderName.textContent =
        defendingTerritory.name || combat.defendingTerritory;
      console.log(`📝 Set defender name: "${defendingTerritory.name}"`);
    }

    if (this.elements.defenderArmies) {
      const armyText = `${defendingTerritory.armies} armies`;
      this.elements.defenderArmies.textContent = armyText;
      console.log(`📝 Set defender armies display: "${armyText}"`);
    }

    // FORCE UPDATE: Override any other systems that might set mock values
    // Use setTimeout to ensure this runs after any competing updates
    setTimeout(() => {
      // Re-fetch fresh data to ensure accuracy
      const freshAttacker =
        GameStateManager.getTerritory(combat.attackingTerritory) ||
        window.gameState?.territories[combat.attackingTerritory] ||
        attackingTerritory;
      const freshDefender =
        GameStateManager.getTerritory(combat.defendingTerritory) ||
        window.gameState?.territories[combat.defendingTerritory] ||
        defendingTerritory;

      if (this.elements.attackerArmies && freshAttacker) {
        const armyText = `${freshAttacker.armies} armies`;
        this.elements.attackerArmies.textContent = armyText;
        console.log(`🔄 Force-updated attacker armies: "${armyText}"`);
      }
      if (this.elements.defenderArmies && freshDefender) {
        const armyText = `${freshDefender.armies} armies`;
        this.elements.defenderArmies.textContent = armyText;
        console.log(`🔄 Force-updated defender armies: "${armyText}"`);
      }
    }, 100); // Small delay to override competing systems

    // Show army input section
    if (this.elements.armyInputSection) {
      this.elements.armyInputSection.style.display = "block";
    }

    // Set default values and max/min for army inputs
    // These represent "remaining armies after battle" - what the user wants left after the fight
    if (this.elements.attackerArmyInput) {
      this.elements.attackerArmyInput.min = 1; // Must leave at least 1 army (attacker cannot lose all)
      this.elements.attackerArmyInput.max = attackingTerritory.armies; // Can have 0 losses (all armies remain)
      // Default: suggest losing 1 army (reasonable battle outcome), but ensure it's valid
      const defaultRemaining = Math.max(1, attackingTerritory.armies - 1);
      this.elements.attackerArmyInput.value = Math.min(
        defaultRemaining,
        attackingTerritory.armies
      );

      console.log(
        `📊 Attacker input range: min=1, max=${attackingTerritory.armies}, value=${this.elements.attackerArmyInput.value}`
      );
    }

    if (this.elements.defenderArmyInput) {
      this.elements.defenderArmyInput.min = 0; // Defender can lose all armies (conquest)
      this.elements.defenderArmyInput.max = defendingTerritory.armies; // Cannot have more than current
      // Default: suggest losing 1 army (reasonable battle outcome)
      this.elements.defenderArmyInput.value = Math.max(
        0,
        defendingTerritory.armies - 1
      );

      console.log(
        `📊 Defender input range: min=0, max=${defendingTerritory.armies}, value=${this.elements.defenderArmyInput.value}`
      );
    }

    // Show execute button
    if (this.elements.executeButton) {
      this.elements.executeButton.style.display = "block";
    }

    // Hide results section
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "none";
    }
  }

  /**
   * Execute attack with user-provided final army counts
   * This captures the battle result and calculates losses
   * Uses battleDataFlow for complete data tracking
   */
  executeAttack() {
    console.log("⚔️ Executing attack - processing user input with REAL data");

    // Step 1: Prevent multiple simultaneous executions
    if (this._executingAttack) {
      console.warn(
        "⚠️ Attack execution already in progress, ignoring duplicate call"
      );
      return;
    }
    this._executingAttack = true;

    // Step 2: Validate we have battle data in battleDataFlow
    if (
      !this.battleDataFlow.attackingTerritoryId ||
      !this.battleDataFlow.defendingTerritoryId
    ) {
      console.error("❌ No battle data available in battleDataFlow");
      alert("Error: Battle not properly initialized");
      this._executingAttack = false;
      return;
    }

    // Step 2: Get user input for final army counts
    const attackerInput = this.elements.attackerArmyInput;
    const defenderInput = this.elements.defenderArmyInput;

    if (!attackerInput || !defenderInput) {
      console.error("❌ Input elements not found");
      alert("Error: Input fields not available");
      this._executingAttack = false;
      return;
    }

    const finalAttackerArmies = parseInt(attackerInput.value);
    const finalDefenderArmies = parseInt(defenderInput.value);

    // DEBUG: Log all input values for troubleshooting
    console.log("🔍 DEBUG - Input values:", {
      attackerInputValue: attackerInput.value,
      attackerInputMax: attackerInput.max,
      attackerInputMin: attackerInput.min,
      defenderInputValue: defenderInput.value,
      defenderInputMax: defenderInput.max,
      defenderInputMin: defenderInput.min,
      finalAttackerArmies: finalAttackerArmies,
      finalDefenderArmies: finalDefenderArmies,
      battleDataFlowInitialAttacker: this.battleDataFlow.initialAttackerArmies,
      battleDataFlowInitialDefender: this.battleDataFlow.initialDefenderArmies,
    });

    // Step 3: Validate inputs are numbers
    if (isNaN(finalAttackerArmies) || isNaN(finalDefenderArmies)) {
      console.error("❌ Invalid army counts");
      alert("Please enter valid army counts");
      this._executingAttack = false;
      return;
    }

    // Step 4: Auto-correct invalid input values
    let correctedAttackerArmies = finalAttackerArmies;
    let correctedDefenderArmies = finalDefenderArmies;

    if (finalAttackerArmies > this.battleDataFlow.initialAttackerArmies) {
      console.warn(
        `⚠️ Attacker input too high (${finalAttackerArmies} > ${this.battleDataFlow.initialAttackerArmies}), correcting to max`
      );
      correctedAttackerArmies = this.battleDataFlow.initialAttackerArmies;
      attackerInput.value = correctedAttackerArmies;
    }

    if (finalDefenderArmies > this.battleDataFlow.initialDefenderArmies) {
      console.warn(
        `⚠️ Defender input too high (${finalDefenderArmies} > ${this.battleDataFlow.initialDefenderArmies}), correcting to max`
      );
      correctedDefenderArmies = this.battleDataFlow.initialDefenderArmies;
      defenderInput.value = correctedDefenderArmies;
    }

    if (correctedAttackerArmies < 1) {
      console.warn("⚠️ Attacker input too low, correcting to minimum (1)");
      correctedAttackerArmies = 1;
      attackerInput.value = correctedAttackerArmies;
    }

    if (correctedDefenderArmies < 0) {
      console.warn("⚠️ Defender input too low, correcting to minimum (0)");
      correctedDefenderArmies = 0;
      defenderInput.value = correctedDefenderArmies;
    }

    // Update battleDataFlow with corrected values
    this.battleDataFlow.finalAttackerArmies = correctedAttackerArmies;
    this.battleDataFlow.finalDefenderArmies = correctedDefenderArmies;

    console.log("✅ Using corrected values:", {
      correctedAttackerArmies,
      correctedDefenderArmies,
    });

    // Step 5: Update battleDataFlow with results and calculate losses
    this.battleDataFlow.finalAttackerArmies = finalAttackerArmies;
    this.battleDataFlow.finalDefenderArmies = finalDefenderArmies;
    this.battleDataFlow.attackerLosses =
      this.battleDataFlow.initialAttackerArmies - finalAttackerArmies;
    this.battleDataFlow.defenderLosses =
      this.battleDataFlow.initialDefenderArmies - finalDefenderArmies;
    this.battleDataFlow.isConquest = finalDefenderArmies === 0;

    console.log("📊 Battle result calculated from REAL data:", {
      initialAttacker: this.battleDataFlow.initialAttackerArmies,
      finalAttacker: this.battleDataFlow.finalAttackerArmies,
      attackerLosses: this.battleDataFlow.attackerLosses,
      initialDefender: this.battleDataFlow.initialDefenderArmies,
      finalDefender: this.battleDataFlow.finalDefenderArmies,
      defenderLosses: this.battleDataFlow.defenderLosses,
      conquest: this.battleDataFlow.isConquest,
    });

    // Step 6: Validate using CombatValidator
    if (typeof CombatValidator !== "undefined") {
      const validator = new CombatValidator();
      const validation = validator.validateBattleResult(
        this.battleDataFlow.initialAttackerArmies,
        this.battleDataFlow.initialDefenderArmies,
        this.battleDataFlow.finalAttackerArmies,
        this.battleDataFlow.finalDefenderArmies
      );

      if (!validation.valid) {
        console.error("❌ Battle validation failed:", validation.errors);
        alert("Invalid battle result:\n" + validation.errors.join("\n"));
        return;
      }

      console.log("✅ Battle result validated");
    }

    // Step 7: Apply results to game state
    this._applyBattleResultsToGameState();

    // Step 8: Show results
    this._showBattleResultsUI();
  }

  /**
   * Apply battle results to game state
   * Updates actual territory army counts using battleDataFlow
   * @private
   */
  _applyBattleResultsToGameState() {
    console.log("💾 Applying battle results to game state from battleDataFlow");

    const attackerId = this.battleDataFlow.attackingTerritoryId;
    const defenderId = this.battleDataFlow.defendingTerritoryId;

    // Update attacker armies
    this._updateTerritoryArmiesInGameState(
      attackerId,
      this.battleDataFlow.finalAttackerArmies
    );

    // Update defender armies
    this._updateTerritoryArmiesInGameState(
      defenderId,
      this.battleDataFlow.finalDefenderArmies
    );

    // If conquest, update ownership
    if (this.battleDataFlow.isConquest) {
      const attackingTerr = this._getActualTerritoryData(attackerId);
      if (attackingTerr) {
        this._updateTerritoryOwnership(defenderId, attackingTerr.owner);
        console.log(
          `🏆 Territory ${defenderId} conquered by ${attackingTerr.owner}`
        );

        // Store conquest info for modal
        this.pendingConquest = {
          attackingTerritoryId: attackerId,
          defendingTerritoryId: defenderId,
          attackerRemainingArmies: this.battleDataFlow.finalAttackerArmies,
          storedAt: Date.now(),
        };
      }
    }

    // Update map display
    this._updateMapDisplay(attackerId);
    this._updateMapDisplay(defenderId);

    console.log("✅ Game state updated from battleDataFlow");
  }

  /**
   * Update territory army count in ALL game state sources
   * Ensures synchronization across all state objects
   * @private
   * @param {string} territoryId - Territory ID
   * @param {number} armyCount - New army count
   */
  _updateTerritoryArmiesInGameState(territoryId, armyCount) {
    console.log(
      `� Updating ${territoryId} to ${armyCount} armies in ALL sources`
    );

    let updateCount = 0;

    // Update in window.gameState
    if (
      window.gameState &&
      window.gameState.territories &&
      window.gameState.territories[territoryId]
    ) {
      window.gameState.territories[territoryId].armies = armyCount;
      updateCount++;
      console.log(`  ✅ Updated window.gameState`);
    }

    // Update via GameStateManager
    if (
      window.GameStateManager &&
      typeof window.GameStateManager.updateTerritoryArmies === "function"
    ) {
      window.GameStateManager.updateTerritoryArmies(territoryId, armyCount);
      updateCount++;
      console.log(`  ✅ Updated via GameStateManager`);
    } else if (
      window.GameStateManager &&
      window.GameStateManager.territories &&
      window.GameStateManager.territories[territoryId]
    ) {
      window.GameStateManager.territories[territoryId].armies = armyCount;
      updateCount++;
      console.log(`  ✅ Updated GameStateManager.territories directly`);
    }

    // Update in combatSystem.gameState
    if (
      this.combatSystem &&
      this.combatSystem.gameState &&
      this.combatSystem.gameState.territories &&
      this.combatSystem.gameState.territories[territoryId]
    ) {
      this.combatSystem.gameState.territories[territoryId].armies = armyCount;
      updateCount++;
      console.log(`  ✅ Updated combatSystem.gameState`);
    }

    if (updateCount === 0) {
      console.error(
        `  ❌ Failed to update any game state source for ${territoryId}`
      );
    } else {
      console.log(
        `  ✅ Successfully updated ${updateCount} game state source(s)`
      );
      
      // Dispatch event for dashboard system
      document.dispatchEvent(new CustomEvent('armyCountChanged', {
        detail: { territoryId, armyCount, source: 'CombatUI' }
      }));
    }
  }

  /**
   * Show battle results to user
   * Uses battleDataFlow for display
   * @private
   */
  _showBattleResultsUI() {
    console.log("📊 Showing battle results from battleDataFlow");

    // Hide input section
    if (this.elements.armyInputSection) {
      this.elements.armyInputSection.style.display = "none";
    }

    // Hide execute button
    if (this.elements.executeButton) {
      this.elements.executeButton.style.display = "none";
    }

    // Show results section
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "block";
    }

    // Update result text with REAL data from battleDataFlow
    if (this.elements.battleResult) {
      let resultText = `
        <strong>Battle Complete!</strong><br>
        Attacker lost ${this.battleDataFlow.attackerLosses} ${
        this.battleDataFlow.attackerLosses === 1 ? "army" : "armies"
      }<br>
        Defender lost ${this.battleDataFlow.defenderLosses} ${
        this.battleDataFlow.defenderLosses === 1 ? "army" : "armies"
      }
      `;

      if (this.battleDataFlow.isConquest) {
        resultText += "<br><br><strong>🏆 TERRITORY CONQUERED!</strong>";
      }

      this.elements.battleResult.innerHTML = resultText;
    }

    // Show appropriate buttons based on conquest status
    if (this.battleDataFlow.isConquest) {
      // Show conquest modal after delay
      console.log("🏆 Conquest detected - will show conquest modal");
      setTimeout(() => {
        this.showConquestModal();
      }, 1500);
    } else {
      // Show continue/end buttons for non-conquest
      if (
        this.elements.continueButton &&
        this.battleDataFlow.finalAttackerArmies > 1
      ) {
        this.elements.continueButton.style.display = "block";
      }

      if (this.elements.endButton) {
        this.elements.endButton.style.display = "block";
      }
    }

    // Clear execution flag
    this._executingAttack = false;
    console.log("✅ Attack execution completed");
  }

  /**
   * Update territory army count in game state
   * @private
   */
  _updateTerritoryArmies(territoryId, armyCount) {
    console.log(`🔄 Updating ${territoryId} armies to ${armyCount}`);

    let updated = false;

    // Update in window.gameState
    if (
      window.gameState &&
      window.gameState.territories &&
      window.gameState.territories[territoryId]
    ) {
      window.gameState.territories[territoryId].armies = armyCount;
      console.log("✅ Updated window.gameState");
      updated = true;
    }

    // Update in combatSystem.gameState
    if (
      this.combatSystem &&
      this.combatSystem.gameState &&
      this.combatSystem.gameState.territories &&
      this.combatSystem.gameState.territories[territoryId]
    ) {
      this.combatSystem.gameState.territories[territoryId].armies = armyCount;
      console.log("✅ Updated combatSystem.gameState");
      updated = true;
    }

    // Update GameStateManager if available
    if (
      typeof GameStateManager !== "undefined" &&
      typeof GameStateManager.updateTerritory === "function"
    ) {
      try {
        GameStateManager.updateTerritory(territoryId, { armies: armyCount });
        console.log("✅ Updated via GameStateManager");
        updated = true;
      } catch (error) {
        console.warn("⚠️ Could not update via GameStateManager:", error);
      }
    }

    if (!updated) {
      console.error(`❌ Failed to update armies for ${territoryId}`);
    }

    return updated;
  }

  /**
   * Update territory ownership
   * @private
   */
  _updateTerritoryOwnership(territoryId, newOwner) {
    console.log(`🔄 Changing ${territoryId} ownership to player ${newOwner}`);

    let updated = false;

    // Update in window.gameState
    if (
      window.gameState &&
      window.gameState.territories &&
      window.gameState.territories[territoryId]
    ) {
      window.gameState.territories[territoryId].owner = newOwner;
      window.gameState.territories[territoryId].ownerId = newOwner; // Some systems use ownerId
      console.log("✅ Updated window.gameState ownership");
      updated = true;
    }

    // Update in combatSystem.gameState
    if (
      this.combatSystem &&
      this.combatSystem.gameState &&
      this.combatSystem.gameState.territories &&
      this.combatSystem.gameState.territories[territoryId]
    ) {
      this.combatSystem.gameState.territories[territoryId].owner = newOwner;
      this.combatSystem.gameState.territories[territoryId].ownerId = newOwner;
      console.log("✅ Updated combatSystem.gameState ownership");
      updated = true;
    }

    // Update GameStateManager if available
    if (
      typeof GameStateManager !== "undefined" &&
      typeof GameStateManager.updateTerritory === "function"
    ) {
      try {
        GameStateManager.updateTerritory(territoryId, {
          owner: newOwner,
          ownerId: newOwner,
        });
        console.log("✅ Updated ownership via GameStateManager");
        updated = true;
      } catch (error) {
        console.warn(
          "⚠️ Could not update ownership via GameStateManager:",
          error
        );
      }
    }

    if (!updated) {
      console.error(`❌ Failed to update ownership for ${territoryId}`);
    } else {
      // Dispatch event for dashboard system
      document.dispatchEvent(new CustomEvent('territoryChanged', {
        detail: { territoryId, newOwner, source: 'CombatUI' }
      }));
    }

    return updated;
  }

  /**
   * Update map visual display for a territory
   * @private
   */
  _updateMapDisplay(territoryId) {
    console.log(`🗺️ Updating map display for ${territoryId}`);

    try {
      // Method 1: Try RiskUI
      if (
        typeof window.riskUI !== "undefined" &&
        typeof window.riskUI.updateTerritoryDisplay === "function"
      ) {
        window.riskUI.updateTerritoryDisplay(territoryId);
        console.log("✅ Updated via RiskUI.updateTerritoryDisplay");
        
        // Refresh all territory opacities after battle
        if (window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return true;
      }

      // Method 2: Try RiskMap
      if (
        typeof window.RiskMap !== "undefined" &&
        typeof window.RiskMap.updateTerritoryDisplay === "function"
      ) {
        window.RiskMap.updateTerritoryDisplay(territoryId);
        console.log("✅ Updated via RiskMap.updateTerritoryDisplay");
        
        // Refresh all territory opacities after battle
        if (window.riskUI && window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return true;
      }

      // Method 3: Try riskMap instance
      if (
        typeof window.riskMap !== "undefined" &&
        typeof window.riskMap.updateTerritoryDisplay === "function"
      ) {
        window.riskMap.updateTerritoryDisplay(territoryId);
        console.log("✅ Updated via riskMap.updateTerritoryDisplay");
        
        // Refresh all territory opacities after battle
        if (window.riskUI && window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return true;
      }

      // Method 4: Try direct DOM update
      const territory =
        window.gameState?.territories?.[territoryId] ||
        this.combatSystem?.gameState?.territories?.[territoryId];

      if (territory) {
        // Try multiple DOM selectors
        const selectors = [
          `[data-territory="${territoryId}"]`,
          `[data-territory-id="${territoryId}"]`,
          `#territory-${territoryId.replace(/\s+/g, "-")}`,
        ];

        let territoryElement = null;
        for (const selector of selectors) {
          territoryElement = document.querySelector(selector);
          if (territoryElement) {
            console.log(`Found territory element with selector: ${selector}`);
            break;
          }
        }

        if (territoryElement) {
          // Update army count display
          const armyDisplaySelectors = [
            ".army-count",
            ".territory-armies",
            ".armies",
          ];
          let armyDisplay = null;

          for (const selector of armyDisplaySelectors) {
            armyDisplay = territoryElement.querySelector(selector);
            if (armyDisplay) break;
          }

          if (armyDisplay) {
            armyDisplay.textContent = territory.armies;
            console.log(`Updated army display to ${territory.armies} via DOM`);
          }

          // Update color based on owner with dynamic opacity
          if (window.gameState?.players?.[territory.owner]) {
            const playerColor = window.gameState.players[territory.owner].color;
            if (playerColor) {
              // Apply dynamic opacity if ColorManager available
              if (window.riskUI && window.riskUI.colorManager && window.gameState) {
                const continent = territory.continent || null;
                const opacity = window.riskUI.colorManager.calculateDynamicOpacity(
                  territory.armies,
                  continent,
                  window.gameState.territories
                );
                const rgbaColor = window.riskUI.colorManager.hexToRGBA(playerColor, opacity);
                territoryElement.style.fill = rgbaColor;
                territoryElement.style.stroke = playerColor;
                territoryElement.style.strokeWidth = '0.5';
              } else {
                // Fallback without dynamic opacity
                territoryElement.style.fill = playerColor;
              }
              
              console.log(`Updated territory color to ${playerColor}`);
            }
          }

          console.log("✅ Updated via direct DOM manipulation");
          
          // Refresh all territory opacities
          if (window.riskUI && window.riskUI.colorManager && window.gameState) {
            window.riskUI.colorManager.refreshAllTerritories(window.gameState);
          }
          
          return true;
        }
      }

      console.warn(
        "⚠️ Could not update map display - no method available for:",
        territoryId
      );
      return false;
    } catch (error) {
      console.error("❌ Error updating map display:", error);
      return false;
    }
  }

  /**
   * Show battle results in the UI
   * @param {Object} result - Battle result
   */
  showBattleResults(result) {
    console.log("🎬 showBattleResults called with:", result);

    // Enhanced validation with detailed error reporting
    if (!result) {
      console.error("❌ Invalid battle result: result is null or undefined");
      console.error("Stack trace:", new Error().stack);
      alert("Error: Invalid battle result received");
      return;
    }

    if (typeof result !== "object") {
      console.error("❌ Invalid battle result: result is not an object");
      console.error("Result type:", typeof result);
      console.error("Result value:", result);
      alert("Error: Battle result has invalid format");
      return;
    }

    // Check for required properties
    const requiredProps = [
      "attackingTerritory",
      "defendingTerritory",
      "attackerLosses",
      "defenderLosses",
    ];

    const missingProps = requiredProps.filter((prop) => !(prop in result));

    if (missingProps.length > 0) {
      console.error(
        "❌ Battle result missing required properties:",
        missingProps
      );
      console.error("Available properties:", Object.keys(result));
      console.error("Full result object:", result);
      alert(
        "Error: Battle result incomplete. Missing: " + missingProps.join(", ")
      );
      return;
    }

    console.log("✅ Battle result structure validated");

    // Capture the territory IDs
    const attackingTerritoryId =
      result.attackingTerritory || this.currentAttackingTerritory;
    const defendingTerritoryId =
      result.defendingTerritory || this.currentDefendingTerritory;

    // Hide army input section and execute button
    if (this.elements.armyInputSection) {
      this.elements.armyInputSection.style.display = "none";
    }

    if (this.elements.executeButton) {
      this.elements.executeButton.style.display = "none";
    }

    // Show results section
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "block";
    }

    // Format losses for consistent display
    const attackerLosses = Array.isArray(result.attackerLosses)
      ? result.attackerLosses.length
      : typeof result.attackerLosses === "number"
      ? result.attackerLosses
      : 0;

    const defenderLosses = Array.isArray(result.defenderLosses)
      ? result.defenderLosses.length
      : typeof result.defenderLosses === "number"
      ? result.defenderLosses
      : 0;

    console.log("📊 Formatted losses:", { attackerLosses, defenderLosses });

    // Display losses
    if (this.elements.attackerLossesDisplay) {
      this.elements.attackerLossesDisplay.textContent = `Lost ${attackerLosses} ${
        attackerLosses === 1 ? "army" : "armies"
      }`;
    }

    if (this.elements.defenderLossesDisplay) {
      this.elements.defenderLossesDisplay.textContent = `Lost ${defenderLosses} ${
        defenderLosses === 1 ? "army" : "armies"
      }`;
    }

    // Display battle result text
    let resultText = `Attacker lost ${attackerLosses} ${
      attackerLosses === 1 ? "army" : "armies"
    }. Defender lost ${defenderLosses} ${
      defenderLosses === 1 ? "army" : "armies"
    }.`;

    // Check for conquest
    const isConquest =
      result.isConquest ||
      result.conquered ||
      result.territoryConquered ||
      result.defenderRemainingArmies === 0;

    if (isConquest) {
      resultText += "<br><strong>🏆 Territory Conquered!</strong>";
      console.log("🏆 Conquest detected!");
    }

    // Update battle result display
    if (this.elements.battleResult) {
      if (this.gameUtils && this.gameUtils.safeUpdateElement) {
        this.gameUtils.safeUpdateElement(
          this.elements.battleResult,
          "innerHTML",
          resultText
        );
      } else {
        this.elements.battleResult.innerHTML = resultText;
      }
    }

    // DO NOT UPDATE THE TERRITORY DISPLAY ARMIES HERE
    // Those elements (#attack-modal-attacking-armies and #attack-modal-defending-armies)
    // should ALWAYS show the STARTING armies, not the remaining armies
    // The remaining armies are shown in the battle result text and can be entered by user
    console.log(
      "💡 Keeping territory army displays at starting values (not updating to remaining armies)"
    );

    // Show continue button if territory not conquered and attacker can continue
    if (this.elements.continueButton) {
      if (
        !isConquest &&
        result.attackerRemainingArmies &&
        result.attackerRemainingArmies > 1 &&
        result.defenderRemainingArmies > 0
      ) {
        if (this.gameUtils && this.gameUtils.safeToggleDisplay) {
          this.gameUtils.safeToggleDisplay(this.elements.continueButton, true);
        } else {
          this.elements.continueButton.style.display = "block";
        }
      } else {
        if (this.gameUtils && this.gameUtils.safeToggleDisplay) {
          this.gameUtils.safeToggleDisplay(this.elements.continueButton, false);
        } else {
          this.elements.continueButton.style.display = "none";
        }
      }
    }

    // Show reset button
    if (this.elements.resetButton) {
      this.elements.resetButton.style.display = "block";
    }

    // Log final state
    console.log("✅ Battle results displayed successfully");
    console.log("Final armies:", {
      attacker: result.attackerRemainingArmies,
      defender: result.defenderRemainingArmies,
      isConquest: isConquest,
    });

    // Handle conquest
    if (isConquest) {
      console.log(
        "🏆 Territory conquered! Preparing to show conquest modal..."
      );

      // CRITICAL: Store conquest info now before combat instance can be cleared
      this.pendingConquest = {
        attackingTerritoryId:
          attackingTerritoryId || this.currentAttackingTerritory,
        defendingTerritoryId:
          defendingTerritoryId || this.currentDefendingTerritory,
        attackerRemainingArmies: result.attackerRemainingArmies,
        storedAt: Date.now(),
      };

      console.log("💾 Stored conquest info:", this.pendingConquest);

      // Small delay to let user see the conquest message
      setTimeout(() => {
        this.showConquestModal();
      }, 1500);
    }
  }

  /**
   * Update map display with new territory state
   * @private
   * @param {string} attackingTerritoryId - ID of attacking territory
   * @param {string} defendingTerritoryId - ID of defending territory
   */
  _updateMapDisplay(attackingTerritoryId, defendingTerritoryId) {
    console.log("🔄 Updating map display for territories:", {
      attacker: attackingTerritoryId,
      defender: defendingTerritoryId,
    });

    // Try multiple ways to update the map display

    // Method 1: Direct territory update function
    if (typeof window.updateTerritoryDisplay === "function") {
      console.log("✅ Using window.updateTerritoryDisplay");
      window.updateTerritoryDisplay(attackingTerritoryId);
      window.updateTerritoryDisplay(defendingTerritoryId);
      
      // Refresh all territory opacities
      if (window.riskUI && window.riskUI.colorManager && window.gameState) {
        window.riskUI.colorManager.refreshAllTerritories(window.gameState);
      }
      return;
    }

    // Method 2: RiskMap class
    if (window.RiskMap) {
      if (typeof window.RiskMap.updateTerritoryDisplay === "function") {
        console.log("✅ Using RiskMap.updateTerritoryDisplay");
        window.RiskMap.updateTerritoryDisplay(attackingTerritoryId);
        window.RiskMap.updateTerritoryDisplay(defendingTerritoryId);
        
        // Refresh all territory opacities
        if (window.riskUI && window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return;
      } else if (typeof window.RiskMap.updateTerritory === "function") {
        console.log("✅ Using RiskMap.updateTerritory");
        window.RiskMap.updateTerritory(attackingTerritoryId);
        window.RiskMap.updateTerritory(defendingTerritoryId);
        
        // Refresh all territory opacities
        if (window.riskUI && window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return;
      }
    }

    // Method 3: RiskUI class
    if (window.riskUI) {
      if (typeof window.riskUI.updateTerritoryDisplay === "function") {
        console.log("✅ Using riskUI.updateTerritoryDisplay");
        window.riskUI.updateTerritoryDisplay(attackingTerritoryId);
        window.riskUI.updateTerritoryDisplay(defendingTerritoryId);
        
        // Refresh all territory opacities
        if (window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return;
      } else if (typeof window.riskUI.updateAllTerritories === "function") {
        console.log("✅ Using riskUI.updateAllTerritories");
        window.riskUI.updateAllTerritories();
        
        // Refresh all territory opacities
        if (window.riskUI.colorManager && window.gameState) {
          window.riskUI.colorManager.refreshAllTerritories(window.gameState);
        }
        return;
      }
    }

    // Method 4: Update territory functions via GameStateManager
    if (
      GameStateManager &&
      typeof GameStateManager.refreshTerritoryDisplay === "function"
    ) {
      console.log("✅ Using GameStateManager.refreshTerritoryDisplay");
      GameStateManager.refreshTerritoryDisplay(attackingTerritoryId);
      GameStateManager.refreshTerritoryDisplay(defendingTerritoryId);
      
      // Refresh all territory opacities
      if (window.riskUI && window.riskUI.colorManager && window.gameState) {
        window.riskUI.colorManager.refreshAllTerritories(window.gameState);
      }
      return;
    }

    // Method 5: DOM direct manipulation as last resort
    try {
      console.log(
        "⚠️ Attempting direct DOM manipulation for territory display"
      );
      // Try to find territory elements by ID and update them
      const attackerElement = document.querySelector(
        `[data-territory-id="${attackingTerritoryId}"]`
      );
      const defenderElement = document.querySelector(
        `[data-territory-id="${defendingTerritoryId}"]`
      );

      // Find and update army count elements
      if (attackerElement) {
        const attackerArmyEl = attackerElement.querySelector(".army-count");
        if (attackerArmyEl) {
          const territory =
            this.combatSystem.gameState.territories[attackingTerritoryId];
          if (territory) {
            attackerArmyEl.textContent = territory.armies;
          }
        }
      }

      if (defenderElement) {
        const defenderArmyEl = defenderElement.querySelector(".army-count");
        if (defenderArmyEl) {
          const territory =
            this.combatSystem.gameState.territories[defendingTerritoryId];
          if (territory) {
            defenderArmyEl.textContent = territory.armies;
          }
        }
      }
      
      // Refresh all territory opacities
      if (window.riskUI && window.riskUI.colorManager && window.gameState) {
        window.riskUI.colorManager.refreshAllTerritories(window.gameState);
      }
    } catch (error) {
      console.warn("⚠️ Unable to update map display through DOM:", error);
    }
  }

  /**
   * Display dice rolls in the UI
   * @param {HTMLElement} container - Container element
   * @param {Array} rolls - Array of dice values
   */
  displayDiceRolls(container, rolls) {
    if (!container) return;

    container.innerHTML = "";

    rolls.forEach((roll) => {
      const diceEl = document.createElement("span");
      diceEl.className = "dice-value";
      diceEl.textContent = roll;
      diceEl.style.margin = "0 5px";
      diceEl.style.padding = "3px 8px";
      diceEl.style.background = "#f0f0f0";
      diceEl.style.borderRadius = "3px";
      container.appendChild(diceEl);
    });
  }

  /**
   * Continue the attack with new army input
   */
  continueAttack() {
    // Hide results section and reset button
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "none";
    }

    if (this.elements.resetButton) {
      this.elements.resetButton.style.display = "none";
    }

    // Show army input section and execute button
    if (this.elements.armyInputSection) {
      this.elements.armyInputSection.style.display = "block";
    }

    if (this.elements.executeButton) {
      this.elements.executeButton.style.display = "block";
    }

    // Update army input fields based on current armies
    const combat = this.combatSystem.currentCombat.getState();
    const attackingTerritory =
      this.combatSystem.gameState.territories[combat.attackingTerritory];
    const defendingTerritory =
      this.combatSystem.gameState.territories[combat.defendingTerritory];

    // Set default values and max/min for army inputs
    if (this.elements.attackerArmyInput) {
      this.elements.attackerArmyInput.min = 1; // Must leave at least 1 army
      this.elements.attackerArmyInput.max = attackingTerritory.armies - 1;
      this.elements.attackerArmyInput.value = attackingTerritory.armies - 1; // Default to 1 army loss
    }

    if (this.elements.defenderArmyInput) {
      this.elements.defenderArmyInput.min = 0; // Defender can lose all armies
      this.elements.defenderArmyInput.max = defendingTerritory.armies;
      this.elements.defenderArmyInput.value = Math.max(
        0,
        defendingTerritory.armies - 1
      ); // Default to 1 army loss
    }
  }

  /**
   * End the current attack
   */
  endAttack() {
    // Store territory IDs before ending combat
    const attackingTerritoryId = this.currentAttackingTerritory;
    const defendingTerritoryId = this.currentDefendingTerritory;

    console.log("🛑 Ending attack between territories:", {
      attacker: attackingTerritoryId,
      defender: defendingTerritoryId,
    });

    // Ensure final map update before closing
    if (attackingTerritoryId && defendingTerritoryId) {
      try {
        // Force a final territory sync with the game state
        if (GameStateManager) {
          console.log("🔄 Final game state synchronization");
          const attackerState =
            GameStateManager.getTerritory(attackingTerritoryId);
          const defenderState =
            GameStateManager.getTerritory(defendingTerritoryId);

          if (attackerState && defenderState) {
            // Final update of the map visuals
            this._updateMapDisplay(attackingTerritoryId, defendingTerritoryId);
          }
        }
      } catch (error) {
        console.warn("⚠️ Error during final map update:", error);
      }
    }

    // Close attack modal
    if (this.elements.attackModal) {
      this.elements.attackModal.style.display = "none";
    }

    // End combat in the combat system
    this.combatSystem.endCombat();

    // Final check for map state consistency
    try {
      if (
        window.riskUI &&
        typeof window.riskUI.updateAllTerritories === "function"
      ) {
        console.log("🔄 Final map refresh via riskUI.updateAllTerritories");
        window.riskUI.updateAllTerritories();
      } else if (
        GameStateManager &&
        typeof GameStateManager.refreshAllTerritories === "function"
      ) {
        console.log(
          "🔄 Final map refresh via GameStateManager.refreshAllTerritories"
        );
        GameStateManager.refreshAllTerritories();
      }
    } catch (error) {
      console.warn("⚠️ Error during final map refresh:", error);
    }

    // Reset current territories
    this.currentAttackingTerritory = null;
    this.currentDefendingTerritory = null;

    console.log("✅ Attack ended successfully");
  }

  /**
   * Reset attack selection to start a new attack
   */
  resetAttack() {
    // Hide results section
    if (this.elements.resultsSection) {
      this.elements.resultsSection.style.display = "none";
    }

    // End combat and restart modal
    this.combatSystem.endCombat();

    // Reset current territories
    this.currentAttackingTerritory = null;
    this.currentDefendingTerritory = null;

    // Clear all attack highlights
    this.clearAttackHighlights();

    // Close modal
    if (this.elements.attackModal) {
      this.elements.attackModal.style.display = "none";
    }
  }

  /**
   * Reset combat UI to initial state
   * Called when ending a complete attack sequence
   * Primary reset method that clears all combat state
   */
  reset() {
    console.log("🔄 Resetting CombatUI to initial state");

    try {
      // Close any open modals
      if (this.elements.attackModal) {
        this.elements.attackModal.style.display = "none";
      }

      if (this.conquestElements.modal) {
        this.conquestElements.modal.style.display = "none";
      }

      // Reset battle data flow completely
      this.battleDataFlow = {
        attackingTerritoryId: null,
        defendingTerritoryId: null,
        initialAttackerArmies: 0,
        initialDefenderArmies: 0,
        finalAttackerArmies: 0,
        finalDefenderArmies: 0,
        attackerLosses: 0,
        defenderLosses: 0,
        isConquest: false,
        transferAmount: 0,
        finalSourceArmies: 0,
        finalDestinationArmies: 0,
      };

      // Reset UI state
      this.currentAttackingTerritory = null;
      this.currentDefendingTerritory = null;
      this.currentAttackState = null;
      this.currentBattleData = null;
      this.pendingConquest = null;

      // Clear territory highlighting
      this.clearAttackHighlights();

      // Reset input fields
      const attackerInput = document.getElementById(
        "attack-modal-attacker-armies-input"
      );
      const defenderInput = document.getElementById(
        "attack-modal-defender-armies-input"
      );

      if (attackerInput) {
        attackerInput.value = "1";
        attackerInput.min = "1";
        attackerInput.max = "1";
      }

      if (defenderInput) {
        defenderInput.value = "0";
        defenderInput.min = "0";
        defenderInput.max = "1";
      }

      // Reset transfer modal
      const transferSlider = document.getElementById("transfer-slider");
      const transferInput = document.getElementById("transfer-input");

      if (transferSlider) {
        transferSlider.value = "1";
        transferSlider.min = "1";
        transferSlider.max = "1";
      }

      if (transferInput) {
        transferInput.value = "1";
        transferInput.min = "1";
        transferInput.max = "1";
      }

      console.log("✅ CombatUI reset complete");
      return true;
    } catch (error) {
      console.error("❌ Error resetting CombatUI:", error);
      return false;
    }
  }

  /**
   * Alternative reset method name for compatibility
   * Alias for reset() method
   */
  resetAttackUI() {
    console.log("🔄 Resetting attack UI (resetAttackUI alias)");
    return this.reset();
  }

  /**
   * Complete reset including all global attack state
   * Cleans up both UI and any global state variables
   */
  resetAll() {
    console.log("🔄 Complete reset of all combat systems");

    // Reset CombatUI first
    this.reset();

    // Clear any global attack state if it exists
    if (window.attackState) {
      window.attackState.attackingTerritory = null;
      window.attackState.defendingTerritory = null;
      window.attackState.step = 1;
    }

    // Reset transfer state if it exists
    if (window.transferState) {
      window.transferState.sourceTerritory = null;
      window.transferState.destinationTerritory = null;
      window.transferState.currentTransfer = 1;
    }

    // End combat in combat system
    if (this.combatSystem) {
      this.combatSystem.endCombat();
    }

    console.log("✅ Complete reset finished");
    return true;
  }

  /**
   * Show conquest modal for army transfer
   * Transfer amount must come from REAL post-battle data in battleDataFlow
   */
  showConquestModal() {
    console.log("🏆 Showing conquest modal - using battleDataFlow");

    // Close attack modal first
    if (this.elements.attackModal) {
      this.elements.attackModal.style.display = "none";
    }

    // Validate we have battleDataFlow with conquest
    if (!this.battleDataFlow.isConquest) {
      console.error(
        "❌ showConquestModal called but battleDataFlow shows no conquest"
      );
      return;
    }

    if (
      !this.battleDataFlow.attackingTerritoryId ||
      !this.battleDataFlow.defendingTerritoryId
    ) {
      console.error(
        "❌ showConquestModal called but battleDataFlow missing territory IDs"
      );
      return;
    }

    // Calculate transfer constraints based on REAL final attacker armies from battleDataFlow
    const maxTransfer = this.battleDataFlow.finalAttackerArmies - 1; // Must leave 1 behind
    const minTransfer = 1; // Must move at least 1

    if (maxTransfer < minTransfer) {
      console.error(
        `❌ Not enough armies to transfer (finalAttackerArmies=${this.battleDataFlow.finalAttackerArmies})`
      );
      alert(
        "Conquest error: Not enough armies remaining to complete transfer (need at least 2)"
      );
      return;
    }

    console.log("� Transfer constraints from battleDataFlow:", {
      finalAttackerArmies: this.battleDataFlow.finalAttackerArmies,
      minTransfer: minTransfer,
      maxTransfer: maxTransfer,
    });

    // Update transfer state with REAL values from battleDataFlow
    window.transferState = {
      sourceTerritory: this.battleDataFlow.attackingTerritoryId,
      destinationTerritory: this.battleDataFlow.defendingTerritoryId,
      maxTransfer: maxTransfer,
      currentTransfer: minTransfer,
      minTransfer: minTransfer,
    };

    // Get territory names for display
    const attackingTerr = this._getActualTerritoryData(
      this.battleDataFlow.attackingTerritoryId
    );
    const defendingTerr = this._getActualTerritoryData(
      this.battleDataFlow.defendingTerritoryId
    );

    // Update conquest modal display
    if (!this.conquestElements.modal) {
      console.error("❌ Conquest modal element not found");
      return;
    }

    // Update source territory
    this.gameUtils.safeUpdateElement(
      this.conquestElements.sourceName,
      "textContent",
      attackingTerr?.name ||
        this.battleDataFlow.attackingTerritoryId
          .replace(/-/g, " ")
          .toUpperCase()
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.sourceArmies,
      "textContent",
      `${this.battleDataFlow.finalAttackerArmies} armies available`
    );

    // Update destination territory
    this.gameUtils.safeUpdateElement(
      this.conquestElements.destName,
      "textContent",
      defendingTerr?.name ||
        this.battleDataFlow.defendingTerritoryId
          .replace(/-/g, " ")
          .toUpperCase()
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.destArmies,
      "textContent",
      `Conquered territory (will receive armies)`
    );

    // Set up transfer controls with REAL ranges from battleDataFlow
    if (this.conquestElements.slider) {
      this.conquestElements.slider.min = minTransfer;
      this.conquestElements.slider.max = maxTransfer;
      this.conquestElements.slider.value = minTransfer;
    }

    if (this.conquestElements.input) {
      this.conquestElements.input.min = minTransfer;
      this.conquestElements.input.max = maxTransfer;
      this.conquestElements.input.value = minTransfer;
    }

    this.gameUtils.safeUpdateElement(
      this.conquestElements.sliderMaxLabel,
      "textContent",
      maxTransfer.toString()
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.transferRange,
      "textContent",
      `You can transfer ${minTransfer}-${maxTransfer} armies`
    );

    // Update preview
    this.updateTransferPreview();

    // Show modal
    this.conquestElements.modal.style.display = "flex";

    console.log("✅ Conquest modal shown with REAL data from battleDataFlow");
  }

  /**
   * Update transfer preview based on slider value
   */
  updateTransferPreview() {
    if (!this.conquestElements.slider) return;

    const transferAmount = parseInt(this.conquestElements.slider.value);
    this.updateTransferPreviewWithValue(transferAmount);

    // Sync input with slider
    if (this.conquestElements.input) {
      this.conquestElements.input.value = transferAmount;
    }
  }

  /**
   * Update transfer preview based on input value
   */
  updateTransferPreviewWithValue(transferAmount) {
    if (
      !this.battleDataFlow.isConquest ||
      !this.battleDataFlow.finalAttackerArmies
    ) {
      console.warn(
        "⚠️ updateTransferPreviewWithValue called without valid battleDataFlow"
      );
      return;
    }

    // Calculate REAL final values from battleDataFlow
    const finalSourceArmies =
      this.battleDataFlow.finalAttackerArmies - transferAmount;
    const finalDestArmies = transferAmount;

    // Update preview display with REAL calculations
    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewSource,
      "textContent",
      this.battleDataFlow.attackingTerritoryId.replace(/-/g, " ").toUpperCase()
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewSourceArmies,
      "textContent",
      `${finalSourceArmies} armies remaining`
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewDest,
      "textContent",
      this.battleDataFlow.defendingTerritoryId.replace(/-/g, " ").toUpperCase()
    );

    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewDestArmies,
      "textContent",
      `${finalDestArmies} armies total`
    );

    console.log("📊 Transfer preview updated from battleDataFlow:", {
      transferAmount,
      finalSourceArmies,
      finalDestArmies,
    });
  }

  /**
   * Update transfer preview based on input value - legacy wrapper
   */
  updateTransferInputPreview() {
    if (!this.conquestElements.input) return;

    const transferAmount = parseInt(this.conquestElements.input.value);
    this.updateTransferPreviewWithValue(transferAmount);

    // Sync slider with input
    if (this.conquestElements.slider) {
      this.conquestElements.slider.value = transferAmount;
    }
  }

  /**
   * Update transfer preview with specific value
   */
  updateTransferPreviewValue(transferAmount) {
    this.updateTransferPreviewWithValue(transferAmount);
  }

  _updateTransferState(attackingTerritoryId, defendingTerritoryId) {
    // DEPRECATED: This method is no longer used
    // battleDataFlow system handles all transfer state management
    console.warn(
      "🚫 _updateTransferState is deprecated - battleDataFlow system handles transfer state"
    );
    console.log(
      "💡 All transfer state is now managed via this.battleDataFlow object"
    );
    return;
  }

  /**
   * Update transfer preview based on input value
   */
  updateTransferFromInput() {
    if (!this.conquestElements.input) return;

    const transferAmount = parseInt(this.conquestElements.input.value);
    const maxArmies = parseInt(this.conquestElements.input.max);
    const validAmount = Math.max(1, Math.min(maxArmies, transferAmount));

    this.updateTransferPreviewWithValue(validAmount);

    // Sync slider with input if value changed
    if (transferAmount !== validAmount) {
      this.conquestElements.input.value = validAmount;
    }

    if (this.conquestElements.slider) {
      this.conquestElements.slider.value = validAmount;
    }
  }

  /**
   * Update transfer preview with a specific value
   * @param {number} transferAmount - Number of armies to transfer
   */
  updateTransferPreviewWithValue(transferAmount) {
    const combat = this.combatSystem.currentCombat;

    if (!combat || !combat.isConquered()) return;

    const attackingTerritory =
      this.combatSystem.gameState.territories[combat.getAttackingTerritory()];
    const defendingTerritory =
      this.combatSystem.gameState.territories[combat.getDefendingTerritory()];

    // Update window.transferState for compatibility
    if (typeof window !== "undefined" && window.transferState) {
      window.transferState.currentTransfer = transferAmount;
    }

    // Calculate remaining armies
    const sourceRemaining = attackingTerritory.armies - transferAmount;
    const destTotal = defendingTerritory.armies + transferAmount;

    // Update preview
    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewSource,
      "textContent",
      attackingTerritory.name || combat.getAttackingTerritory()
    );
    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewSourceArmies,
      "textContent",
      `${sourceRemaining} armies remaining`
    );
    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewDest,
      "textContent",
      defendingTerritory.name || combat.getDefendingTerritory()
    );
    this.gameUtils.safeUpdateElement(
      this.conquestElements.previewDestArmies,
      "textContent",
      `${destTotal} armies total`
    );
  }

  /**
   * Confirm army transfer after conquest
   */
  /**
   * Confirm army transfer after conquest
   * Uses battleDataFlow for all calculations - NO MOCK VALUES
   */
  confirmTransfer() {
    console.log("🔄 confirmTransfer called - using battleDataFlow");

    // Validate we have battleDataFlow from a conquest
    if (!this.battleDataFlow.isConquest) {
      console.error(
        "❌ confirmTransfer called but battleDataFlow shows no conquest"
      );
      return { success: false, error: "No conquest data available" };
    }

    if (
      !this.battleDataFlow.attackingTerritoryId ||
      !this.battleDataFlow.defendingTerritoryId
    ) {
      console.error(
        "❌ confirmTransfer called but battleDataFlow missing territory IDs"
      );
      return { success: false, error: "Missing territory information" };
    }

    try {
      // Get transfer amount from UI
      let transferAmount = parseInt(
        this.conquestElements.slider?.value ||
          this.conquestElements.input?.value ||
          1
      );

      // Validate transfer amount against battleDataFlow constraints
      const minTransfer = 1;
      const maxTransfer = this.battleDataFlow.finalAttackerArmies - 1; // Must leave 1 behind

      if (
        isNaN(transferAmount) ||
        transferAmount < minTransfer ||
        transferAmount > maxTransfer
      ) {
        console.error(
          `❌ Invalid transfer amount ${transferAmount} (must be ${minTransfer}-${maxTransfer})`
        );
        return {
          success: false,
          error: `Invalid transfer amount (must be ${minTransfer}-${maxTransfer})`,
        };
      }

      console.log("📊 Transfer details from battleDataFlow:", {
        finalAttackerArmies: this.battleDataFlow.finalAttackerArmies,
        transferAmount: transferAmount,
        minTransfer: minTransfer,
        maxTransfer: maxTransfer,
      });

      // Calculate REAL final values from battleDataFlow
      this.battleDataFlow.transferAmount = transferAmount;
      this.battleDataFlow.finalSourceArmies =
        this.battleDataFlow.finalAttackerArmies - transferAmount;
      this.battleDataFlow.finalDestinationArmies = transferAmount;

      // Validate calculations
      if (this.battleDataFlow.finalSourceArmies < 1) {
        console.error("❌ Transfer would leave source with < 1 army");
        return {
          success: false,
          error: "Transfer would leave source territory empty",
        };
      }

      console.log("✅ Transfer calculations validated:", {
        finalSourceArmies: this.battleDataFlow.finalSourceArmies,
        finalDestinationArmies: this.battleDataFlow.finalDestinationArmies,
      });

      // Apply transfer to game state
      this._applyTransferToGameState();

      // Update UI displays using safe fallback method
      this._updateMapDisplay(this.battleDataFlow.attackingTerritoryId);
      this._updateMapDisplay(this.battleDataFlow.defendingTerritoryId);

      console.log("✅ Conquest transfer completed successfully");

      // Close conquest modal
      if (this.conquestElements.modal) {
        this.conquestElements.modal.style.display = "none";
      }

      // Close attack modal and clear combat state
      this.endAttack();

      // Clear pendingConquest (legacy)
      this.pendingConquest = null;

      return { success: true };
    } catch (error) {
      console.error("❌ Error during conquest transfer:", error);

      // Close modals on error
      if (this.conquestElements?.modal) {
        this.conquestElements.modal.style.display = "none";
      }
      if (this.elements?.attackModal) {
        this.elements.attackModal.style.display = "none";
      }

      // Clear state
      this.pendingConquest = null;
      if (this.combatSystem) {
        this.combatSystem.currentCombat = null;
      }

      return {
        success: false,
        error: error.message || "Conquest transfer failed",
      };
    }
  }

  /**
   * Apply conquest transfer to ALL game state sources
   * @private
   */
  _applyTransferToGameState() {
    console.log("🔄 Applying transfer to game state from battleDataFlow");

    const sourceId = this.battleDataFlow.attackingTerritoryId;
    const destId = this.battleDataFlow.defendingTerritoryId;
    const finalSourceArmies = this.battleDataFlow.finalSourceArmies;
    const finalDestArmies = this.battleDataFlow.finalDestinationArmies;

    // Update source territory (attacker keeps remaining armies)
    this._updateTerritoryArmiesInGameState(sourceId, finalSourceArmies);

    // Update destination territory (conquered - gets transfer and changes owner)
    // First update armies
    this._updateTerritoryArmiesInGameState(destId, finalDestArmies);

    // Then update owner to match source territory
    const sourceTerritory = this._getActualTerritoryData(sourceId);
    if (sourceTerritory && sourceTerritory.owner !== undefined) {
      const newOwner = sourceTerritory.owner;

      // Update in ALL game state sources
      if (window.gameState?.territories?.[destId]) {
        window.gameState.territories[destId].owner = newOwner;
        console.log(
          `✅ Updated ${destId} owner in window.gameState to ${newOwner}`
        );
      }

      if (
        GameStateManager &&
        typeof GameStateManager.getTerritory === "function"
      ) {
        const destTerr = GameStateManager.getTerritory(destId);
        if (destTerr) {
          destTerr.owner = newOwner;
          console.log(
            `✅ Updated ${destId} owner in GameStateManager to ${newOwner}`
          );
        }
      }

      if (this.combatSystem?.gameState?.territories?.[destId]) {
        this.combatSystem.gameState.territories[destId].owner = newOwner;
        console.log(
          `✅ Updated ${destId} owner in combatSystem.gameState to ${newOwner}`
        );
      }
    }

    console.log("✅ Transfer applied to game state:", {
      source: `${sourceId}: ${finalSourceArmies} armies`,
      destination: `${destId}: ${finalDestArmies} armies (conquered)`,
    });
  }

  /**
   * Manually perform conquest transfer when combat instance is already cleared
   * @private
   * @param {string} sourceId - Source territory ID
   * @param {string} destId - Destination territory ID
   * @param {number} transferAmount - Number of armies to transfer
   * @returns {Object} Result object with success flag
   */
  _manualConquestTransfer(sourceId, destId, transferAmount) {
    console.log(
      `🎯 Manual conquest transfer: ${transferAmount} armies from ${sourceId} to ${destId}`
    );

    try {
      // Get territories using proper API - try multiple sources
      let sourceTerritory, destTerritory;

      // Try GameStateManager.getTerritory() first (primary method)
      if (
        GameStateManager &&
        typeof GameStateManager.getTerritory === "function"
      ) {
        console.log(
          "📍 Getting territories via GameStateManager.getTerritory()"
        );
        sourceTerritory = GameStateManager.getTerritory(sourceId);
        destTerritory = GameStateManager.getTerritory(destId);
      }
      // Fallback: Try window.gameState.territories
      else if (window.gameState && window.gameState.territories) {
        console.log("📍 Getting territories via window.gameState.territories");
        sourceTerritory = window.gameState.territories[sourceId];
        destTerritory = window.gameState.territories[destId];
      }
      // Last resort: Try combatSystem.gameState.territories
      else if (
        this.combatSystem.gameState &&
        this.combatSystem.gameState.territories
      ) {
        console.log(
          "📍 Getting territories via combatSystem.gameState.territories"
        );
        sourceTerritory = this.combatSystem.gameState.territories[sourceId];
        destTerritory = this.combatSystem.gameState.territories[destId];
      } else {
        throw new Error("No valid game state source available");
      }

      if (!sourceTerritory || !destTerritory) {
        throw new Error(`Territories not found: ${sourceId}, ${destId}`);
      }

      console.log(`📊 Before transfer:
        ${sourceId}: ${sourceTerritory.armies} armies (owner: ${sourceTerritory.owner})
        ${destId}: ${destTerritory.armies} armies (owner: ${destTerritory.owner})`);

      // Validate transfer
      if (sourceTerritory.armies <= transferAmount) {
        throw new Error(
          `Not enough armies in ${sourceId} for transfer (has ${
            sourceTerritory.armies
          }, need ${transferAmount + 1})`
        );
      }

      if (transferAmount < 1) {
        throw new Error("Must transfer at least 1 army");
      }

      // Get current player from source territory
      const conqueredPlayer = sourceTerritory.owner;

      // Perform the transfer
      sourceTerritory.armies -= transferAmount;
      destTerritory.armies = transferAmount;
      destTerritory.owner = conqueredPlayer;

      console.log(`✅ Manual transfer complete:
        ${sourceId}: ${sourceTerritory.armies} armies (owner: ${sourceTerritory.owner})
        ${destId}: ${destTerritory.armies} armies (owner: ${destTerritory.owner})`);

      // Update game state using GameStateManager if available
      if (
        GameStateManager &&
        typeof GameStateManager.updateTerritory === "function"
      ) {
        console.log("🔄 Updating territories via GameStateManager");
        GameStateManager.updateTerritory(sourceId, sourceTerritory);
        GameStateManager.updateTerritory(destId, destTerritory);
      }

      // Update map display
      this._updateMapDisplay(sourceId);
      this._updateMapDisplay(destId);

      // Check for continent ownership changes
      if (
        GameStateManager &&
        typeof GameStateManager.checkContinentOwnership === "function"
      ) {
        console.log("🌍 Checking continent ownership");
        GameStateManager.checkContinentOwnership();
      }

      return {
        success: true,
        sourceTerritory: sourceId,
        destinationTerritory: destId,
        armiesTransferred: transferAmount,
        conqueredBy: conqueredPlayer,
      };
    } catch (error) {
      console.error("❌ Manual conquest transfer failed:", error);
      return {
        success: false,
        error: error.message || "Manual transfer failed",
      };
    }
  }

  /**
   * Use minimum army transfer (1 army)
   */
  cancelTransfer() {
    console.log("🔄 Using minimum transfer of 1 army");

    // Use confirmTransfer logic with minimum armies (1)
    // Set the slider/input to 1 first
    if (this.conquestElements.slider) {
      this.conquestElements.slider.value = 1;
    }
    if (this.conquestElements.input) {
      this.conquestElements.input.value = 1;
    }

    // Call confirmTransfer which now has all the recovery logic
    return this.confirmTransfer();
  }

  /**
   * Complete conquest with specified army count
   * Simplified to use battleDataFlow only
   * @param {number} armyCount - Number of armies to transfer (optional)
   * @returns {Object} Result of transfer operation
   */
  completeConquest(armyCount = null) {
    console.log("🔄 completeConquest called with armyCount:", armyCount);

    // If army count specified, update the UI elements
    if (armyCount !== null && !isNaN(armyCount)) {
      if (this.conquestElements.slider) {
        this.conquestElements.slider.value = armyCount;
      }
      if (this.conquestElements.input) {
        this.conquestElements.input.value = armyCount;
      }
      console.log(`✅ Set transfer amount to ${armyCount}`);
    }

    // Use confirmTransfer which handles everything via battleDataFlow
    return this.confirmTransfer();
  }

  /**
   * Manually perform conquest transfer when combat instance is already cleared
   * DEPRECATED - Now handled by battleDataFlow in confirmTransfer()
   * Kept for backwards compatibility only
   * @private
   */
  _manualConquestTransfer(sourceId, destId, transferAmount) {
    console.warn(
      "⚠️ _manualConquestTransfer called - this method is deprecated"
    );
    console.log("� Redirecting to confirmTransfer which uses battleDataFlow");

    // This method is no longer needed since battleDataFlow handles everything
    // But we keep it as a stub for any legacy code that might call it
    return {
      success: false,
      error:
        "Method deprecated - use confirmTransfer with battleDataFlow instead",
    };
  }

  /**
   * Cancel army transfer and close conquest modal
   */
  cancelTransfer() {
    console.log("❌ Transfer cancelled by user");

    // Close conquest modal
    if (this.conquestElements.modal) {
      this.conquestElements.modal.style.display = "none";
    }

    // Close attack modal
    this.endAttack();

    // Clear stored conquest data
    this.pendingConquest = null;

    // Clear combat state
    if (this.combatSystem) {
      this.combatSystem.currentCombat = null;
    }

    console.log("✅ Transfer cancelled, modals closed");
  }

  /**
   * Handle territory click for attack phase
   * @param {string} territoryId - Clicked territory ID
   * @returns {object} - Result with success/error information
   */
  handleTerritoryClick(territoryId) {
    try {
      // Check if combatSystem is properly initialized
      if (!this.combatSystem) {
        return { success: false, error: "Combat system not initialized" };
      }

      // Check if validateAttacker method exists
      if (typeof this.combatSystem.validateAttacker !== "function") {
        console.error("validateAttacker method not found on combatSystem");
        // Fall back to using validateAttack if available
        if (typeof this.combatSystem.validateAttack === "function") {
          return this.handleTerritoryClickFallback(territoryId);
        }
        return { success: false, error: "Combat validation not available" };
      }

      // If no attacking territory selected yet, check if this is a valid attacker
      if (!this.currentAttackingTerritory) {
        const validation = this.combatSystem.validateAttacker(territoryId);

        if (validation.valid) {
          this.currentAttackingTerritory = territoryId;
          // Highlight attacking territory and potential targets
          this.highlightAttackingTerritory(territoryId);
          return {
            success: true,
            action: "attacker_selected",
            territory: territoryId,
          };
        } else {
          return {
            success: false,
            error: validation.reason || "Invalid attacker",
          };
        }
      }
      // If attacking territory already selected, check if this is a valid target
      else if (this.currentAttackingTerritory !== territoryId) {
        const validation = this.combatSystem.validateAttack(
          this.currentAttackingTerritory,
          territoryId
        );

        if (validation.valid) {
          // Start attack between territories
          const attackResult = this.startAttack(
            this.currentAttackingTerritory,
            territoryId
          );
          return { success: attackResult, action: "attack_started" };
        } else {
          // Check if new territory is a valid attacker
          const newAttackerValidation =
            this.combatSystem.validateAttacker(territoryId);

          if (newAttackerValidation.valid) {
            // Switch to new attacking territory
            this.currentAttackingTerritory = territoryId;
            this.highlightAttackingTerritory(territoryId);
            return {
              success: true,
              action: "attacker_changed",
              territory: territoryId,
            };
          } else {
            return {
              success: false,
              error: validation.reason || "Invalid target",
            };
          }
        }
      }
    } catch (err) {
      console.error("Error in handleTerritoryClick:", err);
      return {
        success: false,
        error: "An error occurred during territory selection",
      };
    }

    return { success: false, error: "No valid action for this territory" };
  }

  /**
   * Fallback handler for territory clicks when validateAttacker is not available
   * Uses validateAttack as an alternative way to determine valid attackers
   * @param {string} territoryId - Clicked territory ID
   * @returns {object} - Result with success/error information
   */
  handleTerritoryClickFallback(territoryId) {
    try {
      const territory = this.combatSystem.gameState.territories[territoryId];

      // Basic validation that we can do without validateAttacker
      if (!territory) {
        return { success: false, error: "Invalid territory" };
      }

      const currentPlayer = this.combatSystem.gameState.getCurrentPlayer();

      // If no attacking territory selected yet
      if (!this.currentAttackingTerritory) {
        // Check if territory belongs to current player
        if (territory.owner !== currentPlayer) {
          return {
            success: false,
            error: "Can only attack from your own territories",
          };
        }

        // Check if territory has enough armies to attack
        if (territory.armies < 2) {
          return {
            success: false,
            error: "Must have at least 2 armies to attack",
          };
        }

        // Check if territory has any valid neighbors to attack
        const hasValidTargets =
          territory.neighbors &&
          territory.neighbors.some((neighborId) => {
            const neighbor =
              this.combatSystem.gameState.territories[neighborId];
            return neighbor && neighbor.owner !== currentPlayer;
          });

        if (!hasValidTargets) {
          return {
            success: false,
            error: "No valid attack targets from this territory",
          };
        }

        // Valid attacker
        this.currentAttackingTerritory = territoryId;
        this.highlightAttackingTerritory(territoryId);
        return {
          success: true,
          action: "attacker_selected",
          territory: territoryId,
        };
      }
      // If attacking territory already selected
      else if (this.currentAttackingTerritory !== territoryId) {
        const validation = this.combatSystem.validateAttack(
          this.currentAttackingTerritory,
          territoryId
        );

        if (validation.valid) {
          // Start attack between territories
          const attackResult = this.startAttack(
            this.currentAttackingTerritory,
            territoryId
          );
          return { success: attackResult, action: "attack_started" };
        } else {
          // Check if new territory could be a valid attacker
          if (territory.owner === currentPlayer && territory.armies >= 2) {
            // Check if has valid targets
            const hasValidTargets =
              territory.neighbors &&
              territory.neighbors.some((neighborId) => {
                const neighbor =
                  this.combatSystem.gameState.territories[neighborId];
                return neighbor && neighbor.owner !== currentPlayer;
              });

            if (hasValidTargets) {
              // Switch to new attacking territory
              this.currentAttackingTerritory = territoryId;
              this.highlightAttackingTerritory(territoryId);
              return {
                success: true,
                action: "attacker_changed",
                territory: territoryId,
              };
            }
          }

          return {
            success: false,
            error: validation.reason || "Invalid target",
          };
        }
      }

      return { success: false, error: "No valid action for this territory" };
    } catch (err) {
      console.error("Error in handleTerritoryClickFallback:", err);
      return {
        success: false,
        error: "An error occurred during territory selection",
      };
    }
  }

  /**
   * Highlight attacking territory and its potential targets
   * @param {string} territoryId - Attacking territory ID
   */
  highlightAttackingTerritory(territoryId) {
    console.log(`Highlighting attacking territory: ${territoryId}`);

    try {
      // Clear any existing highlights first
      this.clearAttackHighlights();

      // Highlight the selected attacking territory
      const attackingElement = document.getElementById(territoryId);
      if (attackingElement) {
        attackingElement.classList.add('highlight-selected-attacker');
      }

      let targets = [];

      // Try different methods to get possible attack targets
      if (typeof this.combatSystem.getPossibleAttackTargets === "function") {
        targets = this.combatSystem.getPossibleAttackTargets(territoryId);
      } else if (
        typeof this.combatSystem.getAttackableTerritoriesFrom === "function"
      ) {
        targets = this.combatSystem.getAttackableTerritoriesFrom(territoryId);
      } else {
        // Fallback: Find targets manually using game state
        const territory = this.combatSystem.gameState.territories[territoryId];
        const currentPlayer = this.combatSystem.gameState.getCurrentPlayer();

        if (
          territory &&
          territory.neighbors &&
          Array.isArray(territory.neighbors)
        ) {
          targets = territory.neighbors.filter((neighborId) => {
            const neighbor =
              this.combatSystem.gameState.territories[neighborId];
            return neighbor && neighbor.owner !== currentPlayer;
          });
        }
      }

      // Highlight all valid attack targets
      if (targets && Array.isArray(targets)) {
        console.log(`Highlighting ${targets.length} potential targets: ${targets.join(", ")}`);
        
        targets.forEach(targetId => {
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.classList.add('highlight-valid-target');
          }
        });
      } else {
        console.log("No valid targets found or targets not in expected format");
      }
    } catch (error) {
      console.warn("⚠️ Error highlighting attack targets:", error.message);
      // Continue execution, this is just a visual enhancement
    }
  }

  /**
   * Clear all attack highlights
   */
  clearAttackHighlights() {
    console.log("Clearing attack highlights");
    
    try {
      // Remove all highlight classes from territory elements
      const highlightClasses = [
        'highlight-attackable',
        'highlight-attacking-from',
        'highlight-selected-attacker',
        'highlight-valid-target',
        'highlight-selected-target'
      ];
      
      // Get all territory elements
      const territories = document.querySelectorAll('.territory');
      territories.forEach(territory => {
        highlightClasses.forEach(className => {
          territory.classList.remove(className);
        });
      });
    } catch (error) {
      console.warn("⚠️ Error clearing attack highlights:", error.message);
    }
  }
}
