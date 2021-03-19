module.exports = {
    name: 'car',
    args: false,
    guildOnly: false,
    aliases: [], // Aliases for the command
    help: '!car; Sends a car. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const fs = require('fs');
        const Discord = require('discord.js');
        const PATH = './images/cars/';

        const files = fs.readdirSync(PATH);

        const RN1 = Math.random();
        const attachment = new Discord.MessageAttachment(PATH + files[Math.floor(RN1 * files.length)]);
        message.channel.send('Here is a picture of a car:', attachment);
    },
};
