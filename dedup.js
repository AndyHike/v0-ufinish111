const fs = require('fs');
const path = require('path');

const files = ['cs.json', 'en.json', 'uk.json'];

files.forEach(file => {
    const filePath = path.join(__dirname, 'messages', file);
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        fs.writeFileSync(filePath, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
        console.log(`Deduplicated ${file}`);
    } catch (err) {
        console.error(`Error processing ${file}:`, err);
    }
});
