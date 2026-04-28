const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'backend', 'serviceAccountKey.json');
const content = fs.readFileSync(filePath, 'utf8');

try {
    // If it's invalid JSON because of literal newlines, we need to fix it.
    // But if it's valid JSON with escaped \n, we just need to ensure they are single escapes.
    const json = JSON.parse(content);
    console.log("JSON is valid.");
} catch (e) {
    console.log("JSON is invalid:", e.message);
}
