module.exports = {
    name: 'continent-status',
    async execute(args, client) {
        const Discord = require('discord.js');
        const WebSocket = require('ws');
        const { JSONPath } = require('jsonpath-plus');
        const mariadb = require('mariadb');
        const fs = require('fs');

        const config = require('../json/config.json');
        const constants = require('../json/constants.json');
        // If this module is to be used, please edit the usage for zones.js
        const zones = require('../js/zones');

        const DBG_ws = new WebSocket('wss://push.planetside2.com/streaming?environment=ps2&service-id=s:' + config.dbg_api.service_id);
        const db_options = { host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port };

        const { messages, worlds } = await createMsgRelatedArrs();

        class queue {
            constructor() {
                const collection = [];
                this.print = function() {
                    console.log(collection);
                };
                this.enqueue = function(element) {
                    collection.push(element);
                };
                this.dequeue = function() {
                    return collection.shift();
                };
                this.front = function() {
                    return collection[0];
                };
                this.size = function() {
                    return collection.length;
                };
                this.isEmpty = function() {
                    return (collection.length === 0);
                };
                this.removeDuplicates = function() {
                    collection.filter((v, i, a) => a.findIndex(t => (t.timestamp == v.timestamp)) == i);
                };
            }
        }

        async function editMessage(embed, world_id, zone_name, suppressEmbeds) {
            for (const message of messages.filter((obj) => (obj.world_id == world_id))) {
                if (suppressEmbeds) await message[zone_name].suppressEmbeds(suppressEmbeds);
                message[zone_name].edit('‏‏‎ ‎', embed).catch((err) => console.log(err));
            }
        }

        async function createMsgRelatedArrs() {
            const msg_arr = [];
            const world_id_arr = [];

            for (const message of args.messages) {
                const world_id = message.world_id;
                const channel = await client.channels.cache.get(message.channel_id);
                const addition = { world_id: world_id };
                for (const zone of ['Esamir', 'Amerish', 'Hossin', 'Indar']) {
                    addition[zone] = await channel.messages.fetch(message[zone]);
                }

                msg_arr.push(addition);
                if (!world_id_arr.some((a) => a == world_id)) world_id_arr.push(world_id);
            }
            return { messages: msg_arr, worlds: world_id_arr };
        }

        async function SQLErrorHandler(err, payload) {
            // if (err.code == 'ER_DUP_ENTRY') return;
            console.log(err);
            console.log(`${payload.experience_bonus},${payload.faction_nc},${payload.faction_tr},${payload.faction_vs},${payload.instance_id},${payload.metagame_event_id},${payload.metagame_event_state},"${payload.metagame_event_state_name}",${payload.timestamp},${payload.world_id},${payload.zone_id}`);
            appendFile('./log/SQLErr.log', `${err}\n${JSON.stringify(payload)}\n`);
        }

        function appendFile(filepath, data) {
            fs.appendFile(filepath, data, function(err) {
                if (err) throw err;
            });
        }

        function alertProcessor() {
            if (alert_queue.isEmpty()) return;
            alert_queue.removeDuplicates();
            const payload = alert_queue.dequeue();
            messageCrafter(payload);

            console.log(`(sM) Type is "${payload.event_name}"`);

            const db_conn = mariadb.createConnection(db_options);
            db_conn.then(async (conn) => {
                await conn.query(`INSERT INTO metagame_events(experience_bonus,faction_nc,faction_tr,faction_vs,instance_id,metagame_event_id,metagame_event_state,metagame_event_state_name,timestamp,world_id,zone_id)VALUES(${payload.experience_bonus},${payload.faction_nc},${payload.faction_tr},${payload.faction_vs},${payload.instance_id},${payload.metagame_event_id},${payload.metagame_event_state},"${payload.metagame_event_state_name}",from_unixtime(${payload.timestamp.getTime()}),${payload.world_id},${payload.zone_id})`).catch(err => SQLErrorHandler(err, payload));
                await conn.end();
            });
        }

        function parseRound(number) {
            return Math.round(parseFloat(number));
        }

        async function messageCrafter(payload) {
            const zone = (constants.zones.filter(obj => obj.zone_id == payload.zone_id))[0];

            const now = Date.now();
            if (payload.metagame_event_state_name == 'ended' || now > (parseInt(payload.timestamp.getTime(), 10) + 5400000)) {
                editMessage(undefined, payload.world_id, zone.name, true);
                return;
            }
            const emoji_map = {
                VS: await client.emojis.cache.get('683285085818191976'),
                NC: await client.emojis.cache.get('683285084320694302'),
                TR: await client.emojis.cache.get('683285084463431720'),
            };

            const embed = new Discord.MessageEmbed()
                .setColor(zone.color)
                .setTitle(zone.name)
                // .setThumbnail(zone.thumbnail)
                .setTimestamp(parseInt(payload.timestamp.getTime(), 10) + 5400000)
                .setDescription(`Alert ends at (see below). Start state: ${emoji_map.VS}: ${parseRound(payload.faction_vs)}% ${emoji_map.NC}: ${parseRound(payload.faction_nc)}% ${emoji_map.TR}: ${parseRound(payload.faction_tr)}%`);

            editMessage(embed, payload.world_id, zone.name, false);

            if (payload.metagame_event_state_name == 'started') {
                setTimeout(() => {
                    editMessage(undefined, payload.world_id, zone.name, true);
                }, 5400000);
            }
        }

        async function init() {
            for (const world_id of worlds) {
                for (const zone of zones.filter((v, i) => i < 4)) {
                    const db_conn = await mariadb.createConnection(db_options);
                    const payload = await db_conn.query(`SELECT * FROM metagame_events WHERE zone_id = ${zone.zone_id} AND world_id = ${world_id} ORDER BY timestamp DESC limit 1`);
                    db_conn.end();

                    if (payload[0] == undefined) {
                        editMessage(undefined, world_id, zone.name, true);
                    }
                    else {
                        messageCrafter(payload[0]);
                    }
                }
            }
        }

        init();

        const alert_queue = new queue();

        setInterval(alertProcessor, 10000);

        // setTimeout(() => {
        //     const d = new Date(Date.now());
        //     console.log('injecting payload');
        //     for (const world_id of worlds) {
        //         alert_queue.enqueue({ experience_bonus: '25', faction_nc: '34', faction_tr: '13', faction_vs: '39', instance_id: '21152', metagame_event_id: '187', metagame_event_state: '135', metagame_event_state_name: 'started', timestamp: d, world_id: world_id, zone_id: '4', event_name: 'MetagameEvent' });
        //     }
        // }, 10000);

        // setTimeout(() => {
        //     console.log('injecting payload');
        //     DBG_ws.send(`{"action":"echo","payload":{"type": "serviceMessage", "payload": {"experience_bonus": "25", "faction_nc": "34", "faction_tr": "13", "faction_vs": "39", "instance_id": "21152", "metagame_event_id": "187", "metagame_event_state": "135", "metagame_event_state_name": "started", "timestamp": "${Date.now() / 1000 + 5400000}", "world_id": "10", "zone_id": "4", "event_name": "MetagameEvent" }},"service":"event"}`);
        // }, 10000);

        DBG_ws.on('open', function open() {
            console.log('Listening to websocket');
        });

        DBG_ws.on('message', function incoming(data) {
            // Parses 'data' and stores it in 'parsedData'
            const parsedData = JSON.parse(data);

            if (parsedData.connected === 'true') {
                DBG_ws.send('{"service":"event","action":"clearSubscribe","all":"true"}');
                DBG_ws.send(`{"service":"event","action":"subscribe","worlds":["${worlds.join('","')}"],"eventNames":["ContinentUnlock","ContinentLock","MetagameEvent"]}`);
            }

            if (parsedData.subscription) return console.log(data);

            // Filters the parsedData.types
            switch(parsedData.type) {
            // Makes sure only serviceMessages are filtered further
            case 'serviceMessage': {
                switch(parsedData.payload.event_name) {
                case 'MetagameEvent': {
                    parsedData.payload.zone_id = JSONPath(`$.metagame_event_list[?(@.metagame_event_id==${parsedData.payload.metagame_event_id})].zone_id`, constants);
                    if (parsedData.payload.zone_id == '25565') break;

                    parsedData.payload.timestamp = new Date(parsedData.payload.timestamp * 1000);

                    alert_queue.enqueue(parsedData.payload);
                    break;
                }
                case 'ContinentLock': {
                    appendFile('./log/cont.log', data);
                    break;
                }
                case 'ContinentUnlock': {
                    appendFile('./log/cont.log', data);
                    break;
                }
                }
                break;
            }
            case 'heartbeat': {
                break;
            }
            default: {
                break;
            }
            }
        });
    },
};
