module.exports = {
    items: [
        { id: ['17013', '16032'], req_loadout_id: [6], name: 'Any left hand Anti-Vehicle Max Arm (excl Gorgons)' }, // 17001 is RH Comet. 17013 is LH Comet. 16032 is Vortex
        { id: '17016', req_loadout_id: [6], name: 'Left hand burster' }, // 17004 is RH burster
        { id: '101', req_loadout_id: [5], name: 'Medical Kits (x4)', expression: (item) => item?.stack_count && item.stack_count >= 4 },
        { id: ['1612', '1621', '1630', '803792', '803797', '803802', '6005377', '6006611'], req_loadout_id: [2, 7], name: '(AE) Medical Applicator 6' },
        { id: ['8884', '8885', '8886', '6005390'], req_loadout_id: [2, 7], name: 'Nano-Regen Device 6' },
        { id: '884', req_loadout_id: [2, 7], name: 'Nanite Revive Grenade' },
        { id: ['432'], req_loadout_id: [2, 7], name: 'Any type of 2 bricks of C-4', expression: (item) => item?.stack_count && item.stack_count >= 2 },

    ],
    skills: [
        { id: '2203', req_loadout_id: [3], name: 'Anti-Infantry MANA Turret 5 (Engineer Passive Systems)' },
        { id: '92', req_loadout_id: [999999], name: 'Magburner 3' },
    ],
};