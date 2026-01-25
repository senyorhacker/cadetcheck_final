// Cognitive Flexibility Game Configuration
const CONFIG = {
    TOTAL_LEVELS: 15,
    TRIALS_PER_LEVEL: 15,
    VALID_TRIALS: 6,      // Enter reaction area
    DISTRACTOR_TRIALS: 9, // Miss reaction area

    // Speed progression (pixels per second)
    SPEED_CONFIG: {
        '1-3': 120,
        '4-6': 150,
        '7-10': 216,  // 1.2x faster (180 * 1.2)
        '11-15': 330  // 1.5x faster for final levels
    },

    TRANSITION_TIME: 8000,  // 8 seconds
    FEEDBACK_TIME: 800,     // Feedback display
    INTER_TRIAL_DELAY: 500  // Between trials
};

// Rule definitions
const RULES = {
    1: {
        name: "RULE 1",
        circles: { green: 'ArrowRight', red: 'ArrowLeft' },
        rectangles: { red: 'ArrowUp', green: 'ArrowDown' }
    },
    2: {
        name: "RULE 2",
        circles: { green: 'ArrowLeft', red: 'ArrowRight' },  // Reversed
        rectangles: { green: 'ArrowUp', red: 'ArrowDown' }   // Reversed
    }
};

// Game State
let currentLevel = 1;
let currentTrial = 0;
let currentRule = 1;
let score = { correct: 0, incorrect: 0 };
let reactionTimes = [];

// Trial state
let trial = {
    shape: null,
    color: null,
    isDistractor: false,
    keyPressed: false,
    pressedKey: null,
    startTime: 0,
    animationId: null
};

// DOM Elements
const elements = {
    transitionScreen: document.getElementById('transitionScreen'),
    gameScreen: document.getElementById('gameScreen'),
    transitionTitle: document.getElementById('transitionTitle'),
    transitionRule: document.getElementById('transitionRule'),
    countdown: document.getElementById('countdown'),
    currentRuleDisplay: document.getElementById('currentRuleDisplay'),
    reactionArea: document.getElementById('reactionArea'),
    feedbackOverlay: document.getElementById('feedbackOverlay'),
    feedbackText: document.getElementById('feedbackText'),
    scoreModal: document.getElementById('scoreModal'),
    currentLevel: document.getElementById('currentLevel'),
    currentTrial: document.getElementById('currentTrial'),
    scoreCount: document.getElementById('scoreCount'),
    nextLevelButton: document.getElementById('nextLevelButton'),
    retryButton: document.getElementById('retryButton'),
    backToLevelsButton: document.getElementById('backToLevelsButton')
};

// Event Listeners
// Event Listeners setup moved near handleInput definition for clarity
elements.nextLevelButton.addEventListener('click', nextLevel);
elements.retryButton.addEventListener('click', retryLevel);
elements.backToLevelsButton.addEventListener('click', () => {
    window.location.href = 'level-select-cognition.html?game=cognition-flexibility';
});

// Initialize
init();

function init() {
    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('level');

    if (levelParam) {
        const parsedLevel = parseInt(levelParam);
        if (parsedLevel >= 1 && parsedLevel <= CONFIG.TOTAL_LEVELS) {
            currentLevel = parsedLevel;
        }
    }

    resetLevel();
    showTransition(true); // Level start
}

function resetLevel() {
    currentTrial = 0;
    score = { correct: 0, incorrect: 0 };
    reactionTimes = [];
    currentRule = (currentLevel % 2 === 1) ? 1 : 2; // Alternate starting rule
    updateDisplays();
}

function updateDisplays() {
    elements.currentLevel.textContent = currentLevel;
    elements.currentTrial.textContent = currentTrial;
    elements.scoreCount.textContent = score.correct;
    elements.currentRuleDisplay.textContent = RULES[currentRule].name;
}

function showTransition(isLevelStart) {
    elements.transitionScreen.classList.remove('hidden');
    elements.gameScreen.classList.add('hidden');

    if (isLevelStart) {
        elements.transitionTitle.textContent = `LEVEL ${currentLevel}`;
    } else {
        elements.transitionTitle.textContent = '⚡ RULE CHANGE! ⚡';
    }

    displayRuleInTransition();
    startCountdown();
}

function displayRuleInTransition() {
    const rule = RULES[currentRule];
    elements.transitionRule.innerHTML = `
        <h3>${rule.name}</h3>
        <div class="rule-group">
            <h4>Circles (○):</h4>
            <div class="rule-item">
                <span class="shape-icon" style="color: #27ae60;">●</span>
                Green → ${getArrowSymbol(rule.circles.green)}
            </div>
            <div class="rule-item">
                <span class="shape-icon" style="color: #e74c3c;">●</span>
                Red → ${getArrowSymbol(rule.circles.red)}
            </div>
        </div>
        <div class="rule-group">
            <h4>Rectangles (▭):</h4>
            <div class="rule-item">
                <span class="shape-icon" style="color: #27ae60;">▮</span>
                Green → ${getArrowSymbol(rule.rectangles.green)}
            </div>
            <div class="rule-item">
                <span class="shape-icon" style="color: #e74c3c;">▮</span>
                Red → ${getArrowSymbol(rule.rectangles.red)}
            </div>
        </div>
    `;
}

function getArrowSymbol(key) {
    const arrows = {
        'ArrowUp': 'UP (↑)',
        'ArrowDown': 'DOWN (↓)',
        'ArrowLeft': 'LEFT (←)',
        'ArrowRight': 'RIGHT (→)'
    };
    return arrows[key] || key;
}

function startCountdown() {
    let count = 8;
    elements.countdown.textContent = `Starting in ${count}...`;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            elements.countdown.textContent = `Starting in ${count}...`;
        } else {
            clearInterval(interval);
            elements.transitionScreen.classList.add('hidden');
            elements.gameScreen.classList.remove('hidden');
            startTrial();
        }
    }, 1000);
}

function startTrial() {
    currentTrial++;
    updateDisplays();

    // Mid-level rule change
    if (currentTrial === 8) {
        currentRule = (currentRule === 1) ? 2 : 1;
        showTransition(false);
        return;
    }

    if (currentTrial > CONFIG.TRIALS_PER_LEVEL) {
        endLevel();
        return;
    }

    generateTrial();
    setTimeout(() => {
        createAndAnimateShape();
    }, CONFIG.INTER_TRIAL_DELAY);
}

function generateTrial() {
    const shapes = ['circle', 'rectangle'];
    const colors = ['red', 'green'];

    // Dynamic Distractor Chance increasing with level
    // Level 1: 30% distractor, Level 15: 60% distractor
    const baseChance = 0.3;
    const levelFactor = (currentLevel / CONFIG.TOTAL_LEVELS) * 0.3;
    const distractorChance = baseChance + levelFactor;

    const isDistractor = Math.random() < distractorChance;

    trial = {
        shape: shapes[Math.floor(Math.random() * 2)],
        color: colors[Math.floor(Math.random() * 2)],
        isDistractor: isDistractor,
        isFakeApproach: isDistractor && Math.random() < 0.6, // 60% of distractors are the new "Approaching Fake" type
        keyPressed: false,
        pressedKey: null,
        startTime: 0,
        hasEnteredArea: false,
        animationId: null
    };
}

function createAndAnimateShape() {
    const shapeEl = document.createElement('div');
    shapeEl.className = `shape ${trial.shape} ${trial.color}`;

    const speed = getSpeed();
    const reactionRect = elements.reactionArea.getBoundingClientRect();

    // Random spawn position and direction
    const spawnData = getSpawnData(trial.isDistractor, reactionRect, trial.isFakeApproach);

    shapeEl.style.left = spawnData.startX + 'px';
    shapeEl.style.top = spawnData.startY + 'px';

    elements.reactionArea.appendChild(shapeEl);

    // Animate
    animateShape(shapeEl, spawnData, speed);
}

function getSpawnData(isDistractor, rect, isFakeApproach) {
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    if (isDistractor) {
        if (isFakeApproach) {
            // NEW TYPE: Approach Center but Vanish/Stop at Boundary
            const side = Math.floor(Math.random() * 4);
            const startOffset = 300; // Start far away

            if (side === 0) { // From Top
                return { startX: centerX, startY: -startOffset, targetX: centerX, targetY: 0, direction: 'approach-top' };
            } else if (side === 1) { // From Right
                return { startX: width + startOffset, startY: centerY, targetX: width, targetY: centerY, direction: 'approach-right' };
            } else if (side === 2) { // From Bottom
                return { startX: centerX, startY: height + startOffset, targetX: centerX, targetY: height, direction: 'approach-bottom' };
            } else { // From Left
                return { startX: -startOffset, startY: centerY, targetX: 0, targetY: centerY, direction: 'approach-left' };
            }
        }

        // Other distractor types (Corner miss, Edge pass)
        const distractorType = Math.random();
        // ... (Existing logic simplified for brevity or random)
        // Let's implement a simple random miss logic to complement
        const direction = Math.floor(Math.random() * 4);
        if (direction === 0) return { startX: -100, startY: -100, targetX: width + 100, targetY: -100, direction: 'miss-top' };
        if (direction === 1) return { startX: width + 100, startY: -100, targetX: width + 100, targetY: height + 100, direction: 'miss-right' };
        if (direction === 2) return { startX: width + 100, startY: height + 100, targetX: -100, targetY: height + 100, direction: 'miss-bottom' };
        return { startX: -100, startY: height + 100, targetX: -100, targetY: -100, direction: 'miss-left' };

    } else {
        // VALID TRIALS: Pass through center
        const direction = Math.floor(Math.random() * 4);
        if (direction === 0) return { startX: centerX, startY: -250, targetX: centerX, targetY: height + 250, direction: 'down' };
        if (direction === 1) return { startX: -250, startY: centerY, targetX: width + 250, targetY: centerY, direction: 'right' };
        if (direction === 2) return { startX: width + 250, startY: centerY, targetX: -250, targetY: centerY, direction: 'left' };
        return { startX: centerX, startY: height + 250, targetX: centerX, targetY: -250, direction: 'up' };
    }
}

function animateShape(shapeEl, spawnData, speed) {
    const animStartTime = performance.now();
    const distance = Math.sqrt(
        Math.pow(spawnData.targetX - spawnData.startX, 2) +
        Math.pow(spawnData.targetY - spawnData.startY, 2)
    );
    const duration = (distance / speed) * 1000;
    const reactionRect = elements.reactionArea.getBoundingClientRect();

    function animate(currentTime) {
        const elapsed = currentTime - animStartTime;
        const progress = Math.min(elapsed / duration, 1);

        const currentX = spawnData.startX + (spawnData.targetX - spawnData.startX) * progress;
        const currentY = spawnData.startY + (spawnData.targetY - spawnData.startY) * progress;

        shapeEl.style.left = currentX + 'px';
        shapeEl.style.top = currentY + 'px';

        // Fake Approach Effect: Fade out near the end
        if (trial.isFakeApproach) {
            if (progress > 0.7) {
                const opacity = 1 - ((progress - 0.7) / 0.3); // Fade from 0.7 to 1.0
                shapeEl.style.opacity = Math.max(0, opacity);
            }
        }

        // Check if shape has entered reaction area (for valid trials)
        if (!trial.isDistractor && !trial.hasEnteredArea) {
            const isInsideX = currentX >= 0 && currentX <= reactionRect.width;
            const isInsideY = currentY >= 0 && currentY <= reactionRect.height;
            // Also relax condition slightly to ensure it counts entering
            const centerX = currentX + 25; // approx center of shape (50px)
            const centerY = currentY + 25;
            const isIn = centerX > 0 && centerX < reactionRect.width && centerY > 0 && centerY < reactionRect.height;

            if (isIn) {
                trial.hasEnteredArea = true;
                trial.startTime = Date.now();
            }
        }

        if (progress < 1) {
            trial.animationId = requestAnimationFrame(animate);
        } else {
            endTrial(shapeEl);
        }
    }

    trial.animationId = requestAnimationFrame(animate);
}

function getSpeed() {
    if (currentLevel <= 3) return CONFIG.SPEED_CONFIG['1-3'];
    if (currentLevel <= 6) return CONFIG.SPEED_CONFIG['4-6'];
    if (currentLevel <= 10) return CONFIG.SPEED_CONFIG['7-10'];
    return CONFIG.SPEED_CONFIG['11-15'];
}

// Event Listeners
document.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        handleInput(e.key);
    }
});

// Touch Controls
const controlKeys = document.querySelectorAll('.control-key');
controlKeys.forEach(keyEl => {
    // Handle both touch and click for robustness, but prevent double firing
    const triggerInput = (e) => {
        e.preventDefault(); // Prevent ghost clicks
        const symbol = keyEl.textContent.trim();
        let key = '';
        if (symbol === '↑') key = 'ArrowUp';
        if (symbol === '↓') key = 'ArrowDown';
        if (symbol === '←') key = 'ArrowLeft';
        if (symbol === '→') key = 'ArrowRight';

        if (key) handleInput(key);
    };

    keyEl.addEventListener('touchstart', triggerInput, { passive: false });
    keyEl.addEventListener('mousedown', triggerInput); // Fallback for mouse users
});

function handleInput(key) {
    if (trial.keyPressed) return; // Only first press counts
    if (elements.transitionScreen.classList.contains('hidden') === false) return;

    trial.keyPressed = true;
    trial.pressedKey = key;

    // Visual feedback on key
    highlightKey(key);

    // Validate immediately
    validateResponse();
}

// Kept for reference but not direct listener anymore
function handleKeyPress(e) {
    // Legacy function replaced by anonymous listener above calling handleInput
}

function highlightKey(key) {
    const keyMap = {
        'ArrowUp': 0,
        'ArrowLeft': 0, // Note: The HTML structure might have different indices. 
        // HTML: ↑ (Up) is separated. Row has ← ↓ →.
        // Let's refactor selector to find by content or robust index.
    };

    // Better way: Find element by content map
    const symbolMap = {
        'ArrowUp': '↑',
        'ArrowDown': '↓',
        'ArrowLeft': '←',
        'ArrowRight': '→'
    };

    const targetSymbol = symbolMap[key];
    const keys = document.querySelectorAll('.control-key');

    keys.forEach(k => {
        if (k.textContent.trim() === targetSymbol) {
            k.classList.add('pressed');
            setTimeout(() => k.classList.remove('pressed'), 150);
        }
    });
}

function validateResponse() {
    if (trial.isDistractor) {
        // Should NOT press
        showFeedback('⚠ DON\'T PRESS! (Distractor)', 'warning');
        score.incorrect++;
    } else {
        // Should press correct key
        const correctKey = getCorrectKey();
        if (trial.pressedKey === correctKey) {
            const reactionTime = Date.now() - trial.startTime;
            reactionTimes.push(reactionTime);
            showFeedback(`✓ CORRECT! (+${reactionTime}ms)`, 'correct');
            score.correct++;
        } else {
            showFeedback('✗ WRONG KEY!', 'incorrect');
            score.incorrect++;
        }
    }

    updateDisplays();
}

function getCorrectKey() {
    const rule = RULES[currentRule];
    if (trial.shape === 'circle') {
        return rule.circles[trial.color];
    } else {
        return rule.rectangles[trial.color];
    }
}

function showFeedback(message, type) {
    elements.feedbackText.textContent = message;
    elements.feedbackOverlay.className = `feedback-overlay ${type}`;

    setTimeout(() => {
        elements.feedbackOverlay.classList.add('hidden');
    }, CONFIG.FEEDBACK_TIME);
}

function endTrial(shapeEl) {
    if (trial.animationId) {
        cancelAnimationFrame(trial.animationId);
    }

    // Check if no key was pressed for valid trial
    if (!trial.isDistractor && !trial.keyPressed) {
        showFeedback('✗ MISSED!', 'incorrect');
        score.incorrect++;
        updateDisplays();
    }

    // Remove shape
    if (shapeEl && shapeEl.parentNode) {
        shapeEl.parentNode.removeChild(shapeEl);
    }

    // Next trial
    setTimeout(() => {
        startTrial();
    }, CONFIG.FEEDBACK_TIME + CONFIG.INTER_TRIAL_DELAY);
}

function endLevel() {
    showScoreModal();
}

function showScoreModal() {
    const total = score.correct + score.incorrect;
    const successRate = total > 0 ? (score.correct / total) : 0;
    const avgReaction = reactionTimes.length > 0
        ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
        : 0;

    document.getElementById('scoreLevel').textContent = currentLevel;
    document.getElementById('modalCorrect').textContent = score.correct;
    document.getElementById('modalIncorrect').textContent = score.incorrect;
    document.getElementById('modalSuccess').textContent = `${Math.round(successRate * 100)}%`;
    document.getElementById('modalAvgReaction').textContent = `${avgReaction}ms`;

    if (currentLevel >= CONFIG.TOTAL_LEVELS) {
        elements.nextLevelButton.style.display = 'none';
        elements.retryButton.textContent = 'Play Again';
    } else {
        elements.nextLevelButton.style.display = 'block';
        elements.retryButton.textContent = 'Retry';
    }

    elements.scoreModal.classList.remove('hidden');
}

function nextLevel() {
    elements.scoreModal.classList.add('hidden');
    if (currentLevel < CONFIG.TOTAL_LEVELS) {
        currentLevel++;
        resetLevel();
        showTransition(true);
    }
}

function retryLevel() {
    elements.scoreModal.classList.add('hidden');
    resetLevel();
    showTransition(true);
}
