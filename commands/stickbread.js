module.exports = {
    name: 'stickbread',
    args: false,
    guildOnly: false,
    aliases: undefined, // Aliases for the command
    help: '!stickbread; Sends a picture of a stickbread. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config, constants, client) {
        const fs = require('fs');
        const Discord = require('discord.js');


        const RN0 = Math.random();
        if (RN0 < 0.7) {
            const files = fs.readdirSync('./images/stickbread');

            const RN1 = Math.random();
            const attachment = new Discord.MessageAttachment('./images/stickbread/' + files[Math.floor(RN1 * files.length)]);
            message.channel.send({ content: 'Here is a picture of a stickbread:', files: attachment });
        }
        else {
            client.users.fetch('361197155798614026').then(user => {
                const attachment = new Discord.MessageAttachment(user.displayAvatarURL().split('?')[0]);
                message.channel.send({ content: `Here is a picture of a stickbread (${user}):`, files: attachment });
            });
        }
    },
};
