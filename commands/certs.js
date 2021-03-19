class requirement_obj {
    constructor(username, requested_cert_group) {

    }
}
module.exports = {
    name: 'certs',
    args: false,
    guildOnly: false,
    aliases: [],
    help: '!certs <username> <cert group>; Shows certification progress\n!certs groups; Shows all available certification groups', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute({ channel }, args) {
        // cert_groups (Ranks) -> req_loadouts (Vehicle Engineer, AV harasser) -> loadout_category (infantry certs, vehicle certs)
        //                          ^-> requirements (Any AI weapon, adrenaline shield)
        // const { list: cert_groups } = require('certs/cert_groups');
        // const { list: loadout_categories } = require('certs/loadout_categories');
        // const { list: req_loadouts } = require('certs/req_loadouts');
        const { skills: skill_requirements, items: item_requirements } = require('./certs/requirements');
        const { get } = require('../js/census_rest');
        const uncache = ['../js/census_rest', './certs/requirements', 'certs/req_loadouts', 'certs/loadout_categories', 'certs/cert_groups']

        if (await this.groupsCmd(args)) {
            return;
        }

        if (args[0] == null || args[1] == null) {
            channel.send(`Wrong arguments, see the following for usage:\n\`${this.help}\``);
            return;
        }

        const username = args[0];
        const requested_cert_group = args[1];

        const query = `character?c:join=characters_item^on:character_id^list:1^inject_at:items,characters_skill^on:character_id^list:1^inject_at:skills^terms:${skill_requirements.map((v, i) => `skill_id=${v.id}`).join(`'`)}&name.first_lower=${username}`;

        const character_skill = get(query, 'character_list');
        character_skill.then((response) => {
            console.log(response[0].skills);
            this.uncache(uncache);
        });
    },
    async groupsCmd(args = []) {
        if (args[0] != 'groups') return false;
        return true;
    },
    async uncache(uncache = []) {
        for (const module of uncache) {
            try {
                delete require.cache[require.resolve(module)];
            }
            catch (error) {
                if (error.code != 'MODULE_NOT_FOUND') throw(error);
            }
        }
    },
    requirement_obj,
};