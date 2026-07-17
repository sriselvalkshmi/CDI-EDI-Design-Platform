const fs = require('fs');

const file = 'c:/Users/DELL/OneDrive/Attachments/CDI-EDI-Design-Platform/client/src/pages/EquationEditorPage.jsx';
const content = fs.readFileSync(file, 'utf8');

let stack = [];
let inString = null; // '"', "'", or '`'
let inComment = null; // 'line' or 'block'

for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1] || '';
    
    // Handle comments
    if (inComment === 'line') {
        if (char === '\n') inComment = null;
        continue;
    }
    if (inComment === 'block') {
        if (char === '*' && nextChar === '/') {
            inComment = null;
            i++;
        }
        continue;
    }
    if (inString) {
        if (char === '\\') {
            i++; // skip next char
        } else if (char === inString) {
            inString = null;
        }
        continue;
    }
    
    // Check for comments / strings start
    if (char === '/' && nextChar === '/') {
        inComment = 'line';
        i++;
        continue;
    }
    if (char === '/' && nextChar === '*') {
        inComment = 'block';
        i++;
        continue;
    }
    if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
    }
    
    // Bracket counting
    if (char === '(' || char === '{' || char === '[') {
        stack.push({ index: i, char });
    } else if (char === ')' || char === '}' || char === ']') {
        const matching = { ')': '(', '}': '{', ']': '[' }[char];
        if (stack.length > 0) {
            const top = stack[stack.length - 1];
            if (top.char === matching) {
                stack.pop();
            } else {
                const linesBefore = content.substring(0, item.index).split('\n');
                console.log(`Mismatch: found '${char}' but top of stack is '${top.char}' on line ${linesBefore.length}`);
                stack.pop();
            }
        } else {
            const linesBefore = content.substring(0, i).split('\n');
            console.log(`Extra closing '${char}' on line ${linesBefore.length}`);
        }
    }
}

stack.forEach(item => {
    const linesBefore = content.substring(0, item.index).split('\n');
    const lineNum = linesBefore.length;
    const colNum = linesBefore[linesBefore.length - 1].length + 1;
    const lines = content.split('\n');
    console.log(`Unclosed '${item.char}' on line ${lineNum}, col ${colNum}: "${lines[lineNum - 1].trim()}"`);
});
