const counts = new Map();
const add = (name, amount = 1) => counts.set(name, (counts.get(name) || 0) + amount);
const render = () => [...counts].map(([name,value]) => `tathabbat_${name} ${value}`).join('\n') + '\n';
module.exports = { add, render };
