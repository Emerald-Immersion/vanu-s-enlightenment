module.exports = {
    // The group the certification belongs to
    // Example: ranks
    list: [
        {
            id: 0,
            name: 'Devoted',
            requirements: {
                time_in_outfit: 2592000000, // 30 days in miliseconds
                time_in_outfit_readable: '30 days',
                loadout_categories: [0, 1, 2],
                categories: [
                    {
                        id: 0,
                        cat_id: [3], // Devoted rank loadouts (medic)
                        amount: 1,
                        name: 'Devoted rank certifications',
                        description: () => 'This rank requires the following loadou:',
                    },
                    {
                        id: 1,
                        cat_id: [0], // Infantry
                        amount: 1,
                        name: 'Infantry certifications',
                        description: (category) => `Choose ${category.amount} loadout`,
                    },
                    {
                        id: 2,
                        cat_id: [1], // Vehicle
                        amount: 1,
                        name: 'Vehicle certifications',
                        description: (category) => `Choose ${category.amount} loadout`,
                    },
                    {
                        id: 2,
                        cat_id: [2], // Air
                        amount: 0,
                        name: 'Air certifications',
                        description: (category) => `Choose ${category.amount} loadout`,
                    },
                ],
            },
        },
    ],
};