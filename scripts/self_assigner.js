module.exports = {
    name: 'self_assigner',
    async execute(autostart_table, client) {
        const args = autostart_table.args[0];
        const Discord = require('discord.js');
        const channel = await client.channels.cache.get(args.channel_id);
        const message = await channel.messages.fetch(args.message_id);
        const roles = args.roles.map(role => {
            return { role: message.guild.roles.cache.find(grole => grole.id == role.role), description: role.description };
        });
        const guild = message.guild;

        const emoji = ['683285044345045010', '683285044416217148', '683285045540159491', '683285051970289808', '683285051928215565', '683285049595920385', '683285084320694302', '683285084463431720', '683285085818191976', '699909620495548497', '701006810169081936', '722814368022134790', '722814368286244924', '722814368366067792', '722814368370130964', '722816185606864896', '722816749707198574'];

        if (!guild.me.hasPermission('MANAGE_ROLES')) {
            channel.send('No permission for managing roles');
            return;
        }

        async function reactionHandler(reaction, user, action) {
            const guild_user = await guild.member(user);
            if (guild_user === undefined) return;

            const emoji_index = emoji.findIndex(id => id == reaction.emoji.id);
            if (emoji_index == -1) return;

            // Add or remove role
            guild_user.roles[action](roles[emoji_index].role);
        }

        function reactionFilter(reaction, user) {
            return (!(reaction.message.id != message.id || !emoji.includes(reaction.emoji.id) || user.bot));
        }

        // Reaction collecter, reaction add and remove event handlers
        const collector = message.createReactionCollector(reactionFilter, { dispose: true });
        collector.on('collect', async (reaction, user) => reactionHandler(reaction, user, 'add'));
        collector.on('remove', async (reaction, user) => reactionHandler(reaction, user, 'remove'));

        const description = [];
        for (const index in roles) {
            const role_emoji = client.emojis.cache.get(emoji[index]);

            let role_desc = `${role_emoji} : ${roles[index].role}`;
            if (roles[index]?.description) role_desc += ` ${roles[index].description}`;
            description.push(role_desc);
            await message.react(role_emoji);
        }

        const embed = new Discord.MessageEmbed();
        embed.setColor('DARK_PURPLE').setTitle(args.title).setFooter('Brought to you by: Vanu, bestower of knowledge');
        embed.setDescription(description.join('\n'));
        message.edit('', embed);
    },
    // setup: {
    //     json: async ({ channel, responses }) => {
    //         const worlds = require(paths.files.worlds);
    //         const pop_msg = channel.send('Pop message');
    //         let world_id;
    //         for (const res of responses) {
    //             if (!worlds.some((v) => v.name == res)) continue;
    //             world_id = worlds.find(x => x.name.toLowerCase() == res.toLowerCase()).world_id;
    //             break;
    //         }
    //         const msg = await pop_msg;
    //         return JSON.stringify({ channel_id: msg.channel.id, msg: msg.id, world_id });
    //     },
    //     questions: [
    //         {
    //             question: '``Enter the world (server) name or ID:``',
    //             answer: (v) => {
    //                 const worlds = require(paths.files.worlds);
    //                 const name_exists = worlds.some(x => x.name.toLowerCase() == v.toLowerCase());
    //                 const ID_exists = worlds.some(x => x.world_id == v);

    //                 if (!name_exists && !ID_exists) {
    //                     return { res: 'INVALID_ANSWER' };
    //                 }

    //                 // Message for world name
    //                 switch(name_exists) {
    //                 case true: {
    //                     return { res: worlds.find(x => x.name.toLowerCase() == v.toLowerCase()).name };
    //                 }
    //                 // Message for world ID
    //                 case false: {
    //                     return { res: worlds.find(x => x.world_id == v).name };
    //                 }
    //                 }
    //             },
    //         },
    //     ],
    // },
};
