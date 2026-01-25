// Memory Game Configuration
const CONFIG = {
    TOTAL_LEVELS: 15,
    QUESTIONS_PER_LEVEL: 10,

    // Level configurations
    LEVEL_CONFIG: {
        '1-5': { targetCount: 5, displayTime: 2000, answerTime: 10000 },
        '6-8': { targetCount: 8, displayTime: 1600, answerTime: 10000 },
        '9-10': { targetCount: 8, displayTime: 1200, answerTime: 10000 },
        '11-12': { targetCount: 9, displayTime: 1000, answerTime: 8000 },
        '13-15': { targetCount: 10, displayTime: 1000, answerTime: 8000 }
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
const elements = {
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

// Event Listeners
document.querySelectorAll('.numpad-button[data-number]').forEach(btn => {
    btn.addEventListener('click', () => addNumber(parseInt(btn.dataset.number)));
});

elements.backspaceBtn.addEventListener('click', removeLastNumber);
elements.submitBtn.addEventListener('click', submitAnswer);
elements.nextLevelButton.addEventListener('click', nextLevel);
elements.retryButton.addEventListener('click', retryLevel);
elements.backToLevelsButton.addEventListener('click', () => {
    window.location.href = 'level-select-memory.html?game=verbal-memory';
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

    resetScore();
    updateLevelDisplay();
    startQuestion();
}

function getLevelConfig(level) {
    if (level <= 5) return CONFIG.LEVEL_CONFIG['1-5'];
    if (level <= 10) return CONFIG.LEVEL_CONFIG['6-10'];
    if (level <= 12) return CONFIG.LEVEL_CONFIG['11-12'];
    return CONFIG.LEVEL_CONFIG['13-15'];
}

function startQuestion() {
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
    displaySequence();
}

function generateSequence() {
    const config = getLevelConfig(currentLevel);
    const targetCount = config.targetCount;

    // Total numbers to show (target + extra 4-8)
    const extraNumbers = 4 + Math.floor(Math.random() * 5);
    const totalNumbers = targetCount + extraNumbers;

    let sequence = [];
    let correctAnswer = [];

    // First number
    let prev = Math.floor(Math.random() * 10);
    sequence.push(prev);
    correctAnswer.push(prev);

    // Generate rest
    for (let i = 1; i < totalNumbers; i++) {
        let num = Math.floor(Math.random() * 10);
        sequence.push(num);

        if (num > prev) {
            correctAnswer.push(num);
        }
        prev = num;
    }

    // If we got more correct answers than needed, regenerate
    if (correctAnswer.length > targetCount + 2) {
        return generateSequence();
    }

    // If we got fewer than target, regenerate
    if (correctAnswer.length < targetCount) {
        return generateSequence();
    }

    // Trim to exact target count
    correctAnswer = correctAnswer.slice(0, targetCount);

    question.sequence = sequence;
    question.correctAnswer = correctAnswer;
}

function displaySequence() {
    const config = getLevelConfig(currentLevel);
    let index = 0;

    function showNext() {
        if (index >= question.sequence.length) {
            // Sequence done, move to answer phase
            setTimeout(() => {
                startAnswerPhase();
            }, CONFIG.GAP_TIME);
            return;
        }

        // Show number
        elements.displayNumber.textContent = question.sequence[index];

        setTimeout(() => {
            // Hide number (blank)
            elements.displayNumber.textContent = '';

            setTimeout(() => {
                index++;
                showNext();
            }, CONFIG.GAP_TIME);
        }, config.displayTime);
    }

    showNext();
}

function startAnswerPhase() {
    question.isAnswering = true;
    showPhase('answer');
    updateUserAnswerDisplay();

    const config = getLevelConfig(currentLevel);

    // Start answer timer
    setTimeout(() => {
        if (question.isAnswering) {
            submitAnswer();
        }
    }, config.answerTime);
}

function showPhase(phase) {
    elements.displayPhase.classList.add('hidden');
    elements.answerPhase.classList.add('hidden');
    elements.comparisonPhase.classList.add('hidden');

    if (phase === 'display') {
        elements.displayPhase.classList.remove('hidden');
    } else if (phase === 'answer') {
        elements.answerPhase.classList.remove('hidden');
    } else if (phase === 'comparison') {
        elements.comparisonPhase.classList.remove('hidden');
    }
}

function addNumber(num) {
    if (!question.isAnswering) return;

    const config = getLevelConfig(currentLevel);
    if (question.userAnswer.length >= config.targetCount) return;

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

    // Validate answer
    const isCorrect = validateAnswer();

    if (isCorrect) {
        score.correct++;
    } else {
        score.incorrect++;
    }

    updateScoreDisplay();
    showComparison(isCorrect);
}

function validateAnswer() {
    const userAns = question.userAnswer;
    const correctAns = question.correctAnswer;

    if (userAns.length !== correctAns.length) {
        return false;
    }

    for (let i = 0; i < userAns.length; i++) {
        if (userAns[i] !== correctAns[i]) {
            return false;
        }
    }

    return true;
}

function showComparison(isCorrect) {
    showPhase('comparison');

    // Display answers
    elements.correctAnswerDisplay.textContent = question.correctAnswer.join(' ');
    elements.userAnswerDisplay.textContent = question.userAnswer.length > 0
        ? question.userAnswer.join(' ')
        : '—';

    // Style user answer row
    const userAnswerRow = elements.userAnswerDisplay.parentElement;
    if (isCorrect) {
        userAnswerRow.classList.add('correct');
        userAnswerRow.classList.remove('user-answer');
    } else {
        userAnswerRow.classList.remove('correct');
        userAnswerRow.classList.add('user-answer');
    }

    // Update result indicator
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

    // Auto-proceed to next question
    const comparisonTime = currentLevel <= 10 ? 10000 : 8000;
    setTimeout(() => {
        if (currentQuestion >= CONFIG.QUESTIONS_PER_LEVEL) {
            endLevel();
        } else {
            startQuestion();
        }
    }, comparisonTime);
}

function endLevel() {
    showScoreModal();
}

function showScoreModal() {
    const totalQuestions = score.correct + score.incorrect;
    const successRate = totalQuestions > 0 ? (score.correct / totalQuestions) : 0;
    const scoreVal = Math.round(successRate * 100);

    // Save to Backend
    if (typeof ClientAPI !== 'undefined') {
        const gameName = "Verbal Memory";
        ClientAPI.saveGameResult(gameName, `${score.correct}/${totalQuestions} (${scoreVal}%)`, currentLevel);
    }

    document.getElementById('scoreLevel').textContent = currentLevel;
    document.getElementById('modalCorrect').textContent = score.correct;
    document.getElementById('modalIncorrect').textContent = score.incorrect;
    document.getElementById('modalSuccess').textContent = `${scoreVal}%`;

    if (currentLevel >= CONFIG.TOTAL_LEVELS) {
        elements.nextLevelButton.style.display = 'none';
        elements.retryButton.textContent = 'Tekrar Oyna';
    } else {
        elements.nextLevelButton.style.display = 'block';
        elements.retryButton.textContent = 'Tekrar Dene';
    }

    elements.scoreModal.classList.remove('hidden');
}

function nextLevel() {
    elements.scoreModal.classList.add('hidden');
    if (currentLevel < CONFIG.TOTAL_LEVELS) {
        currentLevel++;
        currentQuestion = 0;
        resetScore();
        updateLevelDisplay();
        startQuestion();
    }
}

function retryLevel() {
    elements.scoreModal.classList.add('hidden');
    currentQuestion = 0;
    resetScore();
    startQuestion();
}

function resetScore() {
    score = {
        correct: 0,
        incorrect: 0
    };
    updateScoreDisplay();
}

function updateLevelDisplay() {
    elements.currentLevel.textContent = currentLevel;
}

function updateQuestionDisplay() {
    elements.currentQuestion.textContent = currentQuestion;
}

function updateScoreDisplay() {
    elements.correctCount.textContent = score.correct;
}
