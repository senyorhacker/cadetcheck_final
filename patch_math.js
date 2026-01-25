const fs = require('fs');
const path = 'public/math-quiz.html';

try {
    let content = fs.readFileSync(path, 'utf8');

    // 1. Inject Score Saving logic
    const scoreLogicTarget = 'const score = this.calculateScore();';
    const scoreLogicReplacement = `const score = this.calculateScore();
                                
                                // Save to Backend (Injected via patch)
                                if (typeof ClientAPI !== 'undefined') {
                                    const quiz = quizData[this.selectedQuiz];
                                    ClientAPI.saveGameResult(\`Math: \${quiz.title}\`, \`\${score.correct}/\${score.answers.length} (\${score.percentage}%)\`, 1);
                                }`;

    if (content.includes(scoreLogicTarget) && !content.includes('ClientAPI.saveGameResult(`Math:')) {
        content = content.replace(scoreLogicTarget, scoreLogicReplacement);
        console.log('Injected score saving logic.');
    } else {
        console.log('Score saving logic already present or target not found.');
    }

    // 2. Inject ClientAPI script
    const scriptTarget = '</body>';
    const scriptReplacement = '<script src="client-api.js"></script>\n</body>';

    if (content.includes(scriptTarget) && !content.includes('<script src="client-api.js"></script>')) {
        content = content.replace(scriptTarget, scriptReplacement);
        console.log('Injected client-api.js script.');
    } else {
        console.log('client-api.js script already present or target not found.');
    }

    fs.writeFileSync(path, content, 'utf8');
    console.log('Successfully patched math-quiz.html');

} catch (err) {
    console.error('Error:', err);
}
