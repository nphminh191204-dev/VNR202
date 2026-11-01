const fs = require('fs');
const vm = require('vm');

const context = { window: {} };
context.window = context;
vm.createContext(context);
vm.runInContext(fs.readFileSync('data/vnr202.js', 'utf8'), context);
const list = context.window.VNR202_DATA.questionsList;

console.log('--- SEARCHING FOR ANY VARIATIONS OF SELECTING MULTIPLE ---');
const regex = /chọn\s*(?:2|3|hai|ba|nhiều|các|đúng|sai|những)|(?:những|các)\s*đáp án|(?:những|các)\s*phương án|lựa chọn/i;

list.forEach(q => {
  if (regex.test(q.content)) {
    console.log(`ID ${q.id}: ${q.content}`);
    const correctAnswers = q.answersList.filter(a => a.is_correct);
    console.log(`  Correct count: ${correctAnswers.length}`);
    q.answersList.forEach(a => console.log(`    [${a.is_correct}] #${a.id}: ${a.content}`));
  }
});

