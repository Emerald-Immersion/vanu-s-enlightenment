module.exports = {
    name: 'alert-events-start',
    args: false,
    guildOnly: true,
    aliases: [], // Aliases for the command
    help: '!alert-events-start; Updates messages with alert data for Miller. R', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config, constants) {
        if (message.author.id != config.author.discord_id) return;
        const WebSocket = require('ws');
        // const internalWS = new WebSocket('ws://10.10.10.1:8080');
        const internalWS = new WebSocket('ws://127.0.0.1:8080');
        const { JSONPath } = require('jsonpath-plus');
        const Discord = require('discord.js');

        function createAlertEmbed(var_array) {
            const VSEmote = message.guild.emojis.cache.find(emoji => emoji.name === 'VS');
            const NCEmote = message.guild.emojis.cache.find(emoji => emoji.name === 'NC');
            const TREmote = message.guild.emojis.cache.find(emoji => emoji.name === 'TR');

            const alertEmbed = new Discord.MessageEmbed()
                .setColor(config.richembed.color)
                .setAuthor('Brakenium', 'https://i.imgur.com/mqvViYx.png', 'https://github.com/brakenium')
                .setThumbnail(config.richembed.picture_url)
                .setTitle(`${var_array.zone_name}`)
                .addField('-------------------------------------------', `
				**Name:** ${var_array.alert_name}

				**Alert state:** ${var_array.alert_state_name}
				**Duration:** ${var_array.duration}
				**Experience bonus:** ${var_array.experience_bonus}%

				**The alert had the following results:**
				${VSEmote}: ${var_array.faction_vs}
				${TREmote}: ${var_array.faction_tr}
				${NCEmote}: ${var_array.faction_nc}

				**Start date:** ${var_array.datestring_alert_start}
					`)
                .setTimestamp()
                .setFooter('Vanu\'s Enlightenment', 'https://i.imgur.com/YhAm36S.png');
            return alertEmbed;
        }

        function timestampToDateString(timestamp) {
            // Convert a timestamp into a date string
            const d = new Date(timestamp * 1000);
            const datestring = `${d.toLocaleTimeString()} | ${d.toLocaleDateString()} Dutch time`;
            return datestring;
        }

        function alertTypeToDuration(alert_type) {
            let duration;
            switch(alert_type) {
                // Amp station/Tech plant/Biolab alert:
                case '2':
                    duration = '45 minutes';
                    break;
                    // Maximum Pressure:
                case '6':
                    duration = '30 minutes';
                    break;
                    // Continent lock alert:
                case '9':
                    duration = '1:30 hours';
                    break;
                    // Refine and Refuel, aerial anomalie, Race for Readings and Eye of the Storm:
                case '10':
                    duration = '30 minutes';
                    break;
                default:
                    duration = 'No time specified for this alert, yet';
                    break;
            }
            return duration;
        }

        function metagameEventsRequestIfOpen(zone_id) {
            if (internalWS.readyState === 1) {
                internalWS.send(`{
					"payload": {
						"which": "last",
						"zone_id": ${zone_id}
					},
					"service": "event",
					"type": "metagameEventsRequest"
					}
					`);
            }
            else {
                setTimeout(metagameEventsRequestIfOpen, 1000);
            }
        }

        function sendAllMessages() {
            // This will send a message for Indar and make the variable available in msg variable
            // available in the rest of the code
            message.channel.send('This is a placeholder message, this will get updated with alert data for Indar.')
                .then(function(msg) {
                    metagameEventsRequestIfOpen('[2]');
                    internalWS.on('message', function incoming(data) {
                        editMessagesWithNewAlert(data, msg, '2');
                    });
                });

            // This will send a message for Hossin and make the variable available in msg variable
            // available in the rest of the code
            message.channel.send('This is a placeholder message, this will get updated with alert data for Hossin.')
                .then(function(msg) {
                    metagameEventsRequestIfOpen('[4]');
                    internalWS.on('message', function incoming(data) {
                        editMessagesWithNewAlert(data, msg, '4');
                    });
                });

            // This will send a message for Amerish and make the variable available in msg variable
            // available in the rest of the code
            message.channel.send('This is a placeholder message, this will get updated with alert data for Amerish.')
                .then(function(msg) {
                    metagameEventsRequestIfOpen('[6]');
                    internalWS.on('message', function incoming(data) {
                        editMessagesWithNewAlert(data, msg, '6');
                    });
                });

            // This will send a message for Esamir and make the variable available in msg variable
            // available in the rest of the code
            message.channel.send('This is a placeholder message, this will get updated with alert data for Esamir.')
                .then(function(msg) {
                    metagameEventsRequestIfOpen('[8]');
                    internalWS.on('message', function incoming(data) {
                        editMessagesWithNewAlert(data, msg, '8');
                    });
                });
        }

        function editMessagesWithNewAlert(data, msg, msg_zone_id) {
            const parsedData = JSON.parse(data);

            // Get the necessary variables from the ServiceMessage
            // Get the strings into a variable
            const event_name = parsedData.payload.event_name;
            if (!(event_name == 'MetagameEvent')) return;
            const world_id = parsedData.payload.world_id;
            if (!(world_id == '10')) return;
            const alert_id = parsedData.payload.metagame_event_id;
            const alert_state = parsedData.payload.metagame_event_state;
            const alert_state_name = parsedData.payload.metagame_event_state_name;

            // Convert number strings into integers
            const experience_bonus = parseInt(parsedData.payload.experience_bonus, 10);
            const timestamp = parseInt(parsedData.payload.timestamp, 10);
            const faction_nc = parseInt(parsedData.payload.faction_nc, 10);
            const faction_tr = parseInt(parsedData.payload.faction_tr, 10);
            const faction_vs = parseInt(parsedData.payload.faction_vs, 10);


            // Get the constants from the constants file
            // metagame_event_list
            const metagame_event = (JSONPath(`$.metagame_event_list[?(@.metagame_event_id=="${alert_id}")]`, constants))[0];
            const alert_zone_id = metagame_event.zone_id;
            if (!(alert_zone_id == msg_zone_id)) return;
            const alert_name = metagame_event.name.en;
            const alert_type = metagame_event.type;

            // zones
            const zone = (JSONPath(`$.zones[?(@.zone_id=="${alert_zone_id}")]`, constants))[0];
            const zone_name = zone.name;

            // Calculations regarding the timestamp
            // Convert the timestamp into a date string for the alert start
            const datestring_alert_start = timestampToDateString(timestamp);

            // Convert the alert type into alert duration
            const duration = alertTypeToDuration(alert_type);

            // Put all needed variables in a map
            const alert_vars_array = {
                zone_name: zone_name,
                alert_name: alert_name,
                experience_bonus: experience_bonus,
                faction_vs: faction_vs,
                faction_tr: faction_tr,
                faction_nc: faction_nc,
                alert_state_name: alert_state_name,
                alert_state: alert_state,
                datestring_alert_start: datestring_alert_start,
                duration: duration };

            const alert_embed = createAlertEmbed(alert_vars_array);

            // Edit the right message for the continent the alert came from
            switch(alert_zone_id) {
                // Indar:
                case '2':
                    msg.edit(alert_embed);
                    break;
                    // Hossin:
                case '4':
                    msg.edit(alert_embed);
                    break;
                    // Amerish:
                case '6':
                    msg.edit(alert_embed);
                    break;
                    // Esamir:
                case '8':
                    msg.edit(alert_embed);
                    break;
            }
        }

        // Logs internalWS errors in console and send a message to the discord channel
        internalWS.on('error', (error) => {
            console.log(error);
            message.channel.send(`The following websocket error (internalWS) occured:\n${error}`);
        });

        console.log('Message !' + this.name + ' received');

        internalWS.on('open', function open() {
            console.log('internalWS is open');
        });

        sendAllMessages();
    },
};