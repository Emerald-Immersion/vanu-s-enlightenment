const census_rest = require('./census_rest');

class constants {
    constructor() {
        this.zones = local_zones;
        this.worlds = local_worlds;
        this.factions = local_factions;
        this.initPromise = this.update();
    }
    async update(toUpdate = 'all') {
        const promises = [];
        switch (toUpdate) {
        case 'zones': {
            promises.push(this.updateZones());
            break;
        }

        case 'worlds': {
            promises.push(this.updateWorlds());
            break;
        }

        case 'factions': {
            promises.push(this.updateFactions());
            break;
        }

        case 'all':
            promises.push(this.updateZones());
            promises.push(this.updateWorlds());
            promises.push(this.updateFactions());
            break;
        }
        await Promise.all(promises);
    }
    async updateZones() {
        const rest_zones = (await census_rest.get(
            'zone?c:limit=1000&c:lang=en&' +
            'c:tree=zone_id^list:0',
            'zone_list')
        )[0];
        const fields = ['name', 'description', 'hex_size'];

        this.zones = await this.buildObject(rest_zones, fields, 'zone', this.zones);
    }
    async updateWorlds() {
        const rest_worlds = (await census_rest.get(
            'world?c:limit=1000&' +
            'c:lang=en&c:tree=world_id^list:0',
            'world_list')
        )[0];
        const fields = ['state', 'name'];

        this.worlds = await this.buildObject(rest_worlds, fields, 'world', this.worlds);
    }
    async updateFactions() {
        const rest_factions = (await census_rest.get(
            'faction?c:limit=100&c:lang=en&' +
            'c:tree=faction_id^list:0',
            'faction_list')
        )[0];
        const fields = ['name', 'code_tag', 'user_selectable'];

        this.factions = await this.buildObject(rest_factions, fields, 'faction', this.factions);
    }
    async buildObject(rest_collection, fields, collection_name, old_obj) {
        const output = old_obj;
        for (const rest_key in rest_collection) {

            for (const field of fields) {
                // Make sure object paths exist
                if (
                    typeof rest_collection?.[rest_key]?.[field] === 'string'
                    || typeof rest_collection?.[rest_key]?.[field]?.en === 'string'
                ) {
                    const rest_field = rest_collection[rest_key][field];
                    // create object path in output if it doesn't exist
                    if (!(rest_key in output)) {
                        output[rest_key] = {};
                    }

                    // Update the path
                    output[rest_key][field] = this.flattenEnField(rest_field);

                    // Put the ID field back
                    output[rest_key][collection_name + '_id'] = rest_key;
                }
            }
        }
        output.updated_at = Date.now();
        return output;
    }
    flattenEnField(field) {
        // eslint-disable-next-line no-prototype-builtins
        if (field.hasOwnProperty('en')) {
            return field.en;
        }
        else {
            return field;
        }
    }
}

module.exports.constants = constants;

const local_zones = {
    '2': {
        zone_id: '2',
        name: 'Indar',
        description: 'The arid continent of Indar is home to multiple biomes, providing unique challenges for its combatants.',
        thumbnail: 'https://raw.githubusercontent.com/emerald-immersion/Vanu-s-Enlightenment/master/images/Indar.jpg',
        color: '#e7b89a',
        isMain: true,
    },
    '4': {
        zone_id: '4',
        name: 'Hossin',
        description: 'Hossin\'s dense mangrove and willow forests provide air cover along its many swamps and highlands.',
        thumbnail: 'https://i.ytimg.com/vi/RSOXlSVHrac/maxresdefault.jpg',
        color: '#4a745e',
        isMain: true,
    },
    '6': {
        zone_id: '6',
        name: 'Amerish',
        description: 'Amerish\'s lush groves and rocky outcroppings provide ample cover between its rolling plains and mountain passes.',
        thumbnail: 'http://www.legamer.com/wp-content/uploads/PS2_Amerish_Screenshot_103012_005.jpg',
        color: '#73c46a',
        isMain: true,
    },
    '8': {
        zone_id: '8',
        name: 'Esamir',
        description: 'Esamir\'s expanses of frigid tundra and craggy mountains provide little cover from airborne threats.',
        thumbnail: 'http://www.sggaminginfo.com/wp-content/gallery/planetside2-2137-764/PS2_Esamir_Screenshot_100412_4.jpg',
        color: '#FFFFFE',
        isMain: true,
    },
    '14': {
        zone_id: '14',
        name: 'Koltyr',
        // description: 'No description',
        // thumbnail: 'http://www.sggaminginfo.com/wp-content/gallery/planetside2-2137-764/PS2_Esamir_Screenshot_100412_4.jpg',
        // color: '#FFFFFE',
        isMain: true,
    },
    '96': {
        zone_id: '96',
        name: 'VR training zone (NC)',
        description: 'Experiment with all weapons, vehicles and attachments in your empire\'s own VR Training simulator.',
        isMain: false,
    },
    '97': {
        zone_id: '97',
        name: 'VR training zone (TR)',
        description: 'Experiment with all weapons, vehicles and attachments in your empire\'s own VR Training simulator.',
        isMain: false,
    },
    '98': {
        zone_id: '98',
        name: 'VR training zone (VS)',
        description: 'Experiment with all weapons, vehicles and attachments in your empire\'s own VR Training simulator.',
        isMain: false,
    },
    other: {
        zone_id: 'other',
        name: 'Unkown continent',
        description: 'No description specified',
        isMain: false,
    },
};

const local_worlds = {
    '10': {
        world_id: '10',
        name: 'Miller',
    },
    '19': {
        world_id: '19',
        name: 'Jaeger',
    },
    '17': {
        world_id: '17',
        name: 'Emerald',
    },
    '1': {
        world_id: '1',
        name: 'Connery',
    },
    '13': {
        world_id: '13',
        name: 'Cobalt',
    },
    '40': {
        world_id: '40',
        name: 'SolTech',
    },
};

const local_factions = {
    '0': {
        faction_id: '0',
        name: 'None',
        code_tag: 'None',
        user_selectable: '0',
    },
    '1': {
        faction_id: '1',
        name: 'Vanu Sovereignty',
        code_tag: 'VS',
        user_selectable: '1',
    },
    '2': {
        faction_id: '2',
        name: 'New Conglomerate',
        code_tag: 'NC',
        user_selectable: '1',
    },
    '3': {
        faction_id: '3',
        name: 'Terran Republic',
        code_tag: 'TR',
        user_selectable: '1',
    },
    '4': {
        faction_id: '4',
        name: 'NS Operatives',
        code_tag: 'NSO',
        user_selectable: '1',
    },
};