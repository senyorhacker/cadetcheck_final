// Corridor Game Configuration
const CONFIG = {
    TOTAL_LEVELS: 15,
    QUESTIONS_PER_LEVEL: 10,
    TOTAL_CORRIDORS: 10,

    // Level configurations
    LEVEL_CONFIG: {
        '1-5': { closedCorridors: 2, totalCities: 5, openCities: 2, answerTime: 20000 },
        '6-9': { closedCorridors: 3, totalCities: 7, openCities: 3, answerTime: 22000 },
        '10-13': { closedCorridors: 4, totalCities: 9, openCities: 4, answerTime: 25000 },
        '14-15': { closedCorridors: 5, totalCities: 11, openCities: 5, answerTime: 25000 }
    },

    DISPLAY_TIME: 9000,  // Corridor display time
    SPEECH_GAP: 2000,    // Gap between city announcements
    COMPARISON_TIME: 8000 // Before next question
};

// City List (65 cities, alphabetically arranged in 5 columns)
const CITIES = [
    'Amsterdam', 'Bishkek', 'Houston', 'Milan', 'Singapore',
    'Ankara', 'Bologna', 'Kathmandu', 'Montreal', 'Stockholm',
    'Ashgabat', 'Bombay', 'Kiev', 'Moscow', 'Stuttgart',
    'Baghdad', 'Boston', 'Lagos', 'Munich', 'Sydney',
    'Bahrain', 'Bremen', 'Lisbon', 'Paris', 'Tashkent',
    'Baku', 'Budapest', 'London', 'Phuket', 'Tokyo',
    'Bangkok', 'Dallas', 'Lyon', 'Porto', 'Toronto',
    'Basel', 'Delhi', 'Madrid', 'Prague', 'Tunis',
    'Batumi', 'Doha', 'Malaga', 'Riyadh', 'Valencia',
    'Beirut', 'Dubai', 'Malta', 'Rotterdam', 'Venice',
    'Belgrade', 'Dublin', 'Manchester', 'Salzburg', 'Vienna',
    'Berlin', 'Hamburg', 'Melbourne', 'Santiago', 'Zagreb',
    'Bilbao', 'Havana', 'Miami', 'Shanghai', 'Zurich'
];

// Game State
let currentLevel = 1;
let currentQuestion = 0;
let score = {
    correct: 0,
    incorrect: 0
};
let activeTimeouts = []; // Track timeouts to clear them

// Current question data
let question = {
    corridors: [],
    assignments: [],
    correctAnswer: [],
    userAnswer: []
};

// DOM Elements
const elements = {
    displayPhase: document.getElementById('displayPhase'),
    audioPhase: document.getElementById('audioPhase'),
    answerPhase: document.getElementById('answerPhase'),
    comparisonPhase: document.getElementById('comparisonPhase'),
    corridorsDisplay: document.getElementById('corridorsDisplay'),
    audioText: document.getElementById('audioText'),
    citiesGrid: document.getElementById('citiesGrid'),
    correctCitiesList: document.getElementById('correctCitiesList'),
    userCitiesList: document.getElementById('userCitiesList'),
    resultDisplay: document.getElementById('resultDisplay'),
    submitBtn: document.getElementById('submitBtn'),
    scoreModal: document.getElementById('scoreModal'),
    currentLevel: document.getElementById('currentLevel'),
    currentQuestion: document.getElementById('currentQuestion'),
    correctCount: document.getElementById('correctCount'),
    nextLevelButton: document.getElementById('nextLevelButton'),
    retryButton: document.getElementById('retryButton'),
    backToLevelsButton: document.getElementById('backToLevelsButton')
};

// Event Listeners
elements.submitBtn.addEventListener('click', () => submitAnswer(false)); // Manual submit
elements.nextLevelButton.addEventListener('click', nextLevel);
elements.retryButton.addEventListener('click', retryLevel);
elements.backToLevelsButton.addEventListener('click', () => {
    window.location.href = 'level-select-corridor.html?game=corridor-memory';
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

// Timeout Helper
function setTimeoutTracked(fn, delay) {
    const id = setTimeout(fn, delay);
    activeTimeouts.push(id);
    return id;
}

function clearAllTimeouts() {
    activeTimeouts.forEach(id => clearTimeout(id));
    activeTimeouts = [];
    window.speechSynthesis.cancel(); // Stop any pending speech
}

function getLevelConfig(level) {
    if (level <= 5) return CONFIG.LEVEL_CONFIG['1-5'];
    if (level <= 9) return CONFIG.LEVEL_CONFIG['6-9'];
    if (level <= 13) return CONFIG.LEVEL_CONFIG['10-13'];
    return CONFIG.LEVEL_CONFIG['14-15'];
}

function startQuestion() {
    clearAllTimeouts(); // Ensure fresh start for the question

    if (currentQuestion >= CONFIG.QUESTIONS_PER_LEVEL) {
        endLevel();
        return;
    }

    currentQuestion++;
    updateQuestionDisplay();

    question = {
        corridors: [],
        assignments: [],
        correctAnswer: [],
        userAnswer: []
    };

    generateCorridors();
    showPhase('display');
    displayCorridors();

    // After display time, move to audio phase
    setTimeoutTracked(() => {
        generateAssignments();
        playAudioSequence();
    }, CONFIG.DISPLAY_TIME);
}

function generateCorridors() {
    const config = getLevelConfig(currentLevel);
    const closedCount = config.closedCorridors;

    // All corridors start as open (true)
    let corridors = Array(CONFIG.TOTAL_CORRIDORS).fill(true);

    // Randomly select closed corridors
    let closedIndices = [];
    while (closedIndices.length < closedCount) {
        let idx = Math.floor(Math.random() * CONFIG.TOTAL_CORRIDORS);
        if (!closedIndices.includes(idx)) {
            closedIndices.push(idx);
            corridors[idx] = false; // closed
        }
    }

    question.corridors = corridors;
}

function displayCorridors() {
    elements.corridorsDisplay.innerHTML = '';

    for (let i = 0; i < CONFIG.TOTAL_CORRIDORS; i++) {
        const isOpen = question.corridors[i];
        const corridorNum = i + 1;

        const corridorRow = document.createElement('div');
        corridorRow.className = `corridor-row ${isOpen ? 'open' : 'closed'}`;
        corridorRow.innerHTML = `
            <div class="corridor-number">${corridorNum}. Corridor</div>
            <div class="corridor-line"></div>
            <div class="corridor-plane">✈️</div>
            <div class="corridor-status">${isOpen ? '✓' : '✗'}</div>
        `;

        elements.corridorsDisplay.appendChild(corridorRow);
    }
}

function generateAssignments() {
    const config = getLevelConfig(currentLevel);
    const totalCities = config.totalCities;

    // Shuffle and select cities unique for this question
    const shuffledCities = [...CITIES].sort(() => Math.random() - 0.5);
    const selectedCities = shuffledCities.slice(0, totalCities);

    let assignments = [];
    let correctAnswer = [];

    // Ensure we don't pick the same corridor for every city randomly if not intended,
    // but random is fine.
    for (let city of selectedCities) {
        // Random corridor (0-9)
        const corridorIdx = Math.floor(Math.random() * CONFIG.TOTAL_CORRIDORS);
        const corridorNum = corridorIdx + 1;
        const isOpen = question.corridors[corridorIdx];

        assignments.push({
            city: city,
            corridor: corridorNum,
            isOpen: isOpen
        });

        if (isOpen) {
            correctAnswer.push(city);
        }
    }

    question.assignments = assignments;
    question.correctAnswer = correctAnswer.sort(); // Sort alphabetically
}

function playAudioSequence() {
    showPhase('audio');

    // Don't show text - purely audio test
    elements.audioText.textContent = 'Listening...';
    window.speechSynthesis.cancel(); // Clear any previous speech

    // Helper to get best English voice
    function getBestVoice() {
        const voices = speechSynthesis.getVoices();
        // Priority list for clear English voices
        const priorityPatterns = [
            /Google US English/i,
            /Google UK English Female/i,
            /Microsoft Zira/i, // Windows High Quality
            /Samantha/i,       // Mac
            /Daniel/i,         // Mac
            /en-US/i,          // Generic US English
            /en-GB/i           // Generic UK English
        ];

        for (let pattern of priorityPatterns) {
            const found = voices.find(v => pattern.test(v.name));
            if (found) return found;
        }

        // Fallback to any English voice
        return voices.find(v => v.lang.startsWith('en')) || null;
    }

    // Ensure voices are loaded (Chrome quirk)
    if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => { };
    }

    let index = 0;

    // Create a safety flag to stop speaking if phase changes
    let isSpeaking = true;

    function speakNext() {
        if (!isSpeaking) return;

        if (index >= question.assignments.length) {
            // Audio done, move to answer phase
            setTimeoutTracked(() => {
                startAnswerPhase();
            }, 500);
            return;
        }

        const assignment = question.assignments[index];
        // "To [City], on Corridor [Number]"
        const text = `To ${assignment.city}, on Corridor ${assignment.corridor}`;

        const utterance = new SpeechSynthesisUtterance(text);

        // Voice Selection
        const bestVoice = getBestVoice();
        if (bestVoice) {
            utterance.voice = bestVoice;
        }

        utterance.lang = 'en-US';
        utterance.rate = 0.75; // Slower for clarity
        utterance.pitch = 1.0;
        utterance.volume = 1.1; // Slightly louder

        utterance.onend = () => {
            if (isSpeaking) {
                setTimeoutTracked(() => {
                    index++;
                    speakNext();
                }, CONFIG.SPEECH_GAP);
            }
        };

        utterance.onerror = (e) => {
            console.error("Speech error", e);
            if (isSpeaking) {
                setTimeoutTracked(() => {
                    index++;
                    speakNext();
                }, CONFIG.SPEECH_GAP);
            }
        }

        window.speechSynthesis.cancel(); // Ensure clear before speak
        window.speechSynthesis.speak(utterance);
    }

    // Wait a brief moment for voices to be ready if first load
    if (speechSynthesis.getVoices().length === 0) {
        setTimeoutTracked(speakNext, 100);
    } else {
        speakNext();
    }
}

function generateCityCheckboxes() {
    elements.citiesGrid.innerHTML = '';

    CITIES.forEach(city => {
        const checkboxDiv = document.createElement('div');
        checkboxDiv.className = 'city-checkbox';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `city-${city}`;
        checkbox.value = city;

        const label = document.createElement('label');
        label.htmlFor = `city-${city}`;
        label.textContent = city;

        checkboxDiv.appendChild(checkbox);
        checkboxDiv.appendChild(label);
        elements.citiesGrid.appendChild(checkboxDiv);
    });
}

function startAnswerPhase() {
    showPhase('answer');

    // Clear previous selections
    document.querySelectorAll('.city-checkbox input').forEach(cb => {
        cb.checked = false;
    });

    generateCityCheckboxes(); // Refresh grid just in case

    // Start answer timer
    const config = getLevelConfig(currentLevel);
    setTimeoutTracked(() => {
        submitAnswer(true); // Auto submit
    }, config.answerTime);
}

function showPhase(phase) {
    elements.displayPhase.classList.add('hidden');
    elements.audioPhase.classList.add('hidden');
    elements.answerPhase.classList.add('hidden');
    elements.comparisonPhase.classList.add('hidden');

    if (phase === 'display') {
        elements.displayPhase.classList.remove('hidden');
    } else if (phase === 'audio') {
        elements.audioPhase.classList.remove('hidden');
    } else if (phase === 'answer') {
        elements.answerPhase.classList.remove('hidden');
    } else if (phase === 'comparison') {
        elements.comparisonPhase.classList.remove('hidden');
    }
}

function submitAnswer(auto = false) {
    // Prevent double submission if manually clicked right before timeout
    if (elements.answerPhase.classList.contains('hidden')) return;

    // Get selected cities
    const selectedCheckboxes = document.querySelectorAll('.city-checkbox input:checked');
    question.userAnswer = Array.from(selectedCheckboxes).map(cb => cb.value).sort();

    // Validate
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

    // Stop loops
    clearAllTimeouts();

    // Display correct answer
    elements.correctCitiesList.innerHTML = '';
    question.correctAnswer.forEach(city => {
        const tag = document.createElement('div');
        tag.className = 'city-tag';
        tag.textContent = city;
        elements.correctCitiesList.appendChild(tag);
    });

    // Display user answer
    elements.userCitiesList.innerHTML = '';
    if (question.userAnswer.length === 0) {
        elements.userCitiesList.innerHTML = '<div class="city-tag">—</div>';
    } else {
        question.userAnswer.forEach(city => {
            const tag = document.createElement('div');
            tag.className = `city-tag ${question.correctAnswer.includes(city) ? 'correct' : ''}`;
            tag.textContent = city;
            elements.userCitiesList.appendChild(tag);
        });
    }

    // Display result
    elements.resultDisplay.className = `result-display ${isCorrect ? 'correct' : 'incorrect'}`;
    elements.resultDisplay.innerHTML = `
        <div class="result-icon">${isCorrect ? '✓' : '✗'}</div>
        <div class="result-text">${isCorrect ? 'Doğru' : 'Yanlış'}</div>
    `;

    // Proceed to next question after delay
    setTimeoutTracked(() => {
        startQuestion();
    }, CONFIG.COMPARISON_TIME);
}

function endLevel() {
    clearAllTimeouts();
    showScoreModal();
}

function showScoreModal() {
    const totalQuestions = score.correct + score.incorrect;
    const successRate = totalQuestions > 0 ? (score.correct / totalQuestions) : 0;

    document.getElementById('scoreLevel').textContent = currentLevel;
    document.getElementById('modalCorrect').textContent = score.correct;
    document.getElementById('modalIncorrect').textContent = score.incorrect;
    document.getElementById('modalSuccess').textContent = `${Math.round(successRate * 100)}%`;

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
