module.exports = {
    // The group the certification belongs to
    // Example: ranks
    list: [
        {
            id: 0,
            name: 'Chosen',
            requirements: {
                time_in_outfit: 7776000000, // 90 days
                time_in_outfit_readable: '90 days',
                loadout_categories: [0, 1, 2],
                categories: [
                    {
                        id: 0,
                        cat_id: [0], // Infantry certs
                        amount: 2,
                        name: (category) => `Choose ${category.amount} loadouts from infantry certifications`,
                    },
                    {
                        id: 1,
                        cat_id: [1, 2], // Vehicle certs
                        amount: 3,
                        name: (category) => `Mix and match ${category.amount} loadouts from infantry and air certifications`,
                    },
                ],
            },
        },
        {
            id: 1,
            name: 'Devoted',
            requirements: {
                time_in_outfit: 2592000, // 30 days
                categories: [
                    {
                        cat_id: [0, 1], // Infantry and vehicle certs grouped
                        amount: 5,
                    },
                ],
            },
        },
    ],
};