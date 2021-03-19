module.exports = {
    name: 'server-pop',
    args: false,
    guildOnly: false,
    aliases: ['pop', 'serverpop', 'serverPop'], // Aliases for the command
    help: '!server-pop [server name or ID]; Show a server\'s population. Can request multiple servers. Aliases: !pop, !serverpop, !serverPop. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config, constants, client) {
        console.log(`${this.name} run`);
        const axios = require('axios');
        message.channel.startTyping();

        function requestAPIdata(world_name, world_id) {
            axios.get(`https://ps2.fisu.pw/api/population/?world=${world_id}`)
                .then(response => {
                    const r = response.data.result[0];
                    const vs = r.vs;
                    const tr = r.tr;
                    const nc = r.nc;
                    sendPopMessage(vs, tr, nc, world_name);
                })
                .catch(error => {
                    message.channel.send('Something went wrong with requesting the data from Fisu API');
                    console.log(error);
                });
        }

        function sendPopMessage(vs, tr, nc, world_name) {
            console.log(world_name);
            const total = parseInt(vs) + parseInt(tr) + parseInt(nc);
            message.channel.send(`${world_name} Server Population:\n    ${VS}:      ${vs}\n    ${TR}:      ${tr}\n    ${NC}:      ${nc}\nTotal:      ${total}`);
        }

        function createMessage(requested_world_id) {
            // Message when no world specified
            if (requested_world_id === undefined || requested_world_id == '10') {
                requestAPIdata('Miller', '10');
            }
            // Message for world name
            else if (constants.worlds.some(x => x.name.toLowerCase() == requested_world_id.toLowerCase())) {
                const world = constants.worlds.find(x => x.name.toLowerCase() == requested_world_id.toLowerCase());
                requestAPIdata(world.name, world.world_id);
            }
            // Message for world ID
            else if (constants.worlds.some(x => x.world_id == requested_world_id) === true) {
                const world = constants.worlds.find(x => x.world_id == requested_world_id);
                requestAPIdata(world.name, world.world_id);
            }
            // Message for all servers combined
            else if (requested_world_id === 'total' || requested_world_id === 'all') {
                const requests = [];
                constants.worlds.forEach(element => {
                    requests.push(axios.get(`https://ps2.fisu.pw/api/population/?world=${element.world_id}`));
                });

                axios.all(requests).then(axios.spread((...responses) => {
                    let total_vs = 0;
                    let total_tr = 0;
                    let total_nc = 0;

                    responses.forEach(element => {
                        const r = element.data.result[0];
                        total_vs += parseInt(r.vs);
                        total_tr += parseInt(r.tr);
                        total_nc += parseInt(r.nc);
                    });
                    sendPopMessage(total_vs, total_tr, total_nc, requested_world_id);
                })).catch(errors => {
                    console.log(errors);
                });
            }
            else {
                message.channel.send('You used the command in the wrong way. Try correcting your server (world) name or ID. Or use "total" or "all" to get population for all servers');
            }
        }
        const unique = [...new Set(args)];
        const requested_world_id = unique.slice(0, constants.worlds.length + 1);

        requested_world_id.forEach(element => { createMessage(element); });
        if (args[0] == undefined) createMessage();

        const VS = client.emojis.cache.get('683285085818191976');
        const TR = client.emojis.cache.get('683285084463431720');
        const NC = client.emojis.cache.get('683285084320694302');

        message.channel.stopTyping();
    },
};
