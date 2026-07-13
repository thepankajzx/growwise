const fs = require('fs');

const freeContent = fs.readFileSync('C:/Users/user/Downloads/ATOMIC/atomic-habits-free-4 concepts-v3.md', 'utf-8');
const premiumContent = fs.readFileSync('C:/Users/user/Downloads/ATOMIC/the-habit-stress-test- PREMIUM.md', 'utf-8');

// Parse free concepts
const freeConceptsMatch = freeContent.split(/## Concept \\d+: /).slice(1);
const freeConcepts = freeConceptsMatch.map(c => {
    const titleMatch = c.match(/^(.*)\\r?\\n/);
    const title = titleMatch ? titleMatch[1].trim() : 'Unknown Concept';
    const markdown = c.substring(titleMatch ? titleMatch[0].length : 0).trim();
    return {
        title: title,
        markdown: markdown,
        isPremium: false
    };
});

// Parse premium concept
const premiumTitleMatch = premiumContent.match(/^# (.*)\\r?\\n/);
const premiumTitle = premiumTitleMatch ? premiumTitleMatch[1].trim() : 'The Habit Stress Test™';
const premiumMarkdown = premiumContent.replace(/^# .*\\r?\\n/, '').trim();

const premiumConcept = {
    title: premiumTitle,
    markdown: premiumMarkdown,
    isPremium: true
};

const allConcepts = [...freeConcepts, premiumConcept];

let dataJs = fs.readFileSync('data.js', 'utf-8');
const conceptsRegex = /concepts: \\[([\\s\\S]*?)\\]\\n\\s*}\\n\\s*\\]\\n\\s*\\}\\n\\];/;

const stringifiedConcepts = JSON.stringify(allConcepts, null, 4).replace(/\\n/g, '\\n                        ');
const newConceptsString = \concepts: \\\n            }\\n        ]\\n    }\\n];\;

dataJs = dataJs.replace(conceptsRegex, newConceptsString);
fs.writeFileSync('data.js', dataJs);
console.log('Successfully updated data.js');
