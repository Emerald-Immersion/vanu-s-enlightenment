class requirement_obj {
    constructor(requested_cert_group, username) {
        // cert_groups (Ranks) -> cert_group categories -> req_loadouts (Vehicle Engineer, AV harasser) -> loadout_category (infantry certs, vehicle certs)
        //                                                  ^-> requirements (Any AI weapon, adrenaline shield)
        // Message structure:
        // 1 cert_group -> multiple categories -> multiple loadouts -> multiple requirements
        this.uncache(['./certs/cert_groups.js', './certs/loadout_categories.js', './certs/req_loadouts.js', '../js/census_rest.js', './certs/requirements.js']);
        const { list: cert_groups } = require('./certs/cert_groups.js');
        const { list: loadout_categories } = require('./certs/loadout_categories.js');
        const { list: req_loadouts } = require('./certs/req_loadouts.js');

        this.required_skills = [];
        this.static = {
            requested_cert_group: requested_cert_group.toLowerCase(),
            username: username.toLowerCase(),
        };

        this.static.cert_group = cert_groups.find(({ name }) => name.toLowerCase() == this.static.requested_cert_group);
        this.static.loadouts = this.req_filter(req_loadouts, 'loadout_category_id', this.static.cert_group.requirements.loadout_categories);
        this.categories = loadout_categories.filter(({ id }) => this.static.loadouts
            .some(({ loadout_category_id }) => loadout_category_id == id)
            && this.static.cert_group.requirements.loadout_categories.includes(id));
    }
    async uncache(uncache = []) {
        for (const module of uncache) {
            try {
                delete require.cache[require.resolve(module)];
            }
            catch (error) {
                if (error.code != 'MODULE_NOT_FOUND') throw(error);
            }
        }
    }
    async charRequest() {
        const { get } = require('../js/census_rest.js');

        // Base query and dynamic arguments
        let query = 'character?c:join=outfit_member^on:character_id^list:0^inject_at:outfit_member^show:member_since\'outfit_id(outfit^on:outfit_id^list:0^inject_at:outfit^show:name\'alias),characters_item^on:character_id^list:1^inject_at:items,characters_skill^on:character_id^list:1^inject_at:skills';
        query += `^terms:${this.required_skills.map((v) => `skill_id=${v.id}`).join('\'')}`;
        query += `&name.first_lower=${this.static.username}`;

        this.static.character = (await get(query, 'character_list'))[0];
    }
    async buildRequirementsObj() {
        const promises = [];

        // Find all loadouts for the required categories
        for (const category_index in this.categories) {
            const cat_id = this.categories[category_index].id;
            this.categories[category_index].loadouts = this.req_filter(this.static.loadouts, 'loadout_category_id', cat_id);

            promises.push(this.buildLoadouts(category_index));
        }

        // Wait for all loadouts to finish building
        await Promise.all(promises);
        if (this.required_skills.length == 0) {
            this.required_skills.push(0);
        }
    }
    async buildLoadouts(cat_index) {
        const { items: item_requirements, skills: skill_requirements } = require('./certs/requirements.js');

        const category = this.categories[cat_index];

        for (const loadout_index in category.loadouts) {
            const loadout_id = category.loadouts[loadout_index].id;
            this.categories[cat_index].loadouts[loadout_index].requirements = this.req_filter(item_requirements, 'req_loadout_id', loadout_id);
            const skills = this.req_filter(skill_requirements, 'req_loadout_id', loadout_id);
            for (const skill of skills) {
                skill.isSkill = true;
                this.required_skills.push(skill);
                this.categories[cat_index].loadouts[loadout_index].requirements.push(skill);
            }
        }
    }
    async createMessage() {
        let message = [];
        const char = this.static.character;
        message.push(`> **Showing __${this.static.cert_group.name}__ requirements for __${char.name.first}__**`);
        const cert_group_req = this.static.cert_group.requirements;

        if (char?.outfit_member?.outfit != null && cert_group_req?.time_in_outfit > 0) {
            const enough_time = (Date.now() - (Number(char.outfit_member.member_since) * 1000)) > cert_group_req.time_in_outfit ? '✅' : '❌';
            message.push(`${enough_time} \`At least ${cert_group_req.time_in_outfit_readable} in ${char.outfit_member.outfit.alias}\``);
        }
        else if (!char?.outfit_member?.outfit) {
            message.push('Error: Unable to retrieve outfit from API');
        }
        message.push('');

        for (const group_cat_index in this.static.cert_group.requirements.categories) {
            const group_cat = this.static.cert_group.requirements.categories[group_cat_index];
            message.push(`**${group_cat.description(group_cat)}**:`);
            let finished_loadouts = 0;
            let loadouts = 0;

            for (const loadout_cat_index in this.categories) {
                const cat = this.categories[loadout_cat_index];
                if (!group_cat.cat_id.includes(cat.id)) continue;
                message.push(`**${cat.name}**:`);

                for (const loadout_index in cat.loadouts) {
                    const loadout = cat.loadouts[loadout_index];
                    const requirement_msg = [];
                    message.push(`__${loadout.name}__:`);

                    for (const req_index in loadout.requirements) {
                        loadouts++;
                        const req = loadout.requirements[req_index];
                        const req_id = req.id;

                        let finished = false;
                        const req_type = req.isSkill ? 'skill' : 'item';
                        if (char[req_type + 's'] == undefined) {
                            finished = false;
                        }
                        else if (Array.isArray(req_id)) {
                            finished = req_id.some(id => char[req_type + 's'].some(item => item[req_type + '_id'] == id && (!req?.expression || req?.expression?.(item))));
                        }
                        else {
                            finished = char[req_type + 's'].some(item => item[req_type + '_id'] == req_id && (!req?.expression || req?.expression?.(item)));
                        }
                        loadout.requirements[req_index].finished = finished;
                        requirement_msg.push(`${finished ? '✅' : '❌'} \`${req.name}\``);
                    }
                    if (loadout.requirements.every(req => req.finished)) {
                        finished_loadouts++;
                        message.push('✅ Requirements fulfilled');
                        continue;
                    }
                    message = message.concat(requirement_msg);
                }
                // if (this.categories.length == array_index) message.splice(array_index + 1, 0, '');
            }
            // Under title show category progress ✅ if finished, otherwise `finished/total`
            const array_index = 1 + Number(group_cat_index);
            message.splice(array_index, 0, `*${group_cat.name}*: ${finished_loadouts}/${loadouts} finished`);
            message.push('');
        }
        this.message = message.join('\n');
    }
    async build() {
        await this.buildRequirementsObj();
        await this.charRequest();
        await this.createMessage();
    }
    req_filter(array = [], id_field_name = '', id = 0) {
        const id_is_array = (Array.isArray(id));
        // Filter field (type: array or int) inside an array with id
        return array.filter(({ [id_field_name]: id_field }) => {
            // id argument is array
            if (id_is_array) {
                // id argument AND id_field are array
                if (Array.isArray(id_field)) {
                    return id.some(v => id_field.includes(v));
                }
                // id argument is array, id_field is not
                return id.includes(id_field);
            }
            // id argument is not array
            // id_field is array
            if (Array.isArray(id_field)) {
                return id_field.includes(id);
            }
            // id argument AND id_field are number
            return (id_field == id);
        });

    }
}
module.exports = {
    name: 'certs',
    args: false,
    guildOnly: false,
    aliases: [],
    help: '!certs <username> <cert group>; Shows certification progress\n!certs groups; Shows all available certification groups', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args) {
        const { get } = require('../js/census_rest.js');
        const { list: cert_groups } = require('./certs/cert_groups.js');
        const query = await get(encodeURI(`character?name.first_lower=${args[0].toLowerCase()}`), 'count', true);
        if (query == undefined) {
            return message.reply('API unreachable');
        }
        const user_exists = Number(query) > 0;
        const cert_group_exists = cert_groups.some(({ name }) => name.toLowerCase() == args[1]?.toLowerCase());

        if (!user_exists) {
            message.reply('Username does not exist');
        }
        if (!cert_group_exists) {
            message.reply('Cert group (rank) does not exist');
        }
        if (!user_exists || !cert_group_exists) {
            return;
        }
        const user_requirements = new this.requirement_obj(args[1], args[0]);
        await user_requirements.build();
        message.channel.send(user_requirements.message);
    },
    requirement_obj,
};