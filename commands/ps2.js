module.exports = {
    name: 'ps2',
    args: false,
    guildOnly: true,
    aliases: undefined, // Aliases for the command
    help: '!ps2; Send a random PS2 related picture. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const fs = require('fs');
        const Discord = require('discord.js');
        const path = `./images/${this.name}/`;

        const files = fs.readdirSync(path);

        const RN1 = Math.random();
        const attachment = new Discord.MessageAttachment(path + files[Math.floor(RN1 * files.length)]);
        message.channel.send({ content: `Here is a picture of a ${this.name}:`, files: attachment });
    },
};
