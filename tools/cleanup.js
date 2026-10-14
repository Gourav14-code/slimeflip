const fs = require('fs');
const path = require('path');

const files = [
    path.join(__dirname, 'diagnose_level9.js'),
    path.join(__dirname, 'test_gap_math.js'),
    path.join(__dirname, 'check_warning.js')
];

files.forEach(f => {
    if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        console.log('Removed:', f);
    }
});

