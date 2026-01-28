const fs = require('fs');
const path = require('path');
let pdf = require('pdf-parse');
// Handle default export if present
if (pdf.default) pdf = pdf.default;

const KNOWLEDGE_DIR = path.join(__dirname, '../../knowledge-bank'); // Adjusted for where script runs
const INDEX_FILE = path.join(KNOWLEDGE_DIR, 'knowledge-index.json');

console.log('Target Dir:', KNOWLEDGE_DIR);

async function index() {
    if (!fs.existsSync(KNOWLEDGE_DIR)) {
        console.error('Dir not found');
        return;
    }
    const files = fs.readdirSync(KNOWLEDGE_DIR).filter(f => f.endsWith('.pdf') || f.endsWith('.txt'));
    console.log('Found files:', files.length);

    const newIndex = [];

    for (const file of files) {
        console.log('Processing:', file);
        const filePath = path.join(KNOWLEDGE_DIR, file);
        try {
            let summary = "";
            if (file.endsWith('.txt')) {
                summary = fs.readFileSync(filePath, 'utf-8').slice(0, 500);
            } else if (file.endsWith('.pdf')) {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                summary = data.text.slice(0, 500).replace(/\n+/g, ' ');
            }

            newIndex.push({
                id: file,
                title: file,
                summary: summary + '...',
                lastIndexed: new Date().toISOString()
            });
            console.log('Indexed:', file);
        } catch (e) {
            console.error('Failed:', file, e.message);
        }
    }

    fs.writeFileSync(INDEX_FILE, JSON.stringify(newIndex, null, 2));
    console.log('Done. Index written.');
}

index();
