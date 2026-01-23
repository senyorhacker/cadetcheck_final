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
}

function startLevel(levelNumber) {
    window.location.href = `memory-game.html?level=${levelNumber}`;
}
