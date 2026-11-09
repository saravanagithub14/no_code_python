/* ======================================================================
   DATA MODEL
   Each block: { id, type, fields:{...}, children:[] (for containers) }
   Top level program = array of block objects (a "script-stack")
====================================================================== */

let idCounter = 1;
function newId(){ return 'b' + (idCounter++); }

let program = []; // array of top-level block objects

const BLOCK_META = {
  print:      { cls:'c-output', container:false },
  typecheck:  { cls:'c-types',  container:false },
  setvar:     { cls:'c-vars',   container:false },
  changevar:  { cls:'c-vars',   container:false },
  askvar:     { cls:'c-vars',   container:false },
  convert:    { cls:'c-types',  container:false },
  repeat:     { cls:'c-loops',  container:true  },
  while:      { cls:'c-loops',  container:true  },
  foreach:    { cls:'c-loops',  container:true  },
  if:         { cls:'c-logic',  container:true  },
  ifelse:     { cls:'c-logic',  container:'double' },
  mathop:     { cls:'c-math',   container:false },
  random:     { cls:'c-math',   container:false },
  comment:    { cls:'c-events', container:false },
};

function defaultFields(type){
  switch(type){
    case 'print': return { value: '"Hello!"' };
    case 'typecheck': return { value:'x' };
    case 'setvar': return { name:'x', value:'0' };
    case 'changevar': return { name:'x', value:'1' };
    case 'askvar': return { prompt:'"What is your name?"', name:'x' };
    case 'convert': return { name:'x', to:'int', value:'x' };
    case 'repeat': return { count:'10' };
    case 'while': return { cond:'x > 10' };
    case 'foreach': return { item:'item', list:'[1, 2, 3]' };
    case 'if': return { cond:'x > 0' };
    case 'ifelse': return { cond:'x > 0' };
    case 'mathop': return { name:'x', a:'x', op:'+', b:'1' };
    case 'random': return { name:'x', lo:'1', hi:'10' };
    case 'comment': return { text:'explain here' };
    default: return {};
  }
}

function makeBlock(type){
  const meta = BLOCK_META[type];
  const b = { id:newId(), type, fields: defaultFields(type) };
  if(meta.container === true) b.children = [];
  if(meta.container === 'double'){ b.children = []; b.children2 = []; }
  return b;
}

/* ======================================================================
   RENDERING BLOCKS (as DOM + drag targets)
====================================================================== */

const scriptStackEl = document.getElementById('scriptStack');
const emptyHint = document.getElementById('emptyHint');

function renderProgram(){
  scriptStackEl.innerHTML = '';
  emptyHint.style.display = program.length ? 'none' : 'block';
  program.forEach((block, idx) => {
    scriptStackEl.appendChild(renderBlock(block, program, idx));
  });
  // trailing drop zone at end of top-level stack
  scriptStackEl.appendChild(makeStackDropZone(program, program.length));
  renderCode();
}

function fieldInput(block, key, {width}={}){
  const inp = document.createElement('input');
  inp.className = 'block-input';
  inp.value = block.fields[key];
  if(width) inp.style.width = width;
  inp.addEventListener('click', e => e.stopPropagation());
  inp.addEventListener('mousedown', e => e.stopPropagation());
  inp.addEventListener('dragstart', e => e.preventDefault());
  inp.addEventListener('input', () => { block.fields[key] = inp.value; renderCode(); });
  autosizeInput(inp);
  inp.addEventListener('input', () => autosizeInput(inp));
  return inp;
}
function autosizeInput(inp){
  inp.style.width = Math.max(28, inp.value.length * 8 + 14) + 'px';
}

function fieldSelect(block, key, options){
  const sel = document.createElement('select');
  sel.className = 'block-select';
  options.forEach(o => {
    const opt = document.createElement('option');
    opt.value = o; opt.textContent = o;
    if(block.fields[key] === o) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.addEventListener('click', e => e.stopPropagation());
  sel.addEventListener('mousedown', e => e.stopPropagation());
  sel.addEventListener('change', () => { block.fields[key] = sel.value; renderCode(); });
  return sel;
}

function label(text){
  const span = document.createElement('span');
  span.textContent = text;
  return span;
}

function renderBlock(block, parentArray, indexInParent){
  const meta = BLOCK_META[block.type];
  const wrap = document.createElement('div');
  wrap.className = 'block ' + meta.cls;
  wrap.style.touchAction = 'none';
  wrap.dataset.id = block.id;

  const body = document.createElement('div');
  body.className = 'block-body';

  switch(block.type){
    case 'print':
      body.appendChild(label('say')); body.appendChild(fieldInput(block,'value',{width:'110px'}));
      break;
    case 'typecheck':
      body.appendChild(label('show type of')); body.appendChild(fieldInput(block,'value',{width:'60px'}));
      break;
    case 'setvar':
      body.appendChild(label('set')); body.appendChild(fieldInput(block,'name',{width:'40px'}));
      body.appendChild(label('to')); body.appendChild(fieldInput(block,'value',{width:'60px'}));
      break;
    case 'changevar':
      body.appendChild(label('change')); body.appendChild(fieldInput(block,'name',{width:'40px'}));
      body.appendChild(label('by')); body.appendChild(fieldInput(block,'value',{width:'50px'}));
      break;
    case 'askvar':
      body.appendChild(label('ask')); body.appendChild(fieldInput(block,'prompt',{width:'130px'}));
      body.appendChild(label('→ store in')); body.appendChild(fieldInput(block,'name',{width:'40px'}));
      break;
    case 'convert':
      body.appendChild(label('set')); body.appendChild(fieldInput(block,'name',{width:'44px'}));
      body.appendChild(label('to')); body.appendChild(fieldSelect(block,'to',['int','float','str','bool']));
      body.appendChild(label('of')); body.appendChild(fieldInput(block,'value',{width:'60px'}));
      break;
    case 'repeat':
      body.appendChild(label('repeat')); body.appendChild(fieldInput(block,'count',{width:'40px'}));
      body.appendChild(label('times'));
      break;
    case 'while':
      body.appendChild(label('repeat until')); body.appendChild(fieldInput(block,'cond',{width:'100px'}));
      break;
    case 'foreach':
      body.appendChild(label('for each')); body.appendChild(fieldInput(block,'item',{width:'50px'}));
      body.appendChild(label('in')); body.appendChild(fieldInput(block,'list',{width:'60px'}));
      break;
    case 'if':
      body.appendChild(label('if')); body.appendChild(fieldInput(block,'cond',{width:'100px'}));
      body.appendChild(label('then'));
      break;
    case 'ifelse':
      body.appendChild(label('if')); body.appendChild(fieldInput(block,'cond',{width:'100px'}));
      body.appendChild(label('then / else'));
      break;
    case 'mathop':
      body.appendChild(label('set')); body.appendChild(fieldInput(block,'name',{width:'40px'}));
      body.appendChild(label('to')); body.appendChild(fieldInput(block,'a',{width:'40px'}));
      body.appendChild(fieldSelect(block,'op',['+','-','*','/','%']));
      body.appendChild(fieldInput(block,'b',{width:'40px'}));
      break;
    case 'random':
      body.appendChild(label('set')); body.appendChild(fieldInput(block,'name',{width:'40px'}));
      body.appendChild(label('to random')); body.appendChild(fieldInput(block,'lo',{width:'34px'}));
      body.appendChild(label('-')); body.appendChild(fieldInput(block,'hi',{width:'34px'}));
      break;
    case 'comment':
      body.appendChild(label('#')); body.appendChild(fieldInput(block,'text',{width:'160px'}));
      break;
  }

  const del = document.createElement('div');
  del.className = 'del';
  del.textContent = '×';
  del.title = 'Delete block';
  del.addEventListener('click', (e) => {
    e.stopPropagation();
    removeBlockById(program, block.id);
    renderProgram();
  });

  wrap.appendChild(body);
  wrap.appendChild(del);

  // container children
  if(meta.container === true){
    wrap.appendChild(renderContainer(block, 'children'));
  } else if(meta.container === 'double'){
    const thenLbl = document.createElement('div');
    thenLbl.style.cssText = 'width:100%;font-size:10px;font-weight:800;opacity:0.65;margin:2px 0 -2px 4px;';
    thenLbl.textContent = 'THEN';
    wrap.appendChild(thenLbl);
    wrap.appendChild(renderContainer(block, 'children'));
    const elseLbl = document.createElement('div');
    elseLbl.style.cssText = 'width:100%;font-size:10px;font-weight:800;opacity:0.65;margin:2px 0 -2px 4px;';
    elseLbl.textContent = 'ELSE';
    wrap.appendChild(elseLbl);
    wrap.appendChild(renderContainer(block, 'children2'));
  }

  // drag start (pointer-based, works for mouse + touch + pen)
  wrap.addEventListener('pointerdown', (e) => startDrag(e, wrap, { existingBlockId: block.id }));

  return wrap;
}

function renderContainer(block, key){
  const nest = document.createElement('div');
  nest.className = 'nest';
  const arr = block[key];
  if(arr.length === 0){
    nest.appendChild(makeStackDropZone(arr, 0, true));
  } else {
    arr.forEach((child, i) => {
      nest.appendChild(renderBlock(child, arr, i));
    });
    nest.appendChild(makeStackDropZone(arr, arr.length));
  }
  return nest;
}

/* Drop zone: a thin area between blocks (or empty container) that accepts drags.
   With pointer-based dragging, these zones don't listen for native dnd events —
   instead the active drag loop finds the nearest zone via elementFromPoint / bounding rects. */
function makeStackDropZone(targetArray, index, isEmptyPlaceholder){
  const zone = document.createElement('div');
  zone.className = isEmptyPlaceholder ? 'nest-drop' : 'drop-indicator';
  zone.dataset.dropZone = '1';
  zone.__targetArray = targetArray;
  zone.__index = index;
  if(isEmptyPlaceholder){
    zone.textContent = 'drop blocks inside';
    zone.style.opacity = '0.7';
  } else {
    zone.style.opacity = '0';
    zone.style.height = '8px';
  }
  return zone;
}

function clearDropIndicators(){
  document.querySelectorAll('.drop-indicator').forEach(z => { z.style.opacity='0'; z.style.height='8px'; });
  document.querySelectorAll('.nest-drop').forEach(z => { z.style.opacity='0.7'; z.classList.remove('zone-active'); });
  document.querySelectorAll('.zone-active').forEach(z => z.classList.remove('zone-active'));
}

/* ======================================================================
   POINTER-BASED DRAG & DROP (works for mouse, touch, and pen — including iOS)
====================================================================== */
let activeDrag = null; // { ghost, existingBlockId, paletteType, pointerId, lastZone }

function startDrag(e, sourceEl, opts){
  // Ignore drags that start on interactive form controls (inputs/selects) so typing still works
  if(e.target.closest('input, select, .del')) return;
  e.preventDefault();

  const rect = sourceEl.getBoundingClientRect();
  const ghost = sourceEl.cloneNode(true);
  ghost.classList.add('drag-ghost');
  ghost.style.width = rect.width + 'px';
  // strip nested delete buttons / inputs interactivity from the ghost preview
  ghost.querySelectorAll('input, select').forEach(el => el.disabled = true);
  document.body.appendChild(ghost);

  activeDrag = {
    ghost,
    pointerId: e.pointerId,
    existingBlockId: opts.existingBlockId || null,
    paletteType: opts.paletteType || null,
    offsetX: e.clientX - rect.left,
    offsetY: e.clientY - rect.top,
    lastZone: null,
  };

  if(opts.existingBlockId){
    sourceEl.classList.add('dragging');
  }

  positionGhost(e.clientX, e.clientY);
  activeDrag.lastZone = findNearestZone(e.clientX, e.clientY);
  if(activeDrag.lastZone){
    activeDrag.lastZone.classList.add('zone-active');
    if(activeDrag.lastZone.classList.contains('nest-drop')){ activeDrag.lastZone.style.opacity = '1'; }
    else { activeDrag.lastZone.style.opacity = '1'; activeDrag.lastZone.style.height = '12px'; }
  }

  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', onDragEnd);
  window.addEventListener('pointercancel', onDragEnd);
}

function positionGhost(x, y){
  if(!activeDrag) return;
  activeDrag.ghost.style.left = (x - activeDrag.offsetX) + 'px';
  activeDrag.ghost.style.top = (y - activeDrag.offsetY) + 'px';
}

function onDragMove(e){
  if(!activeDrag || e.pointerId !== activeDrag.pointerId) return;
  positionGhost(e.clientX, e.clientY);

  const zone = findNearestZone(e.clientX, e.clientY);
  if(zone !== activeDrag.lastZone){
    clearDropIndicators();
    if(zone){
      zone.classList.add('zone-active');
      if(zone.classList.contains('nest-drop')){ zone.style.opacity = '1'; }
      else { zone.style.opacity = '1'; zone.style.height = '12px'; }
    }
    activeDrag.lastZone = zone;
  }
}

function findNearestZone(x, y){
  const canvasWrap = document.getElementById('canvasWrap');
  const cRect = canvasWrap.getBoundingClientRect();
  if(x < cRect.left || x > cRect.right || y < cRect.top || y > cRect.bottom) return null;

  // Nearest-zone distance search — more forgiving than requiring a pixel-perfect
  // hit on a thin 6px indicator strip.
  const zones = Array.from(document.querySelectorAll('[data-drop-zone]'));
  let best = null, bestDist = Infinity;
  for(const z of zones){
    const r = z.getBoundingClientRect();
    if(r.width === 0 && r.height === 0) continue; // not laid out / hidden
    const withinBand = y >= r.top - 70 && y <= r.bottom + 70;
    if(!withinBand) continue;
    const cy = r.top + r.height/2;
    const cx = Math.min(Math.max(x, r.left), r.right); // horizontal distance only matters outside the zone's own width
    const dist = Math.abs(cy - y) + Math.abs(cx - x) * 0.02;
    if(dist < bestDist){ bestDist = dist; best = z; }
  }
  if(best) return best;

  // Nothing in range (e.g. pointer is over empty canvas space far below the
  // last block) — fall back to the top-level trailing zone so a drop anywhere
  // in the open canvas still appends to the end of the program.
  const stack = document.getElementById('scriptStack');
  const trailing = stack.querySelector(':scope > [data-drop-zone]:last-child');
  return trailing || null;
}

function onDragEnd(e){
  if(!activeDrag || e.pointerId !== activeDrag.pointerId) return;
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', onDragEnd);
  window.removeEventListener('pointercancel', onDragEnd);

  const zone = activeDrag.lastZone;
  const existingBlockId = activeDrag.existingBlockId;
  const paletteType = activeDrag.paletteType;

  activeDrag.ghost.remove();
  clearDropIndicators();
  document.querySelectorAll('.block.dragging').forEach(el => el.classList.remove('dragging'));
  activeDrag = null;

  if(zone){
    handleDrop(zone.__targetArray, zone.__index, { existingBlockId, paletteType });
  }
}

// palette blocks: start a "copy" drag that creates a new block on drop
document.querySelectorAll('.palette-block').forEach(el => {
  el.addEventListener('pointerdown', (e) => startDrag(e, el, { paletteType: el.dataset.type }));
});

function handleDrop(targetArray, index, opts){
  if(opts.paletteType){
    const block = makeBlock(opts.paletteType);
    targetArray.splice(index, 0, block);
  } else if(opts.existingBlockId){
    // If the block being moved lives in the SAME array as the drop target,
    // removing it first shifts every index after it — so adjust the target
    // index down by one when the origin position was before the drop index.
    const originIndex = targetArray.findIndex(b => b.id === opts.existingBlockId);
    const moved = removeBlockById(program, opts.existingBlockId);
    if(moved){
      let insertAt = index;
      if(originIndex !== -1 && originIndex < index){
        insertAt = index - 1;
      }
      targetArray.splice(insertAt, 0, moved);
    }
  }
  renderProgram();
}

/* Recursively search & remove a block by id from nested structure. Returns removed block or null. */
function removeBlockById(arr, id){
  for(let i=0;i<arr.length;i++){
    if(arr[i].id === id){
      return arr.splice(i,1)[0];
    }
    const b = arr[i];
    if(b.children){
      const found = removeBlockById(b.children, id);
      if(found) return found;
    }
    if(b.children2){
      const found = removeBlockById(b.children2, id);
      if(found) return found;
    }
  }
  return null;
}

/* ======================================================================
   PYTHON CODE GENERATION
====================================================================== */

function pyStr(raw){
  // Heuristic: if it's already quoted, numeric, or a known variable expr, leave as-is.
  return raw;
}

function genLine(block, indent){
  const pad = '    '.repeat(indent);
  switch(block.type){
    case 'print':
      return [`${pad}print(${block.fields.value})`];
    case 'typecheck':
      return [`${pad}print(type(${block.fields.value}).__name__)`];
    case 'setvar':
      return [`${pad}${block.fields.name} = ${block.fields.value}`];
    case 'changevar':
      return [`${pad}${block.fields.name} = ${block.fields.name} + (${block.fields.value})`];
    case 'askvar':
      return [`${pad}${block.fields.name} = input(${block.fields.prompt})`];
    case 'convert':
      return [`${pad}${block.fields.name} = ${block.fields.to}(${block.fields.value})`];
    case 'mathop':
      return [`${pad}${block.fields.name} = ${block.fields.a} ${block.fields.op} ${block.fields.b}`];
    case 'random':
      return [`${pad}${block.fields.name} = random.randint(${block.fields.lo}, ${block.fields.hi})`];
    case 'comment':
      return [`${pad}# ${block.fields.text}`];
    case 'repeat': {
      const lines = [`${pad}for _ in range(${block.fields.count}):`];
      lines.push(...genBody(block.children, indent+1));
      return lines;
    }
    case 'while': {
      const lines = [`${pad}while not (${block.fields.cond}):`];
      lines.push(...genBody(block.children, indent+1));
      return lines;
    }
    case 'foreach': {
      const lines = [`${pad}for ${block.fields.item} in ${block.fields.list}:`];
      lines.push(...genBody(block.children, indent+1));
      return lines;
    }
    case 'if': {
      const lines = [`${pad}if ${block.fields.cond}:`];
      lines.push(...genBody(block.children, indent+1));
      return lines;
    }
    case 'ifelse': {
      const lines = [`${pad}if ${block.fields.cond}:`];
      lines.push(...genBody(block.children, indent+1));
      lines.push(`${pad}else:`);
      lines.push(...genBody(block.children2, indent+1));
      return lines;
    }
    default: return [];
  }
}

function genBody(arr, indent){
  if(!arr || arr.length === 0){
    return ['    '.repeat(indent) + 'pass'];
  }
  const lines = [];
  arr.forEach(b => lines.push(...genLine(b, indent)));
  return lines;
}

function usesRandom(arr){
  for(const b of arr){
    if(b.type === 'random') return true;
    if(b.children && usesRandom(b.children)) return true;
    if(b.children2 && usesRandom(b.children2)) return true;
  }
  return false;
}

function generatePythonLines(){
  let lines = [];
  if(usesRandom(program)){
    lines.push('import random');
    lines.push('');
  }
  if(program.length === 0){
    lines.push('# Drag blocks from the left to build your program!');
  } else {
    program.forEach(b => lines.push(...genLine(b, 0)));
  }
  return lines;
}

function renderCode(){
  const lines = generatePythonLines();
  const codeEditor = document.getElementById('codeEditor');
  codeEditor.value = lines.join('\n');
  window.__lastPython = lines.join('\n');
  setCodeStatus('Code and blocks are in sync');
}

function setCodeStatus(message, isError=false){
  const status = document.getElementById('codeStatus');
  status.textContent = message;
  status.classList.toggle('error', isError);
}

function extractCallArgument(text, name){
  const prefix = name + '(';
  if(!text.startsWith(prefix) || !text.endsWith(')')) return null;
  let depth = 0;
  let quote = '';
  let escaped = false;
  for(let i=prefix.length-1;i<text.length;i++){
    const char = text[i];
    if(quote){
      if(escaped){ escaped = false; continue; }
      if(char === '\\'){ escaped = true; continue; }
      if(char === quote) quote = '';
      continue;
    }
    if(char === '"' || char === "'"){ quote = char; continue; }
    if(char === '(') depth++;
    if(char === ')'){
      depth--;
      if(depth === 0) return i === text.length-1 ? text.slice(prefix.length, i) : null;
      if(depth < 0) return null;
    }
  }
  return null;
}

function splitTopLevelComma(text){
  let depth = 0;
  let quote = '';
  let escaped = false;
  for(let i=0;i<text.length;i++){
    const char = text[i];
    if(quote){
      if(escaped){ escaped = false; continue; }
      if(char === '\\'){ escaped = true; continue; }
      if(char === quote) quote = '';
      continue;
    }
    if(char === '"' || char === "'"){ quote = char; continue; }
    if('([{'.includes(char)){ depth++; continue; }
    if(')]}'.includes(char)){ depth--; continue; }
    if(char === ',' && depth === 0){
      return [text.slice(0,i).trim(), text.slice(i+1).trim()];
    }
  }
  return null;
}

function splitTopLevelOperation(text){
  let depth = 0;
  let quote = '';
  let escaped = false;
  for(let i=0;i<text.length;i++){
    const char = text[i];
    if(quote){
      if(escaped){ escaped = false; continue; }
      if(char === '\\'){ escaped = true; continue; }
      if(char === quote) quote = '';
      continue;
    }
    if(char === '"' || char === "'"){ quote = char; continue; }
    if('([{'.includes(char)){ depth++; continue; }
    if(')]}'.includes(char)){ depth--; continue; }
    if(depth === 0 && '+-*/%'.includes(char) && text[i-1] === ' ' && text[i+1] === ' '){
      const left = text.slice(0,i).trim();
      const right = text.slice(i+2).trim();
      if(left && right) return [left, char, right];
    }
  }
  return null;
}

function parsePythonBlocks(source){
  const rawLines = source.replace(/\r\n?/g, '\n').split('\n');
  if(rawLines.every(line => !line.trim() || line.trim() === '# Drag blocks from the left to build your program!')) return [];

  const lines = [];
  rawLines.forEach((raw, index) => {
    if(!raw.trim()) return;
    if(raw.includes('\t')) throw new Error(`Line ${index+1}: use spaces for indentation.`);
    const indent = raw.length - raw.trimStart().length;
    if(indent % 4 !== 0) throw new Error(`Line ${index+1}: indentation must use groups of 4 spaces.`);
    const text = raw.trim();
    if(text === 'import random' && indent === 0) return;
    lines.push({indent, text, lineNumber:index+1});
  });

  let cursor = 0;
  function parseSuite(indent){
    const blocks = [];
    while(cursor < lines.length){
      const line = lines[cursor];
      if(line.indent < indent) break;
      if(line.indent > indent){
        throw new Error(`Line ${line.lineNumber}: unexpected indentation.`);
      }
      if(line.text === 'else:'){
        throw new Error(`Line ${line.lineNumber}: else must follow an if block.`);
      }
      if(line.text === 'pass'){
        cursor++;
        continue;
      }
      if(line.text.startsWith('#')){
        cursor++;
        blocks.push(makeParsedBlock('comment', {text:line.text.slice(1).trimStart()}));
        continue;
      }

      let match = line.text.match(/^for _ in range\((.*)\):$/);
      if(match){
        cursor++;
        const block = makeParsedBlock('repeat', {count:match[1]});
        block.children = parseSuite(indent+4);
        blocks.push(block);
        continue;
      }
      match = line.text.match(/^for ([A-Za-z_]\w*) in (.+):$/);
      if(match){
        cursor++;
        const block = makeParsedBlock('foreach', {item:match[1],list:match[2]});
        block.children = parseSuite(indent+4);
        blocks.push(block);
        continue;
      }
      match = line.text.match(/^while not \((.*)\):$/);
      if(match){
        cursor++;
        const block = makeParsedBlock('while', {cond:match[1]});
        block.children = parseSuite(indent+4);
        blocks.push(block);
        continue;
      }
      match = line.text.match(/^if (.+):$/);
      if(match){
        cursor++;
        const children = parseSuite(indent+4);
        if(cursor < lines.length && lines[cursor].indent === indent && lines[cursor].text === 'else:'){
          cursor++;
          const block = makeParsedBlock('ifelse', {cond:match[1]});
          block.children = children;
          block.children2 = parseSuite(indent+4);
          blocks.push(block);
        } else {
          const block = makeParsedBlock('if', {cond:match[1]});
          block.children = children;
          blocks.push(block);
        }
        continue;
      }

      const printValue = extractCallArgument(line.text, 'print');
      if(printValue !== null){
        cursor++;
        const typeCheck = printValue.match(/^type\((.*)\)\.__name__$/);
        if(typeCheck){
          blocks.push(makeParsedBlock('typecheck', {value:typeCheck[1]}));
          continue;
        }
        blocks.push(makeParsedBlock('print', {value:printValue}));
        continue;
      }

      match = line.text.match(/^([A-Za-z_]\w*) = (.+)$/);
      if(match){
        cursor++;
        const [, name, value] = match;
        const inputPrompt = extractCallArgument(value, 'input');
        if(inputPrompt !== null){
          blocks.push(makeParsedBlock('askvar', {name,prompt:inputPrompt}));
          continue;
        }
        const conversion = value.match(/^(int|float|str|bool)\((.*)\)$/);
        if(conversion){
          blocks.push(makeParsedBlock('convert', {name,to:conversion[1],value:conversion[2]}));
          continue;
        }
        const randomArgs = extractCallArgument(value, 'random.randint');
        if(randomArgs !== null){
          const [lo, hi] = splitTopLevelComma(randomArgs) || [];
          if(lo !== undefined && hi !== undefined){
            blocks.push(makeParsedBlock('random', {name,lo,hi}));
            continue;
          }
        }
        const change = value.match(new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\+ \\((.*)\\)$'));
        if(change){
          blocks.push(makeParsedBlock('changevar', {name,value:change[1]}));
          continue;
        }
        const operation = splitTopLevelOperation(value);
        if(operation){
          blocks.push(makeParsedBlock('mathop', {name,a:operation[0],op:operation[1],b:operation[2]}));
          continue;
        }
        blocks.push(makeParsedBlock('setvar', {name,value}));
        continue;
      }

      throw new Error(`Line ${line.lineNumber}: this Python statement is not supported by the block editor.`);
    }
    return blocks;
  }

  const blocks = parseSuite(0);
  if(cursor < lines.length){
    throw new Error(`Line ${lines[cursor].lineNumber}: could not read this block.`);
  }
  return blocks;
}

function makeParsedBlock(type, fields){
  const block = makeBlock(type);
  block.fields = Object.assign(defaultFields(type), fields);
  return block;
}

function applyPythonToBlocks(){
  try{
    program = parsePythonBlocks(document.getElementById('codeEditor').value);
    renderProgram();
    setCodeStatus('Blocks updated from code');
  } catch(error){
    setCodeStatus(error.message, true);
  }
}

/* ======================================================================
   SIMPLE PYTHON-SUBSET INTERPRETER (for Run button)
   We don't actually run Python — we interpret our own block tree directly,
   which is safe, sandboxed, and matches the generated code 1:1.
====================================================================== */

function runProgram(){
  const consoleBody = document.getElementById('consoleBody');
  consoleBody.innerHTML = '';
  const out = [];
  const vars = {};
  let opCount = 0;
  const MAX_OPS = 20000;

  function log(msg, isErr){
    const div = document.createElement('div');
    if(isErr) div.className = 'err';
    div.textContent = msg;
    consoleBody.appendChild(div);
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }

  function evalExpr(expr, ctx){
    // Build a restricted evaluation: substitute variables, support + - * / % > < >= <= == != and, or, not, parens, numbers, strings
    // We transpile python-ish syntax lightly to JS for evaluation in a sandboxed Function.
    let js = expr
      .replace(/\btrue\b/gi,'true').replace(/\bfalse\b/gi,'false')
      .replace(/\band\b/g,'&&').replace(/\bor\b/g,'||').replace(/\bnot\b/g,'!')
      .replace(/\bTrue\b/g,'true').replace(/\bFalse\b/g,'false');
    const fn = new Function(...Object.keys(ctx), `"use strict"; return (${js});`);
    return fn(...Object.values(ctx));
  }

  function run(blockList, ctx){
    for(const block of blockList){
      opCount++;
      if(opCount > MAX_OPS){ throw new Error('Stopped: program ran too long (possible infinite loop).'); }
      switch(block.type){
        case 'print': {
          let v;
          try { v = evalExpr(block.fields.value, ctx); } catch(e){ v = block.fields.value; }
          log(String(v));
          break;
        }
        case 'typecheck': {
          const value = evalExpr(block.fields.value, ctx);
          let typeName;
          if(value === null) typeName = 'NoneType';
          else if(Array.isArray(value)) typeName = 'list';
          else if(typeof value === 'boolean') typeName = 'bool';
          else if(typeof value === 'number') typeName = Number.isInteger(value) ? 'int' : 'float';
          else if(typeof value === 'string') typeName = 'str';
          else typeName = 'dict';
          log(typeName);
          break;
        }
        case 'setvar': {
          let v;
          try { v = evalExpr(block.fields.value, ctx); } catch(e){ v = block.fields.value; }
          ctx[block.fields.name] = v;
          break;
        }
        case 'changevar': {
          let v;
          try { v = evalExpr(block.fields.value, ctx); } catch(e){ v = Number(block.fields.value)||0; }
          const cur = ctx[block.fields.name] ?? 0;
          ctx[block.fields.name] = cur + v;
          break;
        }
        case 'askvar': {
          let promptText;
          try { promptText = evalExpr(block.fields.prompt, ctx); } catch(e){ promptText = block.fields.prompt; }
          const answer = window.prompt(String(promptText)) ?? '';
          ctx[block.fields.name] = answer;
          log(`? ${promptText} → "${answer}"`);
          break;
        }
        case 'convert': {
          const value = evalExpr(block.fields.value, ctx);
          let converted;
          switch(block.fields.to){
            case 'int': {
              const number = typeof value === 'string' && !/^[+-]?\d+$/.test(value.trim())
                ? NaN
                : Number(value);
              if(!Number.isFinite(number)) throw new Error(`Cannot convert ${JSON.stringify(value)} to int.`);
              converted = Math.trunc(number);
              break;
            }
            case 'float':
              converted = Number(value);
              if(!Number.isFinite(converted)) throw new Error(`Cannot convert ${JSON.stringify(value)} to float.`);
              break;
            case 'str':
              converted = String(value);
              break;
            case 'bool':
              converted = Boolean(value);
              break;
            default:
              throw new Error(`Unknown conversion type: ${block.fields.to}`);
          }
          ctx[block.fields.name] = converted;
          break;
        }
        case 'mathop': {
          let a,b;
          try { a = evalExpr(block.fields.a, ctx); } catch(e){ a = Number(block.fields.a)||0; }
          try { b = evalExpr(block.fields.b, ctx); } catch(e){ b = Number(block.fields.b)||0; }
          let result;
          switch(block.fields.op){
            case '+': result = a + b; break;
            case '-': result = a - b; break;
            case '*': result = a * b; break;
            case '/': result = a / b; break;
            case '%': result = a % b; break;
          }
          ctx[block.fields.name] = result;
          break;
        }
        case 'random': {
          const lo = Number(evalExpr(block.fields.lo, ctx));
          const hi = Number(evalExpr(block.fields.hi, ctx));
          ctx[block.fields.name] = Math.floor(Math.random() * (hi - lo + 1)) + lo;
          break;
        }
        case 'comment': break;
        case 'repeat': {
          const n = Math.max(0, Math.floor(Number(evalExpr(block.fields.count, ctx)) || 0));
          for(let i=0;i<n;i++){
            opCount++;
            if(opCount > MAX_OPS) throw new Error('Stopped: program ran too long (possible infinite loop).');
            run(block.children, ctx);
          }
          break;
        }
        case 'while': {
          let guard = 0;
          while(!evalExpr(block.fields.cond, ctx)){
            guard++;
            if(guard > 5000) throw new Error('Stopped: "repeat until" loop never became true (possible infinite loop).');
            run(block.children, ctx);
          }
          break;
        }
        case 'foreach': {
          let list;
          try { list = evalExpr(block.fields.list, ctx); } catch(e){ list = []; }
          if(!Array.isArray(list)){
            // allow simple comma syntax like [1,2,3] typed without brackets, or fallback empty
            list = [];
          }
          for(const item of list){
            const childCtx = Object.assign({}, ctx, {[block.fields.item]: item});
            run(block.children, childCtx);
            Object.assign(ctx, childCtx);
          }
          break;
        }
        case 'if': {
          let cond;
          try { cond = evalExpr(block.fields.cond, ctx); } catch(e){ cond = false; }
          if(cond) run(block.children, ctx);
          break;
        }
        case 'ifelse': {
          let cond;
          try { cond = evalExpr(block.fields.cond, ctx); } catch(e){ cond = false; }
          if(cond) run(block.children, ctx); else run(block.children2, ctx);
          break;
        }
      }
    }
  }

  try{
    if(program.length === 0){
      log('Nothing to run yet — drag some blocks in first!');
      return;
    }
    run(program, vars);
    log('— Program finished —');
  } catch(e){
    log('⚠ ' + e.message, true);
  }
}

/* ======================================================================
   TOP BAR ACTIONS
====================================================================== */
document.getElementById('runBtn').addEventListener('click', runProgram);
document.getElementById('applyCodeBtn').addEventListener('click', applyPythonToBlocks);
document.getElementById('codeEditor').addEventListener('input', () => {
  setCodeStatus('Code edited — apply to update blocks');
});
document.getElementById('codeEditor').addEventListener('keydown', e => {
  if((e.ctrlKey || e.metaKey) && e.key === 'Enter'){
    e.preventDefault();
    applyPythonToBlocks();
  }
});
document.getElementById('clearBtn').addEventListener('click', () => {
  if(program.length && !confirm('Clear all blocks from the canvas?')) return;
  program = [];
  renderProgram();
});
document.getElementById('clearConsole').addEventListener('click', () => {
  document.getElementById('consoleBody').innerHTML = '<span class="hint">Console cleared. Click ▶ Run to try again.</span>';
});

document.getElementById('loadExampleBtn').addEventListener('click', () => {
  program = buildExample();
  renderProgram();
});

function buildExample(){
  const setX = makeBlock('setvar'); setX.fields = { name:'count', value:'0' };
  const askName = makeBlock('askvar'); askName.fields = { prompt:'"What is your name?"', name:'name' };
  const greet = makeBlock('print'); greet.fields = { value: '"Hi " + name + "! Let\'s count to 5."' };

  const loop = makeBlock('repeat'); loop.fields = { count:'5' };
  const change = makeBlock('changevar'); change.fields = { name:'count', value:'1' };
  const printCount = makeBlock('print'); printCount.fields = { value: 'count' };
  const check = makeBlock('if'); check.fields = { cond: 'count == 3' };
  const printMid = makeBlock('print'); printMid.fields = { value: '"Halfway-ish!"' };
  check.children = [printMid];
  loop.children = [change, printCount, check];

  const done = makeBlock('print'); done.fields = { value: '"Done counting!"' };

  return [setX, askName, greet, loop, done];
}

/* ======================================================================
   INIT
====================================================================== */
const practiceCode = new URLSearchParams(window.location.search).get('practice');
if(practiceCode !== null){
  const codeEditor = document.getElementById('codeEditor');
  codeEditor.value = practiceCode;
  try{
    program = parsePythonBlocks(practiceCode);
    renderProgram();
    setCodeStatus('Lesson example loaded — click ▶ Run to try it');
  } catch(error){
    program = [];
    renderProgram();
    codeEditor.value = practiceCode;
    setCodeStatus(`Could not load lesson example: ${error.message}`, true);
  }
} else {
  renderProgram();
}
