import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ukJsonPath = path.join(__dirname, '../messages/uk.json');

console.log('Reading uk.json file...');
const content = fs.readFileSync(ukJsonPath, 'utf-8');

console.log(`File size: ${content.length} bytes`);
console.log(`Last 200 characters: ${content.slice(-200)}`);

try {
  const parsed = JSON.parse(content);
  console.log('JSON is valid!');
  
  // Write back the JSON with proper formatting
  const formatted = JSON.stringify(parsed, null, 2);
  fs.writeFileSync(ukJsonPath, formatted + '\n', 'utf-8');
  console.log('JSON file has been reformatted and saved.');
} catch (error) {
  console.error('JSON parsing error:', error.message);
  console.error('Error position:', error);
  
  // Try to find the issue
  const lines = content.split('\n');
  console.log(`\nTotal lines: ${lines.length}`);
  console.log(`Line 1089: ${lines[1088]}`);
  console.log(`Line 1090: ${lines[1089]}`);
  console.log(`Line 1091: ${lines[1090]}`);
  if (lines[1091]) console.log(`Line 1092: ${lines[1091]}`);
}
