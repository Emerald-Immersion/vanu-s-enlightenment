class requirements {
    // List of items, can be multiple for a requirement
    // Example: Any AI weapon, any cloak
    static items = [
        { id: ['17013', '16032'], req_loadout_id: 0, name: 'Any left hand Anti-Vehicle Max Arm (excl Gorgons)' }, // 17001 is RH Comet. 17013 is LH Comet. 16032 is Vortex
        { id: '17016', req_loadout_id: 0, name: 'Left hand burster' }, // 17004 is RH burster
        { id: '101', req_loadout_id: 1, name: 'Medical Kits (x4)', expression: function(item) { return item.stack_count >= 4;} }
    ]
    static skills = [
        { id: '2203', req_loadout_id: 2, name: 'Anti-Infantry MANA Turret 5 (Engineer Passive Systems)' },
        { id: '92', req_loadout_id: 2, name: 'Magburner 3' }
    ]
}

module.exports = requirements;