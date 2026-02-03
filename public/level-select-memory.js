// Level selection for Verbal Memory Test
const TOTAL_LEVELS = 15;

document.addEventListener('DOMContentLoaded', () => {
    generateLevelButtons();
});

function generateLevelButtons() {
    const levelsGrid = document.getElementById('levelsGrid');

    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const levelButton = document.createElement('button');
        levelButton.className = 'level-button';
        levelButton.innerHTML = `
            <span class="level-number">${i}</span>
            <span class="level-label">Level</span>
        `;

        levelButton.addEventListener('click', () => {
            startLevel(i);
        });

        levelsGrid.appendChild(levelButton);
    }

    // Add Exam Mode Button
    const examButton = document.createElement('button');
    examButton.className = 'level-button exam-mode';
    examButton.style.background = 'linear-gradient(135deg, #e74c3c, #c0392b)';
    examButton.style.borderColor = '#c0392b';
    examButton.innerHTML = `
        <span class="level-number">🎓</span>
        <span class="level-label">EXAM MODE</span>
    `;
    examButton.addEventListener('click', () => {
        window.location.href = `memory-game.html?level=exam`;
    });
    levelsGrid.appendChild(examButton);
}

function startLevel(levelNumber) {
    window.location.href = `memory-game.html?level=${levelNumber}`;
}
