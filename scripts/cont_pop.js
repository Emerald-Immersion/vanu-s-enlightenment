const paths = require('../js/paths');
module.exports = {
    name: 'cont_pop',
    async execute(args, client) {
        const WebSocket = require('ws');
        const mariadb = require('mariadb');
        const fs = require('fs');

        const config = require('../json/config.json');
        const loadouts = require('../json/loadouts.json');
        const worlds_info = require('../js/worlds');

        const db_options = { host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port };

        const { messages, worlds } = await createMsgRelatedArrs();

        let log_sub = 0;

        async function worldMessageEditor(unique_arr) {
            if (unique_arr.length == 0) return;
            const world_id = unique_arr[0].world_id;
            const indar = unique_arr.filter((e) => e.zone_id == '2');
            const hossin = unique_arr.filter((e) => e.zone_id == '4');
            const amerish = unique_arr.filter((e) => e.zone_id == '6');
            const esamir = unique_arr.filter((e) => e.zone_id == '8');

            const stats = {
                all: unique_arr.length,
                indar: {
                    num: {
                        all: indar.length,
                        vs: (loadout_idToFaction_id(indar, '1')).length,
                        nc: (loadout_idToFaction_id(indar, '2')).length,
                        tr: (loadout_idToFaction_id(indar, '3')).length,
                        ns: (loadout_idToFaction_id(indar, undefined, true)).length,
                    },
                },
                hossin: {
                    num: {
                        all: hossin.length,
                        vs: (loadout_idToFaction_id(hossin, '1')).length,
                        nc: (loadout_idToFaction_id(hossin, '2')).length,
                        tr: (loadout_idToFaction_id(hossin, '3')).length,
                        ns: (loadout_idToFaction_id(hossin, undefined, true)).length,
                    },
                },
                amerish:  {
                    num: {
                        all: amerish.length,
                        vs: (loadout_idToFaction_id(amerish, '1')).length,
                        nc: (loadout_idToFaction_id(amerish, '2')).length,
                        tr: (loadout_idToFaction_id(amerish, '3')).length,
                        ns: (loadout_idToFaction_id(amerish, undefined, true)).length,
                    },
                },
                esamir:  {
                    num: {
                        all: esamir.length,
                        vs: (loadout_idToFaction_id(esamir, '1')).length,
                        nc: (loadout_idToFaction_id(esamir, '2')).length,
                        tr: (loadout_idToFaction_id(esamir, '3')).length,
                        ns: (loadout_idToFaction_id(esamir, undefined, true)).length,
                    },
                },
            };

            stats.indar.percent = (stats.indar.num.all / stats.all * 100).toFixed(0);
            stats.hossin.percent = (stats.hossin.num.all / stats.all * 100).toFixed(0);
            stats.amerish.percent = (stats.amerish.num.all / stats.all * 100).toFixed(0);
            stats.esamir.percent = (stats.esamir.num.all / stats.all * 100).toFixed(0);

            const date = new Date;
            const date_string = `${intToTwoDigits(date.getUTCHours())}:${intToTwoDigits(date.getUTCMinutes())} ${intToTwoDigits(date.getUTCDate())}-${intToTwoDigits(date.getUTCMonth() + 1)} UTC`;

            const content = `Indar: ${stats.indar.num.all} (${stats.indar.percent}%)\nHossin: ${stats.hossin.num.all} (${stats.hossin.percent}%)\nAmerish: ${stats.amerish.num.all} (${stats.amerish.percent}%)\nEsamir: ${stats.esamir.num.all} (${stats.esamir.percent}%)\nTotal: ${stats.all}`;
            editMessages(`Active players for ${worlds_info.filter((obj) => obj.world_id == world_id)[0].name}:\`\`\`json\n${content}\`\`\`Last update: ${date_string}. Next update in ${args.interval / 60000} minutes`, world_id);
            appendFile('./log/pop.log', content + '\n');

            const db_conn = await mariadb.createConnection(db_options);
            await db_conn.query(`
                INSERT INTO continent_population
                (indar_vs, indar_nc, indar_tr, indar_ns, hossin_vs, hossin_nc, hossin_tr, hossin_ns, amerish_vs, amerish_nc, amerish_tr, amerish_ns, esamir_vs, esamir_nc, esamir_tr, esamir_ns, world_id, gather_time)
                VALUES
                (${stats.indar.num.vs}, ${stats.indar.num.nc}, ${stats.indar.num.tr}, ${stats.indar.num.ns}, ${stats.hossin.num.vs}, ${stats.hossin.num.nc}, ${stats.hossin.num.tr}, ${stats.hossin.num.ns}, ${stats.amerish.num.vs}, ${stats.amerish.num.nc}, ${stats.amerish.num.tr}, ${stats.amerish.num.ns}, ${stats.esamir.num.vs}, ${stats.esamir.num.nc}, ${stats.esamir.num.tr}, ${stats.esamir.num.ns}, ${world_id}, ${args.interval})
                `).catch(err => console.log(err));
            db_conn.end();
        }

        async function editMessages(content, world_id) {
            // const messages_for_world = messages.filter((obj) => obj.world_id == world_id);
            for (const message of messages.filter((obj) => obj.world_id == world_id)) {
                message.message.edit(`${content}. ID: ${message.autostart_ID}`);
            }
        }

        async function createMsgRelatedArrs() {
            const msg_arr = [];
            const world_id_arr = [];
            for (const instance of args.args) {
                const world_id = instance.world_id;
                const channel = await client.channels.cache.get(instance.channel_id);
                const msg = await channel.messages.fetch(instance.msg);
                msg_arr.push({ message: msg, world_id: world_id, autostart_ID: instance.autostart_ID });
                if (!world_id_arr.some((a) => a == world_id)) world_id_arr.push(world_id);
            }
            return { messages: msg_arr, worlds: world_id_arr };
        }

        function appendFile(filepath, data) {
            fs.appendFile(filepath, data, function(err) {
                if (err) throw err;
            });
        }

        function loadout_idToFaction_id(zone_array, faction_id, NS) {
            if (NS == undefined) NS = false;
            return zone_array.filter((e) => {
                const loadout = loadouts.find((el) => el.loadout_id == e.loadout_id);
                if (loadout == undefined) {
                    return NS;
                }
                return loadout.faction_id == faction_id;
            });
        }

        function experienceProcessor(event_arr) {
            const unique_arr = event_arr.filter((v, i, a) => a.findIndex(t => (t.character_id == v.character_id)) == i);

            let timeout = 0;
            for (const world_id of worlds) {
                setTimeout(() => worldMessageEditor(unique_arr.filter((v) => v.world_id == world_id)), timeout);
                timeout += 1500;
            }
        }

        function intToTwoDigits(int) {
            if (int < 10) {
                return `0${int}`;
            }
            else {
                return int;
            }
        }

        function main() {
            const event_arr = [];
            const DBG_ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + config.dbg_api.service_id);
            DBG_ws.on('error', (err) => {
                if (err == 'ECCONRESET') console.error(err);
                else throw err;
            });

            setTimeout(() => {
                experienceProcessor(event_arr);
                DBG_ws.send('{"service":"event","action":"clearSubscribe","all":"true"}');
                DBG_ws.close();
            }, args.interval);

            DBG_ws.on('message', function incoming(data) {
                // Parses 'data' and stores it in 'parsedData'
                const parsedData = JSON.parse(data);

                if (parsedData.connected == 'true') {
                    DBG_ws.send(`{
                        "service":"event",
                        "action":"subscribe",
                        "worlds":["${worlds.join('","')}"],
                        "characters": ["all"],
                        "eventNames":["GainExperience"],
                        "logicalAndCharactersWithWorlds":true
                    }`);
                }

                if (parsedData.subscription && log_sub <= 1) {
                    console.log(data);
                    log_sub++;
                    return;
                }

                // Filters the parsedData.types
                switch(parsedData.type) {
                // Makes sure only serviceMessages are filtered further
                case 'serviceMessage': {
                    switch(parsedData.payload.event_name) {
                    case 'GainExperience': {
                        const payload = { character_id: parsedData.payload.character_id, zone_id: parsedData.payload.zone_id, loadout_id: parsedData.payload.loadout_id, world_id: parsedData.payload.world_id };
                        event_arr.push(payload);
                        break;
                    }
                    }
                    break;
                }
                case 'serviceStateChanged':
                case 'connectionStateChanged':
                case 'heartbeat': {
                    break;
                }
                default: {
                    break;
                }
                }
            });
        }

        // Run main script
        main();
        const loop = setInterval(main, args.interval);

        // Exit script after 24 hours for a restart
        setTimeout(() => clearInterval(loop), 86400000);
    },
    setup: {
        json: async ({ channel, responses }) => {
            const worlds = require(paths.files.worlds);
            const pop_msg = channel.send('Pop message');
            let world_id;
            for (const res of responses) {
                if (!worlds.some((v) => v.name == res)) continue;
                world_id = worlds.find(x => x.name.toLowerCase() == res.toLowerCase()).world_id;
                break;
            }
            const msg = await pop_msg;
            return JSON.stringify({ channel_id: msg.channel.id, msg: msg.id, world_id });
        },
        questions: [
            {
                question: '``Enter the world (server) name or ID:``',
                answer: (v) => {
                    const worlds = require(paths.files.worlds);
                    const name_exists = worlds.some(x => x.name.toLowerCase() == v.toLowerCase());
                    const ID_exists = worlds.some(x => x.world_id == v);

                    if (!name_exists && !ID_exists) {
                        return { res: 'INVALID_ANSWER' };
                    }

                    // Message for world name
                    switch(name_exists) {
                    case true: {
                        return { res: worlds.find(x => x.name.toLowerCase() == v.toLowerCase()).name };
                    }
                    // Message for world ID
                    case false: {
                        return { res: worlds.find(x => x.world_id == v).name };
                    }
                    }
                },
            },
        ],
    },
};
