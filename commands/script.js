module.exports = {
    name: 'script', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: true, // Specify if the command can only be used in guilds
    help: '!script <command, i.e help> [optional parameters]. Manage scripts. R', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args) {
        const Discord = require('Discord.js');
        const fs = require('fs');
        const path = require('path');
        const config = require(paths.files.config);

        if (!message.member.permissions.has(Discord.Permissions.ADMINISTRATOR) || message.author.id != config.author.discord_id) return;

        const extension = '.js';
        const script_path = path.join(paths.dirs.commands, 'script');

        message.channel.startTyping();

        const scripts = fs.readdirSync(script_path).filter(file => file.endsWith(extension)).map(v => v.split(extension)[0]);

        if (scripts.some(v => v == args[0])) {
            const module = require(path.join(script_path, args[0]));
            await module.execute({ message }).catch(message.channel.stopTyping());
        }
        else {
            const module = require(path.join(script_path, 'help'));
            message.channel.send('No or wrong arguments, default to help command:');
            await module.execute({ message }).catch(message.channel.stopTyping());
        }
        message.channel.stopTyping();
    },
};
