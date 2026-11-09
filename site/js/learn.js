    const LEVELS = [
      {
        title:'Say hello',icon:'👋',description:'Programs can show messages with print(). Put the message in quotes to make it text (a string).',
        definition:'A program can show text with print(). Put the text inside quotation marks, then pass it to the print() function.',
        analogy:'print() is like a tiny loudspeaker: whatever message you put inside its parentheses gets announced on the screen.',
        theoryExample:'print("Hello!") displays the message Hello! The quotes tell Python that Hello! is text.',
        exampleNote:'This one-line program asks Python to display a friendly greeting.',exampleExplanation:'The text inside the parentheses is the message print() displays.',
        code:'print("Hello, Python!")',output:'Hello, Python!',badge:'First words'
      },
      {
        title:'Meet variables',icon:'📦',description:'A variable is a name for a value. Use = to store a value, then use the name to get it back.',
        definition:'A variable is a named place to store a value. Use the assignment operator = to save a value under a name, then use that name to refer to the value.',
        analogy:'Think of a variable as a labeled jar. The label is the variable name, and the value is what you keep inside. You can look inside again whenever you need it.',
        theoryExample:'pet = "Mochi" puts the text Mochi into the jar labeled pet. Then print(pet) displays what is inside.',
        exampleNote:'First, save a pet’s name. Then pass the variable to print() to display it.',exampleExplanation:'The output is Mochi. Python looks up pet and uses the value stored there.',
        code:'pet = "Mochi"\nprint(pet)',output:'Mochi',badge:'Value keeper'
      },
      {
        title:'Types of things',icon:'🧩',description:'Python values have types: strings for text, integers for whole numbers, floats for decimals, and Booleans for True or False.',
        definition:'A data type describes what kind of value something is. Common Python types include str for text, int for whole numbers, float for decimals, and bool for True or False.',
        analogy:'Data types are like different kinds of containers: a text box holds words, a number box holds quantities, and a yes-or-no switch holds True or False.',
        theoryExample:'"12" is text because it has quotes, but 12 is a whole number. They look similar to us, but Python treats them differently.',
        exampleNote:'Read each assignment and compare the value with its type comment.',exampleExplanation:'The comments after # are notes for people; Python does not execute them.',
        code:'name = "Ada"\nage = 12\nheight = 1.5\nready = True',output:'(No output)',badge:'Type explorer'
      },
      {
        title:'Ask a question',icon:'💬',description:'input() pauses to collect what someone types. Its result is text, so save it in a variable to use later.',
        definition:'The input() function asks someone to type a response. Save the response in a variable to use it later. The response is returned as text.',
        analogy:'input() is like passing someone a question card: the program asks, waits for an answer, and keeps what they wrote.',
        theoryExample:'name = input("Your name? ") asks a question and stores the typed answer in the variable name.',
        exampleNote:'The program asks for a name, remembers the response, and greets the person.',exampleExplanation:'Try changing the prompt or the greeting to make the program your own.',
        code:'name = input("Your name? ")\nprint("Hi, " + name)',output:'Your name? Mochi\nHi, Mochi',badge:'Conversation starter'
      },
      {
        title:'Do the math',icon:'🧮',description:'Python uses +, -, *, and / for arithmetic. Use int() to turn number-text into a whole number before calculating.',
        definition:'Operators are symbols that tell Python to perform an action on values. Arithmetic operators include + for addition, - for subtraction, * for multiplication, / for division, and % for a remainder.',
        analogy:'Operators are like tools in a toolbox. Choose the adding tool to combine amounts or the division tool to share them equally.',
        theoryExample:'8 % 3 is 2: three fits into eight twice, with two left over.',
        exampleNote:'Divide eight apples equally among two friends.',exampleExplanation:'Division with / returns 4.0. Try replacing / with % to see the remainder instead.',
        code:'apples = 8\nfriends = 2\nprint(apples / friends)',output:'4.0',badge:'Number wizard'
      },
      {
        title:'Make a decision',icon:'🚦',description:'An if statement runs code only when its condition is True. Indent the lines that belong inside it.',
        definition:'An if statement checks whether a condition is True. Python runs its indented instructions only when that condition is true.',
        analogy:'An if statement is like a gatekeeper: it checks a rule and opens the gate only when the rule is met.',
        theoryExample:'If score >= 5 is true, Python runs the indented instructions. If it is false, Python skips them.',
        exampleNote:'Check whether a score is high enough to show a level-up message.',exampleExplanation:'Because 7 is greater than or equal to 5, Python runs the indented print() line.',
        code:'score = 7\nif score >= 5:\n    print("Level up!")',output:'Level up!',badge:'Path chooser'
      },
      {
        title:'Repeat with loops',icon:'🔁',description:'A for loop repeats its indented body for each item in a sequence. range(3) counts 0, 1, and 2.',
        definition:'A loop repeats a set of instructions. A for loop takes each item in a sequence in turn and runs its indented body once for that item.',
        analogy:'A loop is like dealing cards to players: repeat the same action once for each person, then stop when everyone has a card.',
        theoryExample:'range(3) gives 0, 1, and 2, so a for loop using it runs three times.',
        exampleNote:'Use a for loop to print each number produced by range(3).',exampleExplanation:'The output is 0, then 1, then 2—one line for each loop repetition.',
        code:'for number in range(3):\n    print(number)',output:'0\n1\n2',badge:'Loop legend'
      },
      {
        title:'Keep a list',icon:'🎒',description:'Lists keep several values in order. Indexing starts at 0, so snacks[0] is the first item.',
        definition:'A list stores multiple values in a specific order. Write the values inside square brackets and separate them with commas. Use an index to access an item.',
        analogy:'A list is like a row of numbered lockers. Each locker has a position, and you use its number to find what is stored there.',
        theoryExample:'In snacks = ["pear", "mango"], snacks[0] gives "pear". Python starts counting list positions at zero.',
        exampleNote:'Create a list of snacks and read the first item by its index.',exampleExplanation:'snacks[0] gives "pear". Change 0 to 1 to get "mango".',
        code:'snacks = ["pear", "mango", "toast"]\nprint(snacks[0])',output:'pear',badge:'Python explorer'
      }
    ];
    const STORAGE_KEY = 'pyblocks-learning-progress-v1';
    let completed = new Set();
    let activeLevel = 0;

    function loadProgress(){
      try{
        const saved = localStorage.getItem(STORAGE_KEY);
        if(!saved) return;
        const data = JSON.parse(saved);
        if(!Array.isArray(data.completed) || data.completed.some(index => !Number.isInteger(index) || index < 0 || index >= LEVELS.length)){
          throw new Error('Saved course progress has an invalid format.');
        }
        completed = new Set(data.completed);
      }catch(error){
        console.warn('Could not load PyBlocks learning progress:', error);
        document.getElementById('storageNote').textContent = 'Progress could not be loaded from this browser. You can still play this session.';
      }
    }
    function saveProgress(){
      try{
        localStorage.setItem(STORAGE_KEY, JSON.stringify({completed:[...completed]}));
      }catch(error){
        console.error('Could not save PyBlocks learning progress:', error);
        document.getElementById('storageNote').textContent = 'Progress could not be saved in this browser. Keep this page open to continue.';
      }
    }
    function isUnlocked(index){
      return index === 0 || completed.has(index - 1);
    }
    function updateProgress(){
      const count = completed.size;
      const percentage = Math.round(count / LEVELS.length * 100);
      document.getElementById('xpCount').textContent = String(count * 100);
      document.getElementById('completedCount').textContent = `${count}/${LEVELS.length}`;
      document.getElementById('progressText').textContent = `${percentage}% complete`;
      const track = document.querySelector('.progress-track');
      track.setAttribute('aria-valuenow', String(percentage));
      document.getElementById('progressFill').style.width = `${percentage}%`;
    }
    function renderLevelList(){
      const list = document.getElementById('levelList');
      list.replaceChildren();
      LEVELS.forEach((level,index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'level-button';
        button.disabled = !isUnlocked(index);
        button.setAttribute('aria-label',`Level ${index + 1}: ${level.title}${completed.has(index) ? ', completed' : isUnlocked(index) ? '' : ', locked'}`);
        if(index === activeLevel) button.setAttribute('aria-current','step');
        const icon = document.createElement('span');
        icon.className = 'level-icon';
        icon.textContent = completed.has(index) ? '⭐' : isUnlocked(index) ? level.icon : '🔒';
        const title = document.createElement('span');
        title.className = 'level-name';
        title.textContent = `${index + 1}. ${level.title}`;
        const state = document.createElement('span');
        state.className = 'level-state';
        state.textContent = completed.has(index) ? 'DONE' : isUnlocked(index) ? '+100 XP' : 'LOCKED';
        button.append(icon,title,state);
        button.addEventListener('click',() => {
          activeLevel = index;
          render();
        });
        list.append(button);
      });
    }
    function render(){
      const level = LEVELS[activeLevel];
      document.getElementById('chapterIcon').textContent = level.icon;
      document.getElementById('chapterKicker').textContent = `Level ${activeLevel + 1} · ${level.badge}`;
      document.getElementById('chapterTitle').textContent = level.title;
      document.getElementById('chapterDescription').textContent = level.description;
      document.getElementById('theoryDefinition').textContent = level.definition;
      document.getElementById('theoryAnalogy').textContent = level.analogy;
      document.getElementById('theoryExample').textContent = level.theoryExample;
      document.querySelector('.sandbox-link').href = `./index.html?practice=${encodeURIComponent(level.code)}`;
      document.getElementById('exampleNote').textContent = level.exampleNote;
      document.getElementById('exampleExplanation').textContent = level.exampleExplanation;
      document.getElementById('chapterCode').textContent = level.code;
      document.getElementById('chapterOutput').textContent = level.output;
      const next = document.getElementById('nextButton');
      const alreadyCompleted = completed.has(activeLevel);
      next.disabled = alreadyCompleted && activeLevel === LEVELS.length - 1;
      next.textContent = activeLevel === LEVELS.length - 1
        ? alreadyCompleted ? '🏆 Course complete!' : 'Finish course · earn 100 XP →'
        : alreadyCompleted ? 'Next level →' : 'Next level · earn 100 XP →';
      renderLevelList();
      updateProgress();
    }
    document.getElementById('nextButton').addEventListener('click',() => {
      if(!completed.has(activeLevel)){
        completed.add(activeLevel);
        saveProgress();
      }
      if(activeLevel < LEVELS.length - 1 && completed.has(activeLevel)){
        activeLevel += 1;
        render();
      }else{
        render();
      }
    });
    loadProgress();
    activeLevel = Math.min(completed.size,LEVELS.length - 1);
    while(activeLevel > 0 && !isUnlocked(activeLevel)) activeLevel -= 1;
    if(completed.size === LEVELS.length) activeLevel = LEVELS.length - 1;
    render();
