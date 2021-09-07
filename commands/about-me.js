module.exports = {
    name: 'about-me', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: ['aboutme', 'me'], // Aliases for the command
    help: '!about-me; Shows information about me, Vanu\'s Enlightenment. Aliases: !about-me, !me. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const Discord = require('discord.js');
        const fs = require('fs');

        const commands = fs.readdirSync('./commands/').filter(fn => fn.endsWith('.js'));
        const embed = new Discord.MessageEmbed()
            .setColor()
            .setTitle('About me')
            .setImage('https://github.com/Emerald-Immersion/vanu-s-enlightenment/raw/master/images/me.png')
            .setDescription('I am your friendly neighbourhood connection to Vanu. My work consists of enlightening fools, assisting The Vanu Sovereignty with information and helping followers of Vanu relax among other things.')
            .addField('My physical appearance', 'At the bottom of this message you can see me, in physical form. Sometimes I play with the lovely people in Emerald Immersion and support them wherever I can.')
            .addField('Misc.', `Currently I have **${commands.length}** commands which can be shown using **!help**. My code resides on a raspberry pi 2 and is licensed under the MIT license. If you want to view my code you can do so on [GitHub](https://github.com/Emerald-Immersion/vanu-s-enlightenment)`);
        message.channel.send(embed);

    },
};
