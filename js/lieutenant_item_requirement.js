module.exports =	[
    // Medic
    { 'id': '1630', 'name': 'Medical Applicator 6' },
    { 'id': '8886', 'name': 'Nano-Regen Device 6' },
    { 'id': '8130', 'name': 'Combat Medic Flak Armour 5' },
    { 'id': '884', 'name': 'Nanite Revive Grenade' },

    // Engineer
    { 'id': '8125', 'name': 'Engineer Flak Armour 5' },
    { 'id': '6010', 'name': 'Nano-Armor Kit 6 (VS)' },
    { 'id': '1278', 'name': 'Ammunition Package 6' },
    { 'id': '6004531', 'name': 'Reserve Hardlight Barrier' },

    // Heavy
    { 'id': '7697', 'name': 'Heavy Assault Flak Armour 5' },
    { 'id': '101', 'name': 'Medical Kits (x4)', 'func': function(item) {return item.stack_count >= 4;} },
    { 'id': '8823', 'name': 'Adrenaline Shield 5' },
    { 'id': '1096', 'name': 'Concussion Grenades' },

    // MAX
    { 'id': '6002683', 'name': 'MAX Emergency Repair 6' },
    { 'id': '14115', 'name': 'MAX Ordnance Armor 5' },
    { 'id': ['17012', '17030', '17024', '7520', '17025'], 'name': 'Any right hand Anti-Infantry Max Arm (excl Gorgons)' }, // 17000 is the LH quasar, 17012 is RH Quasar, 17030 is RH Blueshift, 17024 is RH Nebula, 7520 and 17025 are Cosmos
    { 'id': ['17013', '16032'], 'name': 'Any left hand Anti-Vehicle Max Arm (excl Gorgons)' }, // 17001 is RH Comet. 17013 is LH Comet. 16032 is Vortex
    { 'id': '17016', 'name': 'Left hand burster' }, // 17004 is RH burster

    // Sunderer
    { 'id': '3006', 'name': 'Sunderer Fire Suppression 4' },
    { 'id': ['2847', '2848', '2849'], 'name': 'Sunderer Gate Shield Diffuser 2 (or higher)' }, // Sunderer GSD 2,3,4
    { 'id': '5923', 'name': 'Deployment Shield 4' },
    { 'id': '3046', 'name': 'Sunderer Racer High Speed Chasis 3' },

    // Lightning
    { 'id': '3116', 'name': 'Lightning Fire Suppression 4' },
    { 'id': '6003651', 'name': 'Lightning Flanker Armour 4 (not needed for Axil2, according to Axil2)' },
    { 'id': ['3103', '6005070'], 'name': 'Lightning AP Cannon (L100 Python AP or Halloween Variant)' },

    // Galaxy
    { 'id': '5532', 'name': 'Galaxy Fire Suppression 4' },
    { 'id': '5736', 'name': 'Galaxy Nanite Proximity Repair System 6' },
    { 'id': '5687', 'name': 'Galaxy High-G Airframe 3' },
    { 'id': '5514', 'name': 'Galaxy M60-A Bulldog (Left)' },
    { 'id': '5515', 'name': 'Galaxy M60-A Bulldog (Right)' },
    { 'id': '5512', 'name': 'Galaxy Walker (Top)' },
    { 'id': '5513', 'name': 'Galaxy Walker (Tail)' },

    // Valkyrie
    { 'id': '6584', 'name': 'Valkyrie Vehicle Stealth 4' },
    { 'id': '6595', 'name': 'Valkyrie Hover Stability Airframe 3' },
];
