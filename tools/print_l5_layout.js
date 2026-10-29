const levels = require('../levels.js');
const l5 = levels.GAME_LEVELS.find(l => l.id === 5);

const rows = [];

// Platforms
(l5.platforms || []).forEach(p => {
    const left = p.x;
    const w = p.w;
    rows.push({
        element: `Platform (${p.type})`,
        type: p.type,
        'x start': left,
        'x end': left + w,
        'top y': p.y
    });
});

// Pits
(l5.pits || []).forEach(p => {
    rows.push({
        element: 'The Bridge Pit',
        type: 'pit',
        'x start': p.x,
        'x end': p.x + p.w,
        'top y': 600
    });
});

// Spikes
(l5.spikes || []).forEach(s => {
    rows.push({
        element: 'Honest Floor Spikes (S1)',
        type: 'spikes',
        'x start': s.x - s.width / 2,
        'x end': s.x + s.width / 2,
        'top y': s.y
    });
});

// Hazards
(l5.telegraphedHazards || []).forEach(h => {
    rows.push({
        element: 'Honest Patrol Saw (Saw A)',
        type: h.type,
        'x start': h.x,
        'x end': h.x + (h.distance || 0),
        'top y': h.y - h.radius
    });
});

// Checkpoints
(l5.checkpoints || []).forEach(cp => {
    rows.push({
        element: `Checkpoint (${cp.id})`,
        type: 'checkpoint_flag',
        'x start': cp.x - 20,
        'x end': cp.x + 20,
        'top y': cp.y
    });
});

// Goal
rows.push({
    element: 'Level Exit Goal',
    type: 'goal',
    'x start': l5.goal.x - 30,
    'x end': l5.goal.x + 30,
    'top y': l5.goal.y
});

// Pranks
(l5.pranks || []).forEach(p => {
    const w = p.w || 40;
    const start = p.x !== undefined ? p.x : (p.landX || 0);
    rows.push({
        element: `Prank (${p.type}: ${p.bubbleText || p.text || ''})`,
        type: p.type,
        'x start': start,
        'x end': start + (p.w || 0),
        'top y': p.y || 600
    });
});

rows.sort((a, b) => a['x start'] - b['x start']);
console.table(rows);

