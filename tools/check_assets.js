const fs = require('fs');
const path = require('path');

const dir1 = path.join(__dirname, '..', 'assets', 'zone 1');
const dir2 = path.join(__dirname, '..', 'assets', 'zone1');

console.log('--- Assets in "zone 1" ---');
if (fs.existsSync(dir1)) {
    fs.readdirSync(dir1).forEach(f => console.log('zone 1:', f));
} else {
    console.log('zone 1 does not exist');
}

console.log('--- Assets in "zone1" ---');
if (fs.existsSync(dir2)) {
    fs.readdirSync(dir2).forEach(f => console.log('zone1:', f));
} else {
    console.log('zone1 does not exist');
}

