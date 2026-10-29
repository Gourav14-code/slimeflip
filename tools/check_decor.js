const fs = require('fs');

function check(p) {
    console.log('Dir:', p);
    if (!fs.existsSync(p)) { console.log('Does not exist'); return; }
    fs.readdirSync(p).forEach(f => {
        if (f.toLowerCase().includes('lantern') || f.toLowerCase().includes('glow') || f.toLowerCase().includes('shroom') || f.toLowerCase().includes('decor')) {
            console.log('  FOUND:', f);
        }
    });
}

check('assets/zone1');
check('assets/zone 1');
if (fs.existsSync('D:/Slimegame/assets/zone 1')) {
    check('D:/Slimegame/assets/zone 1');
} else {
    console.log('D:/Slimegame/assets/zone 1 does not exist');
}

