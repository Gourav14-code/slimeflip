const fs = require('fs');
const path = require('path');

['check_platform.js', 'backup_levels.js'].forEach(f => {
    const p = path.join(__dirname, f);
    if (fs.existsSync(p)) {
        fs.unlinkSync(p);
        console.log('Removed ' + f);
    }
});

