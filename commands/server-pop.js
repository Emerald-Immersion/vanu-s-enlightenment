module.exports = {
    name: 'server-pop',
    args: false,
    guildOnly: false,
    aliases: ['pop', 'serverpop', 'serverPop'], // Aliases for the command
    help: '!server-pop [server name or ID]; Show a server\'s population. Can request multiple servers. Aliases: !pop, !serverpop, !serverPop. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config, constants, client) {
        const axios = require('axios');
        const discord = require('discord.js');

        const VS = client.emojis.cache.get('683285085818191976');
        const TR = client.emojis.cache.get('683285084463431720');
        const NC = client.emojis.cache.get('683285084320694302');
        const NS = client.emojis.cache.get('722816749707198574');

        function requestAPIdata(world_name, world_id) {
            axios.get(`https://ps2.fisu.pw/api/population/?world=${world_id}`)
                .then(response => {
                    const r = response.data.result[0];
                    const vs = r.vs;
                    const tr = r.tr;
                    const nc = r.nc;
                    const ns = r.ns;
                    sendPopMessage(vs, tr, nc, ns, world_name);
                })
                .catch(error => {
                    message.channel.send('Something went wrong with requesting the data from Fisu API');
                    console.log(error);
                });
        }

        function sendPopMessage(vs, tr, nc, ns, world_name) {
            message.channel.send(`${world_name} Server Population:\n${genFacPop(parseInt(vs), parseInt(nc), parseInt(tr), parseInt(ns))}`);
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

        function genFacPop(vs, nc, tr, ns) {
            const total = vs + nc + tr + ns;
            return `
${VS}: __${vs}__ (${Math.round(vs / total * 100)}%)
${TR}: __${tr}__ (${Math.round(tr / total * 100)}%)
${NC}: __${nc}__ (${Math.round(nc / total * 100)}%)
${NS}: __${ns}__ (${Math.round(ns / total * 100)}%)
Total: **${total}**
            `.trim();
        }

        function formatTime(date) {
            return ('0' + date.getHours()).slice(-2) + ':' + ('0' + date.getMinutes()).slice(-2);
        }

        async function detailedPop(world) {
            const mariadb = require('mariadb');
            const db_conn = await mariadb.createConnection({ host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port });
            const last_pop = (await db_conn.query('SELECT * FROM `continent_population` WHERE world_id = ? ORDER BY pop_item_ID DESC LIMIT 1', [world.world_id]))[0];
            db_conn.end();
            const current_zone_ids = ['2', '4', '6', '8', '344'];

            if (last_pop == undefined) return message.channel.send('Server does not have population data available');
            let total_pop = 0;
            for (const zone of constants.zones.filter(v => current_zone_ids.includes(v.zone_id))) {
                console.log(zone);
                for (const faction of ['vs', 'nc', 'tr', 'ns']) {
                    total_pop += last_pop[zone.name.toLowerCase() + '_' + faction];
                }
            }

            const embed = new discord.MessageEmbed()
                .setTitle(`Server population for ${world.name}`)
                .setTimestamp(last_pop.timestamp)
                .setDescription(`${total_pop} active players earning XP`)
                .setFooter('Percentages are rounded to the nearest integer')
                .setColor('#599FAB');

            for (const zone of constants.zones.filter(v => current_zone_ids.includes(v.zone_id))) {
                const pop = {
                    vs: last_pop[zone.name.toLowerCase() + '_vs'],
                    nc: last_pop[zone.name.toLowerCase() + '_nc'],
                    tr: last_pop[zone.name.toLowerCase() + '_tr'],
                    ns: last_pop[zone.name.toLowerCase() + '_ns'],
                };

                const zone_total = pop.vs + pop.nc + pop.tr + pop.ns;

                if (zone_total == 0) continue;

                embed.addField(zone.name, `
${zone_total} (${Math.round(zone_total / total_pop * 100)}%) active players earning XP.
${genFacPop(pop.vs, pop.nc, pop.tr, pop.ns)}
                `.trim(), true);
            }

            embed.addField('Time', formatTime(last_pop.timestamp) + ' UTC');

            if (total_pop != 0) message.channel.send({ embeds: [ embed ] });
            else message.channel.send('This server has no population');
        }

        if (args[0]?.toLowerCase() === 'help' || args[0] === undefined) {
            message.channel.send(`
**The following sub-commands are available:**
\`fisu [server(s)]\`: requests population from Fisu. Allows multiple servers at once.
\`detailed [server name]\`: shows more detailed information pulled from this bot's self gathered data. This is a per continent run down of total and per faction population as well as total server population. Only one server at a time.
\`help\`: shows this page.

__Aliases:__
\`detailed\`: \`bot\`, \`dt\`
            `);
        }
        else if (args[0]?.toLowerCase() === 'fisu') {
            args.shift();
            const unique = [...new Set(args)];
            const requested_world_id = unique.slice(0, constants.worlds.length + 1);

            requested_world_id.forEach(element => { createMessage(element); });
            if (args[0] == undefined) createMessage();
        }
        else if (['detailed', 'bot', 'dt'].includes(args[0]?.toLowerCase())) {
            if (args?.[1] && constants.worlds.some(x => x.name.toLowerCase() == args[1].toLowerCase())) {
                const world = constants.worlds.find(x => x.name.toLowerCase() == args[1].toLowerCase());
                detailedPop(world);
            }
            else {
                message.channel.send('Please specify a correct world/server');
            }
        }
        else {
            message.channel.send('This is not a correct sub command, use `!pop help` to show help');
        }
    },
};
