// Script to deduplicate JSON keys in locale files
// Keeps the LAST occurrence of each duplicate key (most recent value)
const fs = require('fs');
const path = require('path');

function deduplicateJson(text) {
    // Parse JSON while tracking duplicates - we rebuild a clean object
    // We use a custom reviver approach: parse the text, find duplicate keys manually
    // Since JSON.parse keeps the last value for duplicate keys, we can just parse and re-stringify
    // But we need to preserve the structure, so let's parse and re-serialize
    const obj = JSON.parse(text);
    return JSON.stringify(obj, null, 2);
}

const files = ['en.json', 'cs.json', 'uk.json'];
const messagesDir = path.join(__dirname, '..', 'messages');

for (const file of files) {
    const filePath = path.join(messagesDir, file);
    console.log(`Processing ${file}...`);

    try {
        const text = fs.readFileSync(filePath, 'utf8');
        const deduplicated = deduplicateJson(text);
        fs.writeFileSync(filePath, deduplicated + '\n', 'utf8');

        // Verify
        JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`  ✓ ${file} deduplicated and valid`);
    } catch (err) {
        console.error(`  ✗ Error processing ${file}:`, err.message);
    }
}

console.log('\nDone!');
