module.exports = {
    name: 'world-status',
    async execute(args, client) {
        const axios = require('axios');

        const config = require('../json/config.json');
        const constants = require('../json/constants.json');
        const channel = client.channels.cache.get(args.channel_id);
        const world_id = args.world_id;

        async function getRequest(URL) {
            try {
                return await axios.get(URL);
            }
            catch(error) {
                if (error.code == 'ECONNRESET') {
                    console.log('ECONNRESET ' + URL);
                    return undefined;
                }
                console.log(error);
            }
        }

        async function getWorldState() {
            const url = `http://census.daybreakgames.com/s:${config.dbg_api.service_id}/get/ps2:v2/world?world_id=${world_id}&c:show=state,world_id`;
            const request = await getRequest(url);
            return request.data.world_list[0].state;
        }

        async function updateState() {
            const current_state = await getWorldState(world_id);
            if (current_state != previous_state) {
                console.log(`${world_name} is now ${current_state}. Previous state was ${previous_state}`);
                channel.send(`${world_name} just changed it's state to ${current_state}`);
            }
            previous_state = current_state;
        }

        let previous_state = await getWorldState(world_id);

        const world_name = (constants.worlds.filter(obj => obj.world_id == world_id))[0].name;

        setInterval(updateState, 600000);
    },
};