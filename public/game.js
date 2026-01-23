// Game Configuration
const CONFIG = {
    CANVAS_WIDTH: 800,
    CANVAS_HEIGHT: 600,
    GRAY_BOX: {
        x: 200,
        y: 150,
        width: 400,
        height: 300
    },
    BALL_RADIUS: 20,
    LINE_WIDTH: 4,
    TRIALS_PER_LEVEL: 10,
    TOTAL_LEVELS: 15,
    BASE_SPEED: 75,
    MAX_SPEED: 300
};

// Game State
let currentLevel = 1;
let currentTrial = 0;
let score = {
    correct: 0,
    incorrect: 0,
    reactionTimes: []
};

// Current trial data
let trial = {
    lineColor: null,
    lineOrientation: null,
    balls: [],
    startTime: null,
    expectedTime: null,
    expectedButton: null,
    hasResponded: false
};

// Canvas and animation
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let animationId = null;
let lastTimestamp = 0;

// DOM Elements
const buttons = {
    red: document.getElementById('redButton'),
    black: document.getElementById('blackButton'),
    yellow: document.getElementById('yellowButton'),
    nextLevel: document.getElementById('nextLevelButton'),
    retry: document.getElementById('retryButton'),
    backToLevels: document.getElementById('backToLevelsButton')
};

const feedbackOverlay = document.getElementById('feedbackOverlay');
const scoreModal = document.getElementById('scoreModal');

// Event Listeners
buttons.red.addEventListener('click', () => handleButtonPress('red'));
buttons.black.addEventListener('click', () => handleButtonPress('black'));
buttons.yellow.addEventListener('click', () => handleButtonPress('yellow'));
buttons.nextLevel.addEventListener('click', nextLevel);
buttons.retry.addEventListener('click', retryLevel);
buttons.backToLevels.addEventListener('click', () => {
    window.location.href = 'level-select.html?game=sustained-attention';
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
        } else {
            currentLevel = 1;
        }
    }

    resetScore();
    updateLevelDisplay();
    startTrial();
}

function startTrial() {
    currentTrial++;
    updateTrialDisplay();

    trial = {
        lineColor: null,
        lineOrientation: null,
        balls: [],
        startTime: null,
        expectedTime: null,
        expectedButton: null,
        hasResponded: false
    };

    generateTrial();

    lastTimestamp = 0;
    trial.startTime = performance.now();

    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    animate(trial.startTime);
}

function generateTrial() {
    const lineTypes = [
        { color: 'black', orientation: 'vertical' },
        { color: 'red', orientation: 'horizontal' },
        { color: 'red', orientation: 'vertical' },
        { color: 'yellow', orientation: 'horizontal' },
        { color: 'yellow', orientation: 'vertical' }
    ];

    const lineType = lineTypes[Math.floor(Math.random() * lineTypes.length)];
    trial.lineColor = lineType.color;
    trial.lineOrientation = lineType.orientation;

    const speed = calculateSpeed(currentLevel);
    const box = CONFIG.GRAY_BOX;

    const colors = ['red', 'yellow'];
    if (Math.random() > 0.5) {
        colors.reverse();
    }

    if (trial.lineOrientation === 'horizontal') {
        const x = box.x + box.width * (0.3 + Math.random() * 0.4);

        trial.balls.push({
            color: colors[0],
            x: x,
            y: -CONFIG.BALL_RADIUS * 2,
            vx: 0,
            vy: speed,
            visible: true
        });

        trial.balls.push({
            color: colors[1],
            x: x,
            y: CONFIG.CANVAS_HEIGHT + CONFIG.BALL_RADIUS * 2,
            vx: 0,
            vy: -speed,
            visible: true
        });

        const lineY = box.y + box.height / 2;

        if (trial.lineColor === 'black') {
            const ball1 = trial.balls[0];
            const t1 = Math.abs((lineY - ball1.y) / ball1.vy);
            trial.expectedTime = t1 * 1000;
            trial.expectedButton = 'black';
        } else {
            const matchingBall = trial.balls.find(b => b.color === trial.lineColor);
            const exitY = matchingBall.vy > 0 ? box.y + box.height : box.y;
            trial.expectedTime = Math.abs((exitY - matchingBall.y) / matchingBall.vy) * 1000;
            trial.expectedButton = trial.lineColor;
        }

    } else {
        const y = box.y + box.height * (0.3 + Math.random() * 0.4);

        trial.balls.push({
            color: colors[0],
            x: -CONFIG.BALL_RADIUS * 2,
            y: y,
            vx: speed,
            vy: 0,
            visible: true
        });

        trial.balls.push({
            color: colors[1],
            x: CONFIG.CANVAS_WIDTH + CONFIG.BALL_RADIUS * 2,
            y: y,
            vx: -speed,
            vy: 0,
            visible: true
        });

        const lineX = box.x + box.width / 2;

        if (trial.lineColor === 'black') {
            const ball1 = trial.balls[0];
            const t1 = Math.abs((lineX - ball1.x) / ball1.vx);
            trial.expectedTime = t1 * 1000;
            trial.expectedButton = 'black';
        } else {
            const matchingBall = trial.balls.find(b => b.color === trial.lineColor);
            trial.expectedTime = Math.abs((lineX - matchingBall.x) / matchingBall.vx) * 1000;
            trial.expectedButton = trial.lineColor;
        }
    }
}

function calculateSpeed(level) {
    const progress = (level - 1) / (CONFIG.TOTAL_LEVELS - 1);
    return CONFIG.BASE_SPEED + (CONFIG.MAX_SPEED - CONFIG.BASE_SPEED) * progress;
}

function animate(timestamp) {
    const deltaTime = lastTimestamp ? (timestamp - lastTimestamp) / 1000 : 0;
    lastTimestamp = timestamp;

    trial.balls.forEach(ball => {
        ball.x += ball.vx * deltaTime;
        ball.y += ball.vy * deltaTime;

        const box = CONFIG.GRAY_BOX;
        if (ball.x >= box.x && ball.x <= box.x + box.width &&
            ball.y >= box.y && ball.y <= box.y + box.height) {
            ball.visible = false;
        } else {
            ball.visible = true;
        }
    });

    draw();

    const offScreenThreshold = CONFIG.BALL_RADIUS * 4;
    const allOffScreen = trial.balls.every(ball => {
        return ball.x < -offScreenThreshold || ball.x > CONFIG.CANVAS_WIDTH + offScreenThreshold ||
            ball.y < -offScreenThreshold || ball.y > CONFIG.CANVAS_HEIGHT + offScreenThreshold;
    });

    const elapsedTime = performance.now() - trial.startTime;

    if (allOffScreen && elapsedTime > 1000) {
        if (!trial.hasResponded) {
            recordResponse(false, 0);
        }
        setTimeout(() => {
            nextTrial();
        }, 100);
    } else {
        animationId = requestAnimationFrame(animate);
    }
}

function draw() {
    ctx.fillStyle = '#d4d4d4';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    const box = CONFIG.GRAY_BOX;
    ctx.fillStyle = '#999999';
    ctx.fillRect(box.x, box.y, box.width, box.height);

    ctx.strokeStyle = getColorHex(trial.lineColor);
    ctx.lineWidth = CONFIG.LINE_WIDTH;
    ctx.beginPath();

    if (trial.lineOrientation === 'horizontal') {
        const y = box.y + box.height / 2;
        ctx.moveTo(box.x, y);
        ctx.lineTo(box.x + box.width, y);
    } else {
        const x = box.x + box.width / 2;
        ctx.moveTo(x, box.y);
        ctx.lineTo(x, box.y + box.height);
    }

    ctx.stroke();

    trial.balls.forEach(ball => {
        if (ball.visible) {
            ctx.fillStyle = getColorHex(ball.color);
            ctx.beginPath();
            ctx.arc(ball.x, ball.y, CONFIG.BALL_RADIUS, 0, Math.PI * 2);
            ctx.fill();
        }
    });
}

function getColorHex(colorName) {
    const colors = {
        red: '#e74c3c',
        yellow: '#f39c12',
        black: '#2c3e50'
    };
    return colors[colorName] || '#000000';
}

function handleButtonPress(buttonColor) {
    if (trial.hasResponded) {
        return;
    }

    trial.hasResponded = true;

    const button = buttons[buttonColor];
    button.classList.add('pressed');
    setTimeout(() => button.classList.remove('pressed'), 300);

    const currentTime = performance.now();
    const reactionTime = currentTime - trial.startTime;
    const timingError = reactionTime - trial.expectedTime;

    const isCorrectButton = buttonColor === trial.expectedButton;

    showFeedback(isCorrectButton, timingError);
    recordResponse(isCorrectButton, reactionTime);

    setTimeout(() => {
        nextTrial();
    }, 900);
}

function showFeedback(isCorrect, timingError) {
    if (!isCorrect) {
        return;
    }

    let feedbackText = '';
    let feedbackClass = '';

    if (timingError < -200) {
        feedbackText = 'TOO FAST';
        feedbackClass = 'too-fast';
    } else if (timingError > 200) {
        feedbackText = 'TOO LATE';
        feedbackClass = 'too-late';
    } else {
        const sign = timingError > 0 ? '+' : '';
        feedbackText = `${sign}${Math.round(timingError)}ms`;
        feedbackClass = 'correct';
    }

    feedbackOverlay.textContent = feedbackText;
    feedbackOverlay.className = `feedback-overlay ${feedbackClass}`;

    setTimeout(() => {
        feedbackOverlay.classList.add('hidden');
    }, 800);
}

function recordResponse(isCorrect, reactionTime) {
    if (isCorrect) {
        score.correct++;
        score.reactionTimes.push(reactionTime);
    } else {
        score.incorrect++;
    }

    updateLiveScore();
}

function updateLiveScore() {
    document.getElementById('correctCount').textContent = score.correct;
}

function nextTrial() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    if (currentTrial >= CONFIG.TRIALS_PER_LEVEL) {
        endLevel();
    } else {
        startTrial();
    }
}

function endLevel() {
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }

    showScoreModal();
}

function showScoreModal() {
    const totalTrials = score.correct + score.incorrect;
    const successRate = totalTrials > 0 ? (score.correct / totalTrials) : 0;
    const avgReactionTime = score.reactionTimes.length > 0
        ? score.reactionTimes.reduce((a, b) => a + b, 0) / score.reactionTimes.length
        : 0;

    document.getElementById('scoreLevel').textContent = currentLevel;
    document.getElementById('modalCorrect').textContent = score.correct;
    document.getElementById('modalIncorrect').textContent = score.incorrect;
    document.getElementById('modalSuccess').textContent = `${Math.round(successRate * 100)}%`;
    document.getElementById('modalAvgTime').textContent = `${Math.round(avgReactionTime)}ms`;

    if (currentLevel >= CONFIG.TOTAL_LEVELS) {
        buttons.nextLevel.style.display = 'none';
        buttons.retry.textContent = 'Tekrar Oyna';
    } else {
        buttons.nextLevel.style.display = 'block';
        buttons.retry.textContent = 'Tekrar Dene';
    }

    scoreModal.classList.remove('hidden');
}

function nextLevel() {
    scoreModal.classList.add('hidden');
    if (currentLevel < CONFIG.TOTAL_LEVELS) {
        currentLevel++;
        currentTrial = 0;
        resetScore();
        updateLevelDisplay();
        startTrial();
    }
}

function retryLevel() {
    scoreModal.classList.add('hidden');
    currentTrial = 0;
    resetScore();
    startTrial();
}

function resetScore() {
    score = {
        correct: 0,
        incorrect: 0,
        reactionTimes: []
    };
    updateLiveScore();
}

function updateLevelDisplay() {
    document.getElementById('currentLevel').textContent = currentLevel;
}

function updateTrialDisplay() {
    document.getElementById('currentTrial').textContent = currentTrial;
}
