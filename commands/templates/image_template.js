module.exports = {
    name: '',
    args: false,
    guildOnly: false,
    aliases: undefined, // Aliases for the command
    help: '[command]; [explanation]. [flags]', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const fs = require('fs');
        const Discord = require('discord.js');
        const path = `./images/${this.name}/`;

        const files = fs.readdirSync(path);

        const RN1 = Math.random();
        const attachment = new Discord.MessageAttachment(path + files[Math.floor(RN1 * files.length)]);
        message.channel.send(`Here is a picture of a ${this.name}:`, attachment);
    },
};
