const fs = require('fs');
const path = require('path');
const vm = require('vm');

console.log('--- Testing Subtopics Horizontal Scroll Feature (Drag & Wheel) ---');

// 1. Verify HTML Structure
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const requiredElements = [
    'id="subtopic-pills"',
    'custom-scrollbar',
    'data-topic="all"',
    'data-topic="t1"',
    'data-topic="t2"',
    'data-topic="t3"',
    'data-topic="t4"',
    'data-topic="t5"',
    'data-topic="t6"'
];

for (const el of requiredElements) {
    if (!html.includes(el)) {
        console.error(`FAIL: Missing element/attribute in index.html: ${el}`);
        process.exit(1);
    }
}
console.log('PASS: index.html contains all subtopic navigation elements and pills.');

// Count shrink-0 in subtopic-pills
const pillMatches = html.match(/class="[^"]*topic-pill[^"]*shrink-0[^"]*"/g) || [];
if (pillMatches.length !== 7) {
    console.error(`FAIL: Expected 7 pills with shrink-0, found ${pillMatches.length}`);
    process.exit(1);
}
console.log('PASS: All 7 subtopic pills have shrink-0 class.');

// 2. Verify css/style.css
const css = fs.readFileSync(path.join(__dirname, '..', 'css', 'style.css'), 'utf8');
if (!css.includes('.custom-scrollbar') || !css.includes('scrollbar-width: thin;')) {
    console.error('FAIL: Missing thin scrollbar style in css/style.css');
    process.exit(1);
}
console.log('PASS: css/style.css has custom-scrollbar and scrollbar-width rules.');

// 3. Verify js/practice.js logic via simulated DOM
class MockClassList {
    constructor(classes = []) {
        this.classes = new Set(classes);
    }
    add(...cls) {
        cls.forEach(c => this.classes.add(c));
    }
    remove(...cls) {
        cls.forEach(c => this.classes.delete(c));
    }
    contains(c) {
        return this.classes.has(c);
    }
}

class MockElement {
    constructor(tag, id = '') {
        this.tagName = tag.toUpperCase();
        this.id = id;
        this.classList = new MockClassList();
        this.attributes = {};
        this.listeners = {};
        this.scrollLeft = 0;
        this.scrollWidth = 1200;
        this.clientWidth = 600;
        this.offsetLeft = 50;
    }
    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k]; }
    addEventListener(event, fn, opts) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(fn);
    }
    dispatchEvent(event) {
        const list = this.listeners[event.type] || [];
        for (const fn of list) {
            fn(event);
        }
    }
    scrollBy(options) {
        if (options && typeof options.left === 'number') {
            this.scrollLeft += options.left;
        }
    }
    scrollIntoView(opts) {
        this.scrolledIntoView = true;
    }
}

const mockWindow = {
    addEventListener: (event, fn) => {
        if (!mockWindow.listeners) mockWindow.listeners = {};
        if (!mockWindow.listeners[event]) mockWindow.listeners[event] = [];
        mockWindow.listeners[event].push(fn);
    },
    dispatchEvent: (event) => {
        const list = (mockWindow.listeners && mockWindow.listeners[event.type]) || [];
        for (const fn of list) fn(event);
    }
};

const pillsContainer = new MockElement('div', 'subtopic-pills');

const pillBtns = ['all', 't1', 't2', 't3', 't4', 't5', 't6'].map(t => {
    const btn = new MockElement('button');
    btn.setAttribute('data-topic', t);
    btn.className = 'topic-pill shrink-0';
    return btn;
});

const elementsMap = {
    'subtopic-pills': pillsContainer
};

const mockDocument = {
    getElementById: (id) => elementsMap[id] || null,
    querySelectorAll: (selector) => {
        if (selector.includes('.topic-pill')) return pillBtns;
        return [];
    },
    querySelector: (selector) => {
        const match = selector.match(/data-topic="([^"]+)"/);
        if (match) {
            return pillBtns.find(b => b.getAttribute('data-topic') === match[1]);
        }
        return null;
    }
};

const sandbox = {
    window: mockWindow,
    document: mockDocument,
    console: console,
    currentSubtopic: 'all',
    allQuestions: [],
    filteredQuestions: [],
    studyMode: 'quiz',
    userProgress: { starred: [] },
    setTimeout: (fn) => fn(),
    clearTimeout: () => {}
};

vm.createContext(sandbox);

const stateCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'state.js'), 'utf8');
vm.runInContext(stateCode, sandbox);

const practiceCode = fs.readFileSync(path.join(__dirname, '..', 'js', 'practice.js'), 'utf8');
vm.runInContext(practiceCode, sandbox);

// Test setupSubtopicScrollInteractions
sandbox.setupSubtopicScrollInteractions();
console.log('PASS: setupSubtopicScrollInteractions initialized without errors.');

// Test wheel event
const wheelEvent = {
    type: 'wheel',
    deltaY: 100,
    deltaX: 0,
    preventDefault: () => {}
};
pillsContainer.dispatchEvent(wheelEvent);
if (pillsContainer.scrollLeft !== 100) {
    console.error(`FAIL: Expected wheel to increase scrollLeft to 100, got ${pillsContainer.scrollLeft}`);
    process.exit(1);
}
console.log('PASS: Mouse wheel vertical delta successfully converted to horizontal scroll.');

// Test mouse drag
const mouseDownEvent = {
    type: 'mousedown',
    pageX: 200
};
pillsContainer.dispatchEvent(mouseDownEvent);

const mouseMoveEvent = {
    type: 'mousemove',
    pageX: 150, // Moved 50px left -> should scroll right
    preventDefault: () => {}
};
pillsContainer.dispatchEvent(mouseMoveEvent);

if (pillsContainer.scrollLeft <= 100) {
    console.error(`FAIL: Expected drag to increase scrollLeft, got ${pillsContainer.scrollLeft}`);
    process.exit(1);
}
console.log(`PASS: Mouse drag moved scrollLeft to ${pillsContainer.scrollLeft}.`);

// Test selectSubtopic auto-scroll into view
sandbox.selectSubtopic('t5');
const t5Btn = pillBtns.find(b => b.getAttribute('data-topic') === 't5');
if (!t5Btn.scrolledIntoView) {
    console.error('FAIL: Active pill button was not scrolled into view');
    process.exit(1);
}
console.log('PASS: Selecting subtopic triggers auto-scroll into view for active pill.');

console.log('ALL TESTS PASSED SUCCESSFULLY!');
