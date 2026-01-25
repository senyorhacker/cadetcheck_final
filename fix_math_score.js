const fs = require('fs');
const path = 'public/math-quiz.html';

try {
    let content = fs.readFileSync(path, 'utf8');

    // Restore missing line
    // Look for renderResults() { followed loosely by // Save
    const regex = /renderResults\(\)\s*\{\s*\/\/\s*Save/g;

    if (regex.test(content)) {
        content = content.replace(regex, `renderResults() {
                                const score = this.calculateScore();
                                // Save`);
        console.log('Restored const score = ...');
        fs.writeFileSync(path, content, 'utf8');
        console.log('File updated.');
    } else {
        console.log('Pattern not found.');
    }

} catch (err) {
    console.error(err);
}
