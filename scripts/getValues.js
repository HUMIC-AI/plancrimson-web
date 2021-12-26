// const courses = require('./download1 (1).json');
const fs = require('fs');

async function main() {
  const keys = {};
  courses.classes.forEach((cls) =>
    Object.entries(cls).forEach(([key, value]) => {
      if (!(key in keys)) keys[key] = new Set();
      keys[key].add(value);
    })
  );
  const result = {};
  Object.entries(keys).forEach(([key, set]) => (result[key] = [...set]));
  fs.writeFileSync('out.json', JSON.stringify(result, null, 2));
}

main();
