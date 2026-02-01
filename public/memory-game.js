// Memory Game Configuration
const CONFIG = {
    TOTAL_LEVELS: 15,
    QUESTIONS_PER_LEVEL: 10,

    // Level configurations
    LEVEL_CONFIG: {
        '1-4': { targetCount: 6, displayTime: 2000, answerTime: 10000 },
        '5-8': { targetCount: 7, displayTime: 1400, answerTime: 10000 },
        '9-10': { targetCount: 8, displayTime: 1200, answerTime: 10000 },
        '11-13': { targetCount: 9, displayTime: 1000, answerTime: 8000 },
        '14-15': { targetCount: 10, displayTime: 1000, answerTime: 8000 }
    },

    GAP_TIME: 500 // Time between numbers
};

// Game State
let currentLevel = 1;
let currentQuestion = 0;
let score = {
    correct: 0,
    incorrect: 0
};

// Current question data
let question = {
    sequence: [],
    correctAnswer: [],
    userAnswer: [],
    isAnswering: false
};

// DOM Elements
let elements = {};

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    initializeElements();
    attachEventListeners();
    init();
});

function initializeElements() {
    elements = {
        displayPhase: document.getElementById('displayPhase'),
        answerPhase: document.getElementById('answerPhase'),
        comparisonPhase: document.getElementById('comparisonPhase'),
        displayNumber: document.getElementById('displayNumber'),
        userAnswerDiv: document.getElementById('userAnswer'),
        submitBtn: document.getElementById('submitBtn'),
        backspaceBtn: document.getElementById('backspaceBtn'),
        scoreModal: document.getElementById('scoreModal'),
        currentLevel: document.getElementById('currentLevel'),
        currentQuestion: document.getElementById('currentQuestion'),
        correctCount: document.getElementById('correctCount'),
        correctAnswerDisplay: document.getElementById('correctAnswer'),
        userAnswerDisplay: document.getElementById('userAnswerDisplay'),
        resultIndicator: document.getElementById('resultIndicator'),
        nextLevelButton: document.getElementById('nextLevelButton'),
        retryButton: document.getElementById('retryButton'),
        backToLevelsButton: document.getElementById('backToLevelsButton')
    };
}

function attachEventListeners() {
    document.querySelectorAll('.numpad-button[data-number]').forEach(btn => {
        btn.addEventListener('click', () => addNumber(parseInt(btn.dataset.number)));
    });

    if (elements.backspaceBtn) elements.backspaceBtn.addEventListener('click', removeLastNumber);
    if (elements.submitBtn) elements.submitBtn.addEventListener('click', submitAnswer);
    if (elements.nextLevelButton) elements.nextLevelButton.addEventListener('click', nextLevel);
    if (elements.retryButton) elements.retryButton.addEventListener('click', retryLevel);
    if (elements.backToLevelsButton) elements.backToLevelsButton.addEventListener('click', () => {
        window.location.href = 'level-select-memory.html?game=verbal-memory';
    });
}

function init() {
    console.log("Initializing Memory Game...");

    // Clear the placeholder "5" to prove JS is active
    if (elements.displayNumber) {
        elements.displayNumber.textContent = '';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const levelParam = urlParams.get('level');

    if (levelParam) {
        const parsedLevel = parseInt(levelParam);
        if (parsedLevel >= 1 && parsedLevel <= CONFIG.TOTAL_LEVELS) {
            currentLevel = parsedLevel;
        }
    }

    resetScore();
    updateLevelDisplay();
    startQuestion();
}

function getLevelConfig(level) {
    if (level <= 4) return CONFIG.LEVEL_CONFIG['1-4'];
    if (level <= 8) return CONFIG.LEVEL_CONFIG['5-8'];
    if (level <= 10) return CONFIG.LEVEL_CONFIG['9-10'];
    if (level <= 13) return CONFIG.LEVEL_CONFIG['11-13'];
    return CONFIG.LEVEL_CONFIG['14-15'];
}

// Timeout management
let activeTimeouts = [];

function clearAllTimeouts() {
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts = [];
}

// Helper for async delay
const delay = (ms) => new Promise(resolve => {
    const id = setTimeout(resolve, ms);
    activeTimeouts.push(id);
});

function startQuestion() {
    console.log("Starting Question " + (currentQuestion + 1));
    clearAllTimeouts(); // Stop any running sequences
    currentQuestion++;
    updateQuestionDisplay();

    question = {
        sequence: [],
        correctAnswer: [],
        userAnswer: [],
        isAnswering: false
    };

    generateSequence();
    showPhase('display');

    // Start sequence display logic
    displaySequence().catch(err => {
        console.error("Critical error in displaySequence:", err);
    });
}

function generateSequence() {
    const config = getLevelConfig(currentLevel);
    const targetCount = config.targetCount;
    const extraNumbers = 4 + Math.floor(Math.random() * 5);
    const totalNumbers = targetCount + extraNumbers;

    let sequence = [];
    let correctAnswer = [];
    let attempts = 0;
    const maxAttempts = 1000;
    let success = false;

    while (attempts < maxAttempts) {
        attempts++;
        sequence = [];
        correctAnswer = [];

        let prev = Math.floor(Math.random() * 10);
        sequence.push(prev);
        correctAnswer.push(prev);

        for (let i = 1; i < totalNumbers; i++) {
            let num = Math.floor(Math.random() * 10);
            sequence.push(num);
            if (num > prev) {
                correctAnswer.push(num);
            }
            prev = num;
        }

        if (correctAnswer.length >= targetCount && correctAnswer.length <= targetCount + 2) {
            correctAnswer = correctAnswer.slice(0, targetCount);
            question.sequence = sequence;
            question.correctAnswer = correctAnswer;
            success = true;
            break;
        }
    }

    if (!success) {
        // Deterministic fallback
        sequence = [1];
        correctAnswer = [1];
        let prev = 1;
        for (let i = 0; i < targetCount - 1; i++) {
            let next = prev + 1;
            if (next > 9) next = 0;
            sequence.push(next);
            correctAnswer.push(next);
            prev = next;
        }
        while (sequence.length < totalNumbers) {
            sequence.push(0);
        }
        question.sequence = sequence;
        question.correctAnswer = correctAnswer;
        console.warn("Used fallback sequence generation");
    }
}

async function displaySequence() {
    const config = getLevelConfig(currentLevel);

    if (!question.sequence || question.sequence.length === 0) {
        console.error("No sequence generated!");
        return;
    }

    console.log("Displaying sequence...", question.sequence);

    // Initial delay before showing first number
    await delay(500);

    for (let i = 0; i < question.sequence.length; i++) {
        // Show number
        if (elements.displayNumber) {
            elements.displayNumber.textContent = question.sequence[i];
            elements.displayNumber.style.opacity = '1';
        }

        // Wait display time
        await delay(config.displayTime);

        // Hide number (blank)
        if (elements.displayNumber) {
            elements.displayNumber.textContent = '';
            // elements.displayNumber.style.opacity = '0'; // Optional visual effect
        }

        // Wait gap time
        await delay(CONFIG.GAP_TIME);
    }

    console.log("Sequence finished. Starting answer phase.");
    startAnswerPhase();
}

function startAnswerPhase() {
    question.isAnswering = true;
    showPhase('answer');
    updateUserAnswerDisplay();

    const config = getLevelConfig(currentLevel);

    // Start answer timer
    const id = setTimeout(() => {
        if (question.isAnswering) {
            submitAnswer();
        }
    }, config.answerTime);
    activeTimeouts.push(id);
}

function showPhase(phase) {
    if (elements.displayPhase) elements.displayPhase.classList.add('hidden');
    if (elements.answerPhase) elements.answerPhase.classList.add('hidden');
    if (elements.comparisonPhase) elements.comparisonPhase.classList.add('hidden');

    if (phase === 'display' && elements.displayPhase) {
        elements.displayPhase.classList.remove('hidden');
    } else if (phase === 'answer' && elements.answerPhase) {
        elements.answerPhase.classList.remove('hidden');
    } else if (phase === 'comparison' && elements.comparisonPhase) {
        elements.comparisonPhase.classList.remove('hidden');
    }
}

function addNumber(num) {
    if (!question.isAnswering) return;

    // input limit restriction removed as per user request
    question.userAnswer.push(num);
    updateUserAnswerDisplay();
}

function removeLastNumber() {
    if (!question.isAnswering) return;
    if (question.userAnswer.length === 0) return;

    question.userAnswer.pop();
    updateUserAnswerDisplay();
}

function updateUserAnswerDisplay() {
    if (!elements.userAnswerDiv) return;

    if (question.userAnswer.length === 0) {
        elements.userAnswerDiv.textContent = '';
        elements.userAnswerDiv.classList.add('empty');
    } else {
        elements.userAnswerDiv.textContent = question.userAnswer.join(' ');
        elements.userAnswerDiv.classList.remove('empty');
    }
}

function submitAnswer() {
    if (!question.isAnswering) return;
    question.isAnswering = false;

    const isCorrect = validateAnswer();
    if (isCorrect) score.correct++;
    else score.incorrect++;

    updateScoreDisplay();
    showComparison(isCorrect);
}

function validateAnswer() {
    const userAns = question.userAnswer;
    const correctAns = question.correctAnswer;

    if (userAns.length !== correctAns.length) return false;
    for (let i = 0; i < userAns.length; i++) {
        if (userAns[i] !== correctAns[i]) return false;
    }
    return true;
}

function showComparison(isCorrect) {
    showPhase('comparison');

    if (elements.correctAnswerDisplay) elements.correctAnswerDisplay.textContent = question.correctAnswer.join(' ');

    if (elements.userAnswerDisplay) {
        elements.userAnswerDisplay.textContent = question.userAnswer.length > 0
            ? question.userAnswer.join(' ')
            : '—';

        const userAnswerRow = elements.userAnswerDisplay.parentElement;
        if (isCorrect) {
            userAnswerRow.classList.add('correct');
            userAnswerRow.classList.remove('user-answer');
        } else {
            userAnswerRow.classList.remove('correct');
            userAnswerRow.classList.add('user-answer');
        }
    }

    if (elements.resultIndicator) {
        if (isCorrect) {
            elements.resultIndicator.className = 'result-indicator correct';
            elements.resultIndicator.innerHTML = `
                <span class="result-icon">✓</span>
                <span class="result-text">Doğru</span>
            `;
        } else {
            elements.resultIndicator.className = 'result-indicator incorrect';
            elements.resultIndicator.innerHTML = `
                <span class="result-icon">✗</span>
                <span class="result-text">Yanlış</span>
            `;
        }
    }

    const comparisonTime = currentLevel <= 10 ? 10000 : 8000;
    const compId = setTimeout(() => {
        if (currentQuestion >= CONFIG.QUESTIONS_PER_LEVEL) {
            endLevel();
        } else {
            startQuestion();
        }
    }, comparisonTime);
    activeTimeouts.push(compId);
}

function endLevel() {
    showScoreModal();
}

function showScoreModal() {
    const totalQuestions = score.correct + score.incorrect;
    const successRate = totalQuestions > 0 ? (score.correct / totalQuestions) : 0;
    const scoreVal = Math.round(successRate * 100);

    if (typeof ClientAPI !== 'undefined') {
        const gameName = "Verbal Memory";
        ClientAPI.saveGameResult(gameName, `${score.correct}/${totalQuestions} (${scoreVal}%)`, currentLevel);
    }

    if (elements.scoreModal) {
        document.getElementById('scoreLevel').textContent = currentLevel;
        document.getElementById('modalCorrect').textContent = score.correct;
        document.getElementById('modalIncorrect').textContent = score.incorrect;
        document.getElementById('modalSuccess').textContent = `${scoreVal}%`;

        if (currentLevel >= CONFIG.TOTAL_LEVELS) {
            if (elements.nextLevelButton) elements.nextLevelButton.style.display = 'none';
            if (elements.retryButton) elements.retryButton.textContent = 'Tekrar Oyna';
        } else {
            if (elements.nextLevelButton) elements.nextLevelButton.style.display = 'block';
            if (elements.retryButton) elements.retryButton.textContent = 'Tekrar Dene';
        }

        elements.scoreModal.classList.remove('hidden');
    }
}

function nextLevel() {
    if (elements.scoreModal) elements.scoreModal.classList.add('hidden');
    if (currentLevel < CONFIG.TOTAL_LEVELS) {
        currentLevel++;
        currentQuestion = 0;
        resetScore();
        updateLevelDisplay();
        startQuestion();
    }
}

function retryLevel() {
    if (elements.scoreModal) elements.scoreModal.classList.add('hidden');
    currentQuestion = 0;
    resetScore();
    startQuestion();
}

function resetScore() {
    score = { correct: 0, incorrect: 0 };
    updateScoreDisplay();
}

function updateLevelDisplay() {
    if (elements.currentLevel) elements.currentLevel.textContent = currentLevel;
}

function updateQuestionDisplay() {
    if (elements.currentQuestion) elements.currentQuestion.textContent = currentQuestion;
}

function updateScoreDisplay() {
    if (elements.correctCount) elements.correctCount.textContent = score.correct;
}
