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

        if (files.length > 0) {
            const RN1 = Math.random();
            const file_path = PATH + files[Math.floor(RN1 * files.length)];
            const attachment = new Discord.MessageAttachment(file_path);
            message.channel.send({ content: 'Here is a picture of a car:', files: [ attachment ] });
        }
        else {
            message.reply('No images found');
            console.error('No images found', `path: ${PATH}\nfiles: ${files}\nCommand: ${this.name}`);
        }
    },
};
