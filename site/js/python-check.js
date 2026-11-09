/* ======================================================================
   PYTHON CODE CHECKER
   Finds common mistakes in the code editor before it is turned into
   blocks, and reports them the way Python would — error type, message,
   caret position — plus a plain-language suggestion and, where the
   intent is clear, a ready-made fix.
====================================================================== */

class PyCodeError extends Error {
  constructor({type = 'SyntaxError', line, column = 0, message, hint = '', fix = null}){
    super(`Line ${line}: ${message}`);
    this.name = type;
    this.pyType = type;      // SyntaxError, IndentationError, TabError, NameError, … or Unsupported
    this.line = line;        // 1-based line number in the editor
    this.column = column;    // 0-based column in that line, for the ^ caret
    this.pyMessage = message;
    this.hint = hint;
    this.fix = fix;          // { line, lines }: replace editor line `line` with `lines`
  }
}

const PY_KEYWORDS = ['if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'is',
  'import', 'from', 'as', 'pass', 'def', 'return', 'class', 'try', 'except', 'finally',
  'with', 'lambda', 'break', 'continue', 'global', 'del', 'True', 'False', 'None'];
const PY_BLOCK_KEYWORDS = ['if', 'elif', 'else', 'for', 'while'];
const PY_HEADER_PATTERN = /^(if|elif|else|for|while|def|class|try|except|finally|with)\b/;
// Functions the block editor understands — used to spot misspellings.
const PY_EDITOR_FUNCTIONS = ['print', 'input', 'int', 'float', 'str', 'bool', 'range', 'type'];
// Real Python built-ins that must never be "corrected" into something else.
const PY_BUILTINS = ['abs', 'all', 'any', 'bin', 'chr', 'dict', 'dir', 'divmod', 'enumerate',
  'eval', 'exec', 'exit', 'filter', 'format', 'hash', 'help', 'hex', 'id', 'isinstance', 'iter',
  'len', 'list', 'map', 'max', 'min', 'next', 'object', 'oct', 'open', 'ord', 'pow', 'quit',
  'repr', 'reversed', 'round', 'set', 'sorted', 'sum', 'super', 'tuple', 'vars', 'zip'];
const PY_CLOSERS = {'(': ')', '[': ']', '{': '}'};
const PY_OPENERS = {')': '(', ']': '[', '}': '{'};

/* Damerau (optimal string alignment) distance: typo-tolerant word comparison. */
function editDistance(a, b){
  const d = Array.from({length: a.length + 1}, (_, i) => [i, ...new Array(b.length).fill(0)]);
  for(let j = 1; j <= b.length; j++) d[0][j] = j;
  for(let i = 1; i <= a.length; i++){
    for(let j = 1; j <= b.length; j++){
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
      if(i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]){
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
      }
    }
  }
  return d[a.length][b.length];
}

function closestWord(word, candidates){
  if(word.length < 2) return null;
  const limit = word.length <= 3 ? 1 : 2;
  let best = null;
  let bestDistance = Infinity;
  for(const candidate of candidates){
    if(candidate === word) return null;
    const distance = word.toLowerCase() === candidate.toLowerCase() ? 0.5 : editDistance(word, candidate);
    if(distance < bestDistance){ best = candidate; bestDistance = distance; }
  }
  return bestDistance <= limit ? best : null;
}

/* Walk a line once: blank out string contents and comments (so later checks
   only see code) and verify that quotes and brackets are balanced. */
function scanPythonLine(text){
  const stack = [];
  let masked = '';
  let quote = null;
  let quoteStart = -1;
  let depthAtQuote = 0;
  for(let i = 0; i < text.length; i++){
    const ch = text[i];
    if(quote){
      if(ch === '\\' && i + 1 < text.length){ masked += '  '; i++; continue; }
      if(ch === quote){ quote = null; masked += ch; } else { masked += ' '; }
      continue;
    }
    if(ch === '#'){ masked += ' '.repeat(text.length - i); break; }
    if(ch === '"' || ch === "'"){
      quote = ch; quoteStart = i; depthAtQuote = stack.length;
      masked += ch;
      continue;
    }
    if(PY_CLOSERS[ch]) stack.push({ch, pos: i});
    if(PY_OPENERS[ch]){
      const open = stack.pop();
      if(!open) return {masked, error: {kind: 'unmatched', ch, pos: i}};
      if(open.ch !== PY_OPENERS[ch]){
        // e.g. print(snacks[0) — the ")" is fine, the "]" before it is missing.
        const outer = stack[stack.length - 1];
        return {masked, error: {kind: 'mismatch', ch, pos: i, open, missingOnly: !!outer && outer.ch === PY_OPENERS[ch]}};
      }
    }
    masked += ch;
  }
  if(quote) return {masked, error: {kind: 'unterminated', quote, pos: quoteStart, depthAtQuote}};
  if(stack.length) return {masked, error: {kind: 'unclosed', stack}};
  return {masked, error: null};
}

function bracketProblem(text, e, lineNumber){
  if(e.kind === 'unmatched'){
    return {
      message: `unmatched '${e.ch}'`,
      column: e.pos,
      hint: `This \`${e.ch}\` has no opening \`${PY_OPENERS[e.ch]}\` before it. Remove it, or add the missing \`${PY_OPENERS[e.ch]}\`.`,
      fixText: text.slice(0, e.pos) + text.slice(e.pos + 1)
    };
  }
  if(e.kind === 'mismatch'){
    const expected = PY_CLOSERS[e.open.ch];
    return {
      message: `closing parenthesis '${e.ch}' does not match opening parenthesis '${e.open.ch}'`,
      column: e.pos,
      hint: `Brackets close in reverse order. The \`${e.open.ch}\` opened earlier needs a \`${expected}\` here.`,
      fixText: text.slice(0, e.pos) + expected + text.slice(e.missingOnly ? e.pos : e.pos + 1)
    };
  }
  if(e.kind === 'unterminated'){
    const q = e.quote;
    const other = q === '"' ? "'" : '"';
    // Close the string before any trailing ")" or ":" that clearly belongs to the code.
    const trailing = text.slice(e.pos + 1).match(/[)\]}]*:?\s*$/)[0];
    const closeAt = trailing.trim() && (e.depthAtQuote > 0 || trailing.trim() === ':')
      ? text.length - trailing.length
      : text.trimEnd().length;
    const body = text.slice(e.pos + 1, closeAt);
    if(body.endsWith(other)){
      return {
        message: `unterminated string literal (detected at line ${lineNumber})`,
        column: e.pos,
        hint: `This text starts with \`${q}\` but ends with \`${other}\`. Both quotes around a string must be the same.`,
        fixText: text.slice(0, e.pos + 1) + body.slice(0, -1) + q + text.slice(closeAt)
      };
    }
    return {
      message: `unterminated string literal (detected at line ${lineNumber})`,
      column: e.pos,
      hint: `This text starts with \`${q}\` but never ends. Add another \`${q}\` to close the string.`,
      fixText: text.slice(0, closeAt) + q + text.slice(closeAt)
    };
  }
  // unclosed
  const innermost = e.stack[e.stack.length - 1];
  const closing = e.stack.slice().reverse().map(open => PY_CLOSERS[open.ch]).join('');
  const trimmed = text.trimEnd();
  const fixText = PY_HEADER_PATTERN.test(trimmed) && trimmed.endsWith(':')
    ? trimmed.slice(0, -1).trimEnd() + closing + ':'
    : trimmed + closing;
  return {
    message: `'${innermost.ch}' was never closed`,
    column: innermost.pos,
    hint: `Every \`${innermost.ch}\` needs a matching \`${PY_CLOSERS[innermost.ch]}\`. Add \`${closing}\` to close ${e.stack.length > 1 ? 'them' : 'it'}.`,
    fixText
  };
}

/* Index of a lone "=" (not part of ==, !=, <=, >=, :=) or -1. */
function findLoneEquals(masked){
  for(let i = 0; i < masked.length; i++){
    if(masked[i] !== '=') continue;
    if('=!<>:'.includes(masked[i - 1]) || masked[i + 1] === '=') continue;
    return i;
  }
  return -1;
}

/* Check one statement (without its indentation). Returns a problem or null. */
function checkPythonStatement(text, lineNumber){
  const scan = scanPythonLine(text);
  if(scan.error) return bracketProblem(text, scan.error, lineNumber);
  const masked = scan.masked;
  const trimmed = masked.trimEnd();
  const word = (masked.match(/^[A-Za-z_]\w*/) || [''])[0];
  const afterWord = masked.slice(word.length);
  const isAssignment = /^[A-Za-z_]\w*\s*=(?!=)/.test(masked);
  let m;

  // Misspelled keyword at the start of the line: "esle:", "whlie x:", "fro i in …"
  if(word && !isAssignment && !PY_KEYWORDS.includes(word) && !PY_BUILTINS.includes(word)
     && (afterWord === '' || /^[\s:]/.test(afterWord))){
    const guess = closestWord(word, ['if', 'elif', 'else', 'for', 'while', 'import', 'pass', 'print']);
    if(guess){
      return {
        message: `invalid syntax. Did you mean '${guess}'?`,
        column: 0,
        hint: `\`${word}\` isn't a Python keyword. Keywords are case-sensitive and must be spelled exactly: \`${guess}\`.`,
        fixText: guess + text.slice(word.length)
      };
    }
  }

  // Back-to-front comparisons: => and =<
  if((m = /=>|=</.exec(masked))){
    const op = m[0][1] + '=';
    return {
      message: 'invalid syntax',
      column: m.index,
      hint: `Python writes this comparison as \`${op}\` (the \`=\` always comes second).`,
      fixText: text.slice(0, m.index) + op + text.slice(m.index + 2)
    };
  }

  // Lines that open a block: if / elif / else / for / while
  if(PY_BLOCK_KEYWORDS.includes(word)){
    if(word === 'else'){
      if(/^else\s*$/.test(trimmed)){
        return {message: "expected ':'", column: text.trimEnd().length,
          hint: 'A line that starts a block must end with a colon `:`.', fixText: 'else:'};
      }
      if(trimmed !== 'else:'){
        const elseIf = /^else\s+if\b/.test(trimmed);
        return {
          message: "expected ':'",
          column: 4,
          hint: elseIf
            ? "Python doesn't write `else if`. Use `else:` on its own line, then put the `if` inside it, indented by 4 spaces."
            : "`else` doesn't take a condition. Write `else:` on its own.",
          fixText: elseIf ? null : 'else:'
        };
      }
    } else if(!trimmed.endsWith(':')){
      return {
        message: "expected ':'",
        column: text.trimEnd().length,
        hint: `A line that starts a block (\`${word} …\`) must end with a colon \`:\`.`,
        fixText: text.trimEnd() + ':'
      };
    }
    if(/^(if|elif|while)\s*:$/.test(trimmed)){
      return {message: 'invalid syntax', column: word.length,
        hint: `Put a condition between \`${word}\` and the colon, for example \`${word} score > 10:\``, fixText: null};
    }
    if(word === 'if' || word === 'elif' || word === 'while'){
      const eq = findLoneEquals(masked);
      if(eq >= 0){
        return {
          message: "invalid syntax. Maybe you meant '==' or ':=' instead of '='?",
          column: eq,
          hint: 'A single `=` stores a value in a variable. To compare two values, use `==`.',
          fixText: text.slice(0, eq) + '==' + text.slice(eq + 1)
        };
      }
    }
    if(word === 'for'){
      if((m = /\brange\s+(\w+)/.exec(masked))){
        return {
          message: 'invalid syntax',
          column: m.index,
          hint: '`range` is a function, so its number goes in parentheses: `range(5)`.',
          fixText: text.slice(0, m.index) + `range(${m[1]})` + text.slice(m.index + m[0].length)
        };
      }
      if(!/^for\s+[A-Za-z_]\w*\s+in\s+\S.*:$/.test(trimmed)){
        return {message: 'invalid syntax', column: 0,
          hint: 'A for loop is written as `for item in my_list:` or `for _ in range(5):`', fixText: null};
      }
    }
  }

  // Python 2 style print: print "hi"
  if(word === 'print' && /^print\s+[^\s(=]/.test(masked)){
    return {
      message: "Missing parentheses in call to 'print'. Did you mean print(...)?",
      column: 0,
      hint: 'In Python 3, `print` is a function, so whatever you print goes inside parentheses.',
      fixText: `print(${text.slice(5).trim()})`
    };
  }

  // Operators from other languages: &&, ||, !
  if((m = /&&|\|\||!(?!=)/.exec(masked))){
    const pythonWord = {'&&': 'and', '||': 'or', '!': 'not'}[m[0]];
    const before = text.slice(0, m.index).trimEnd();
    const after = text.slice(m.index + m[0].length).trimStart();
    return {
      message: 'invalid syntax',
      column: m.index,
      hint: `Python uses the word \`${pythonWord}\` instead of \`${m[0]}\`.`,
      fixText: (before ? before + ' ' : '') + pythonWord + ' ' + after
    };
  }

  // Lowercase true / false
  if((m = /(?<![\w.])(true|false)(?!\w)/.exec(masked))){
    const proper = m[1][0].toUpperCase() + m[1].slice(1);
    return {
      type: 'NameError',
      message: `name '${m[1]}' is not defined. Did you mean: '${proper}'?`,
      column: m.index,
      hint: 'Python\'s yes/no values start with a capital letter: `True` and `False`.',
      fixText: text.slice(0, m.index) + proper + text.slice(m.index + m[1].length)
    };
  }

  // Misspelled function names: pirnt(…), Print(…), imput(…), random.radint(…)
  const callPattern = /(?<![\w.])([A-Za-z_]\w*(?:\.[A-Za-z_]\w*)?)\s*\(/g;
  while((m = callPattern.exec(masked))){
    const name = m[1];
    if(name.includes('.')){
      const [moduleName, attr] = name.split('.');
      const guess = moduleName === 'random' && attr !== 'randint' ? closestWord(attr, ['randint']) : null;
      if(guess){
        const at = m.index + moduleName.length + 1;
        return {
          type: 'AttributeError',
          message: `module 'random' has no attribute '${attr}'. Did you mean: '${guess}'?`,
          column: at,
          hint: 'Check the spelling of the function name after `random.`',
          fixText: text.slice(0, at) + guess + text.slice(at + attr.length)
        };
      }
      continue;
    }
    if(PY_EDITOR_FUNCTIONS.includes(name) || PY_BUILTINS.includes(name) || PY_KEYWORDS.includes(name)) continue;
    const guess = closestWord(name, PY_EDITOR_FUNCTIONS);
    if(guess){
      return {
        type: 'NameError',
        message: `name '${name}' is not defined. Did you mean: '${guess}'?`,
        column: m.index,
        hint: name.toLowerCase() === guess
          ? `Python is case-sensitive, so \`${guess}\` must be written in lowercase.`
          : `There's no function called \`${name}\`. Check the spelling.`,
        fixText: text.slice(0, m.index) + guess + text.slice(m.index + name.length)
      };
    }
  }

  // print(hello world) — words that were meant to be text
  if((m = /^print\((.*)\)$/.exec(trimmed))){
    const arg = m[1].trim();
    const words = arg.split(/\s+/).map(w => w.replace(/[.!?,]$/, ''));
    if(/^[A-Za-z_]\w*(?:\s+[A-Za-z_]\w*)+[.!?]?$/.test(arg) && !words.some(w => PY_KEYWORDS.includes(w))){
      return {
        message: 'invalid syntax. Perhaps you forgot a comma?',
        column: masked.indexOf('(') + 1,
        hint: 'To print words, put them inside quotes so Python knows they are text, not variable names.',
        fixText: `print("${text.slice(text.indexOf('(') + 1, text.lastIndexOf(')')).trim()}")`
      };
    }
  }

  // Text and a value side by side with nothing joining them: print("Hi" name)
  if((m = /(["'])(\s+)([A-Za-z_]\w*|\d+)/.exec(masked)) && !PY_KEYWORDS.includes(m[3])){
    const at = m.index + 1;
    return {
      message: 'invalid syntax. Perhaps you forgot a comma?',
      column: at + m[2].length,
      hint: 'Join pieces of text and values with `+`, for example `"Hi " + name`.',
      fixText: text.slice(0, at) + ' + ' + text.slice(at + m[2].length)
    };
  }
  if((m = /(?<![\w.])([A-Za-z_]\w*|\d+)(\s+)(["'])/.exec(masked)) && !PY_KEYWORDS.includes(m[1]) && m[1] !== 'print'){
    const at = m.index + m[1].length;
    return {
      message: 'invalid syntax. Perhaps you forgot a comma?',
      column: at + m[2].length,
      hint: 'Join values and pieces of text with `+`, for example `name + " wins!"`.',
      fixText: text.slice(0, at) + ' + ' + text.slice(at + m[2].length)
    };
  }

  // Bad variable names on the left of =
  if((m = /^(\d+)([A-Za-z_]\w*)(\s*=(?!=))/.exec(masked))){
    return {
      message: 'invalid decimal literal',
      column: 0,
      hint: `Variable names can't start with a number. Put the number at the end instead, like \`${m[2]}${m[1]}\`.`,
      fixText: m[2] + m[1] + text.slice(m[1].length + m[2].length)
    };
  }
  if((m = /^([A-Za-z_]\w*(?:-[A-Za-z_]\w*)+)\s*=(?!=)/.exec(masked))){
    return {
      message: "cannot assign to expression here. Maybe you meant '==' instead of '='?",
      column: 0,
      hint: 'Variable names can\'t contain a dash `-`, because Python reads it as minus. Use an underscore `_` instead.',
      fixText: m[1].replace(/-/g, '_') + text.slice(m[1].length)
    };
  }
  if((m = /^([A-Za-z_]\w*(?:\s+[A-Za-z_]\w*)+)\s*=(?!=)/.exec(masked)) && !PY_KEYWORDS.includes(word) && word !== 'print'){
    return {
      message: 'invalid syntax',
      column: 0,
      hint: 'Variable names can\'t contain spaces. Join the words with an underscore, like `my_name`.',
      fixText: m[1].split(/\s+/).join('_') + text.slice(m[1].length)
    };
  }
  if((m = /^(\d[\d.]*|"[^"]*"|'[^']*')\s*=(?!=)\s*(.*)$/.exec(text.trimEnd()))){
    const value = m[2].trim();
    return {
      message: "cannot assign to literal here. Maybe you meant '==' instead of '='?",
      column: 0,
      hint: 'The variable name goes on the left of `=`, and the value goes on the right.',
      fixText: /^[A-Za-z_]\w*$/.test(value) ? `${value} = ${m[1]}` : null
    };
  }
  if(/^[A-Za-z_]\w*\s*=\s*$/.test(masked)){
    return {message: 'invalid syntax', column: text.trimEnd().length,
      hint: 'Put a value after the `=` sign, for example `score = 0`.', fixText: null};
  }

  // An operator with nothing after it: x = 5 +   /   print("a" +)
  const core = masked.replace(/[\s:]*$/, '');
  if((m = /(==|!=|<=|>=|[+\-*/%<>])\s*(?=[)\]}]|$)/.exec(core))){
    return {
      message: 'invalid syntax',
      column: m.index,
      hint: `Something is missing after \`${m[1]}\`. An operator needs a value on both sides, like \`5 ${m[1]} 3\`.`,
      fixText: null
    };
  }
  return null;
}

/* Explain lines that are fine Python but can't become blocks yet. */
function unsupportedHint(text){
  const word = (text.match(/^[A-Za-z_]\w*/) || [''])[0];
  if(word === 'elif') return '`elif` isn\'t available as a block yet. Use `else:` and put an indented `if` inside it.';
  if(word === 'while') return 'The block editor\'s while loop is a "repeat until" block. Write it as `while not (condition):`';
  if(word === 'import') return 'Only `import random` is supported.';
  if(/^print\s+\(/.test(text)) return 'Remove the space between `print` and the opening parenthesis: `print(...)`';
  if(['def', 'class', 'return', 'try', 'except', 'finally', 'with', 'lambda', 'break', 'continue', 'global', 'del', 'from'].includes(word)){
    return `\`${word}\` is valid Python, but the block editor doesn't have a block for it yet.`;
  }
  return 'The block editor understands `print(...)`, `name = value`, `name = input(...)`, `if` / `else`, '
    + '`for _ in range(n):`, `for item in my_list:`, `while not (condition):` and `# comments`.';
}

/* Check the whole program. Returns the first problem as a PyCodeError, or null. */
function findPythonProblem(source){
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const indentStack = [0];
  const lastStatementAt = new Map(); // indent -> first word of the latest statement at that indent
  let openBlock = null;              // header line still waiting for its indented body

  const problemAt = (lineNumber, indent, problem) => new PyCodeError({
    type: problem.type || 'SyntaxError',
    line: lineNumber,
    column: indent + problem.column,
    message: problem.message,
    hint: problem.hint,
    fix: problem.fixText == null ? null : {line: lineNumber, lines: [' '.repeat(indent) + problem.fixText]}
  });

  for(let i = 0; i < lines.length; i++){
    const raw = lines[i];
    const lineNumber = i + 1;
    if(!raw.trim()) continue;
    const leading = raw.match(/^[ \t]*/)[0];
    const text = raw.trim();

    if(leading.includes('\t')){
      return new PyCodeError({
        type: 'TabError', line: lineNumber, column: 0,
        message: 'inconsistent use of tabs and spaces in indentation',
        hint: 'Indent with spaces, 4 per level, instead of the Tab key.',
        fix: {line: lineNumber, lines: [leading.replace(/\t/g, '    ') + text]}
      });
    }

    // Indentation must match the block structure.
    const indent = leading.length;
    const reindent = width => ({line: lineNumber, lines: [' '.repeat(width) + text]});
    if(openBlock){
      const wanted = openBlock.indent + 4;
      if(indent <= openBlock.indent){
        return new PyCodeError({
          type: 'IndentationError', line: lineNumber, column: indent,
          message: `expected an indented block after '${openBlock.word}' statement on line ${openBlock.line}`,
          hint: `The lines inside an \`${openBlock.word}\` block must be indented 4 spaces further than the \`${openBlock.word}\` line.`,
          fix: reindent(wanted)
        });
      }
      if(indent !== wanted){
        return new PyCodeError({
          type: 'IndentationError', line: lineNumber, column: indent,
          message: `expected ${wanted} spaces of indentation, found ${indent}`,
          hint: `Indent each level by exactly 4 spaces. This line needs ${wanted} spaces.`,
          fix: reindent(wanted)
        });
      }
      indentStack.push(indent);
      openBlock = null;
    } else {
      const current = indentStack[indentStack.length - 1];
      if(indent > current){
        return new PyCodeError({
          type: 'IndentationError', line: lineNumber, column: indent,
          message: 'unexpected indent',
          hint: 'This line is indented more than the line above, but the line above doesn\'t start a block (it doesn\'t end with a colon `:`).',
          fix: reindent(current)
        });
      }
      while(indentStack.length > 1 && indentStack[indentStack.length - 1] > indent) indentStack.pop();
      if(indentStack[indentStack.length - 1] !== indent){
        const nearest = indentStack[indentStack.length - 1];
        return new PyCodeError({
          type: 'IndentationError', line: lineNumber, column: indent,
          message: 'unindent does not match any outer indentation level',
          hint: 'When a block ends, the next line must line up exactly with an earlier line, using multiples of 4 spaces.',
          fix: reindent(nearest)
        });
      }
    }
    for(const level of [...lastStatementAt.keys()]){
      if(level > indent) lastStatementAt.delete(level);
    }

    if(text.startsWith('#')){
      lastStatementAt.set(indent, '#');
      continue;
    }

    const problem = checkPythonStatement(text, lineNumber);
    if(problem) return problemAt(lineNumber, indent, problem);

    const masked = scanPythonLine(text).masked.trimEnd();
    const word = (masked.match(/^[A-Za-z_]\w*/) || [''])[0];
    if(word === 'else' && !['if', 'elif'].includes(lastStatementAt.get(indent))){
      return new PyCodeError({
        line: lineNumber, column: indent, message: 'invalid syntax',
        hint: '`else:` must come straight after an `if` block, lined up with its `if`.',
        fix: null
      });
    }
    lastStatementAt.set(indent, word || text[0]);
    if(PY_HEADER_PATTERN.test(masked) && masked.endsWith(':')){
      openBlock = {line: lineNumber, word, indent};
    }
  }

  if(openBlock){
    const header = lines[openBlock.line - 1];
    return new PyCodeError({
      type: 'IndentationError', line: openBlock.line, column: header.trimEnd().length,
      message: `expected an indented block after '${openBlock.word}' statement on line ${openBlock.line}`,
      hint: `Add the code that should run inside the \`${openBlock.word}\` block on the next line, indented by 4 spaces. Use \`pass\` as a placeholder.`,
      fix: {line: openBlock.line, lines: [header, ' '.repeat(openBlock.indent + 4) + 'pass']}
    });
  }
  return null;
}

/* Apply a PyCodeError fix to the editor source. */
function applyCodeFix(source, fix){
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  lines.splice(fix.line - 1, 1, ...fix.lines);
  return lines.join('\n');
}
