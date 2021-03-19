module.exports = {
    name: 'truck',
    args: false,
    guildOnly: false,
    aliases: undefined, // Aliases for the command
    help: '!truck; Sends a picture of a truck. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const fs = require('fs');
        const Discord = require('discord.js');

        const files = fs.readdirSync('./images/trucks/');

        const RN1 = Math.random();
        const attachment = new Discord.MessageAttachment('./images/trucks/' + files[Math.floor(RN1 * files.length)]);
        message.channel.send('Here is a picture of a truck:', attachment);
    },
};
