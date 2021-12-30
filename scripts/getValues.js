const fs = require('fs');

async function main() {
  const filename = process.argv[2];
  if (!filename) throw new Error('must pass a filename');
  const courses = JSON.parse(fs.readFileSync(filename).toString('utf8'));
  const keys = {};
  courses.forEach((cls) =>
    Object.entries(cls).forEach(([key, value]) => {
      if (!(key in keys)) keys[key] = new Set();
      keys[key].add(value);
    })
  );
  const result = {};
  Object.entries(keys).forEach(([key, set]) => (result[key] = [...set]));
  console.log(JSON.stringify(result, null, 2));
}

main();
