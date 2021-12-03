module.exports = {
    name: 'outfit-on',
    async execute(args, client) {
        const axios = require('axios');
        const channel = client.channels.cache.get(args.channel_id);
        const config = require('../json/config.json');

        const emoji_map = {
            ASP: await client.emojis.cache.get('699909620495548497'),
            ASP2: await client.emojis.cache.get('911917762924929044'),
            120: await client.emojis.cache.get('701006810169081936'),
            VS: await client.emojis.cache.get('683285085818191976'),
            NC: await client.emojis.cache.get('683285084320694302'),
            TR: await client.emojis.cache.get('683285084463431720'),
            MX: await client.emojis.cache.get('683285051970289808'),
            LA: await client.emojis.cache.get('683285051928215565'),
            IF: await client.emojis.cache.get('683285045540159491'),
            EN: await client.emojis.cache.get('683285044416217148'),
            CM: await client.emojis.cache.get('683285044345045010'),
            HA: await client.emojis.cache.get('683285045540159491'),
        };

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

        async function fetchMessages() {
            const outfit = await (await getRequest(`http://census.daybreakgames.com/s:${config.dbg_api.service_id}/get/ps2:v2/outfit?alias=${args.outfit_alias}&c:case=false&c:resolve=member(character_id)`)).data.outfit_list[0];
            // Send the necessary messages and save the message objects inside the returned map
            const messages = { header: await channel.messages.fetch(args.messages.header), member0: await channel.messages.fetch(args.messages.member0), member1: await channel.messages.fetch(args.messages.member1), footer: await channel.messages.fetch(args.messages.footer) };
            messages.header.edit(`__Online members for **${outfit.name}**:__`);
            messages.member0.edit('Member0');
            messages.member1.edit('Member1');
            messages.footer.edit('Footer');
            return messages;
        }

        async function DBLog(online_members, outfit) {
            const mariadb = require('mariadb');
            const db_conn = await mariadb.createConnection({ host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port });

            const ranks = ['rank_ordinal_0', 'rank_ordinal_1', 'rank_ordinal_2', 'rank_ordinal_3', 'rank_ordinal_4', 'rank_ordinal_5', 'rank_ordinal_6', 'rank_ordinal_7', 'rank_ordinal_8'];
            const query_values = ranks.map((v, i) => online_members.filter(va => va.rank_ordinal == i).length);
            query_values.push(outfit.outfit_id);
            db_conn.query(`INSERT INTO outfit_on (${ranks.join(', ')}, outfit_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, query_values);
            db_conn.end();
        }

        async function messageUpdaterCensus() {
            console.log('updating online players');
            const request = await getRequest(`http://census.daybreakgames.com/s:${config.dbg_api.service_id}/get/ps2:v2/outfit?alias=${args.outfit_alias}&c:resolve=member&c:case=false&c:show=outfit_id,name,alias,alias_lower,member_count&c:join=character^on:members.character_id^to:character_id^inject_at:character^show:name.first%27battle_rank.value%27prestige_level%27profile_id(profile^to:profile_id^show:profile_type_id^inject_at:profile),characters_online_status^to:character_id^on:members.character_id^inject_at:character^show:online_status`).catch((err) => console.log(err));
            if (request.data.error != undefined) {
                return console.log('outfit_members undefined');
            }
            const outfit = request.data.outfit_list[0];

            if (outfit == undefined || outfit.members == undefined) {
                return console.log('outfit_members undefined');
            }
            const online_members = await outfit.members.filter(checkOnline);
            if (online_members == undefined) {
                return console.log('online_members undefined');
            }

            DBLog(online_members, outfit);

            await editMessage(online_members, outfit);

            console.log('Finished updating online players');
        }

        async function editMessage(online_members, outfit) {
            await online_members.sort((a, b) => a.rank_ordinal - b.rank_ordinal);
            if (await online_members.some(function(member) { return member.character.name.first == 'brakenium'; })) {
                let brakenium_index;
                const brakenium = online_members.find(function(member, index) {
                    brakenium_index = index;
                    return member.character.name.first == 'brakenium';
                });
                await online_members.splice(brakenium_index, 1);
                await online_members.unshift(brakenium);
            }

            const arr0 = await online_members.slice(0, 12);
            const member0 = memberArrToMSGString(arr0, '‏');

            const arr1 = await online_members.slice(12, 24);
            const member1 = memberArrToMSGString(arr1, '‏');

            const date = new Date;
            const date_string = `${intToTwoDigits(date.getUTCHours())}:${intToTwoDigits(date.getUTCMinutes())} ${intToTwoDigits(date.getUTCDate())}-${intToTwoDigits(date.getUTCMonth() + 1)} UTC`;

            const online_members_string = `Currently ${online_members.length}/${outfit.member_count} players online.`;
            const update_string = `*Last update: ${date_string}. Next update in ${args.interval / 60000} minutes*`;

            messages.member0.edit(member0);
            messages.member1.edit(member1);
            if (online_members.length > (arr0.length + arr1.length)) {
                messages.footer.edit(`${online_members_string}\nOnly ${arr0.length + arr1.length} players shown, look at: <https://ps2.fisu.pw/outfit/?name=${outfit.alias}> to see all online players.\n${update_string}`);
            }
            else {
                messages.footer.edit(`${online_members_string}\n${update_string}`);
            }
        }

        function checkOnline(outfit_member) {
            return outfit_member.character.online_status == 10;
        }

        function createMemberString(member) {
            let prestige_emoji;
            switch (member.character.prestige_level) {
            case '0':
                prestige_emoji = emoji_map[120];
                break;
            case '1':
                prestige_emoji = emoji_map.ASP;
                break;
            case '2':
                prestige_emoji = emoji_map.ASP2;
                break;
            default:
                prestige_emoji = `prestige level "${member.character.prestige_level}" unkown, please report with a screenshot to brakenium`;
                break;
            }

            let class_emoji;
            switch (member.character.profile.profile_type_id) {
            case '1':
                class_emoji = emoji_map.IF;
                break;
            case '3':
                class_emoji = emoji_map.LA;
                break;
            case '4':
                class_emoji = emoji_map.CM;
                break;
            case '5':
                class_emoji = emoji_map.EN;
                break;
            case '6':
                class_emoji = emoji_map.HA;
                break;
            case '7':
                class_emoji = emoji_map.MX;
                break;
            default:
                class_emoji = `Class "${member.character.profile.profile_type_id}" unknown, please report with a screenshot to brakenium`;
                break;
            }

            const battle_rank = charactersWhitespaces(undefined, member.character.battle_rank.value.length + 29, member.character.battle_rank.value);
            const member_name = charactersWhitespaces(member.character.name.first, member.character.name.first.length);
            return `\`${member_name}\` ${prestige_emoji}\`${battle_rank}\` ${class_emoji} Rank: ${member.rank}`;
        }

        function charactersWhitespaces(str_front, char_length, str_back) {
            if (str_front == undefined) str_front = '';
            if (str_back == undefined) str_back = '';
            return str_front + '                                '.slice(0, 32 - char_length) + str_back;
        }

        function memberArrToMSGString(arr, alt_msg) {
            if (arr.length != 0) {
                let msg = '';
                arr.forEach(element => {
                    msg = `${msg}\n${createMemberString(element)}`;
                });
                return msg;
            }
            else {
                return alt_msg;
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

        const messages = await fetchMessages();

        setInterval(async function() { messageUpdaterCensus(); }, args.interval);
        messageUpdaterCensus();
    },
};
