import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync('index.html', 'utf8');
const failures = [];

if (!/^<!doctype html>/i.test(html.trimStart())) {
  failures.push('index.html must begin with <!doctype html>');
}
for (const tag of ['html', 'head', 'body', 'title', 'main', 'script']) {
  const open = (html.match(new RegExp('<' + tag + '(?:\\s|>)', 'gi')) || []).length;
  const close = (html.match(new RegExp('</' + tag + '\\s*>', 'gi')) || []).length;
  if (!open || open !== close) failures.push(`Expected balanced <${tag}> tags (open: ${open}, close: ${close})`);
}
const scripts = [...html.matchAll(/<script\\b[^>]*>([\s\S]*?)<\/script>/gi)];
if (!scripts.length) failures.push('No inline JavaScript found in index.html');

scripts.forEach((match, index) => {
  try {
    new vm.Script(match[1], { filename: `index.html:inline-script-${index + 1}` });
  } catch (error) {
    failures.push(`JavaScript block ${index + 1}: ${error.message}`);
  }
});

for (const id of ['habitList', 'habitForm', 'completedStat', 'dayProgress', 'week']) {
  if (!new RegExp('id=["\\']' + id + '["\\']').test(html)) {
    failures.push(`Required UI element #${id} is missing`);
  }
}

if (failures.length) {
  console.error('Habit Plus validation failed:');
  for (const failure of failures) console.error(' - ' + failure);
  process.exit(1);
}
console.log(`Habit Plus validation passed: HTML structure, ${scripts.length} JavaScript block(s), and required UI elements.`);
