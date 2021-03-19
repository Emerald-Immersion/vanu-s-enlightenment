module.exports = {
    name: 'help', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: true, // Specify if the command can only be used in guilds
    aliases: undefined, // Aliases for the command
    help: 'help: Shows this message', // Help information to show
    async execute({ message }) {
        const fs = require('fs');
        const path = require('path');

        const script_path = path.join(paths.dirs.commands, 'script');
        const scripts = fs.readdirSync(script_path).filter(file => file.endsWith('.js'));
        const help = scripts.map(v => require(path.join(script_path, v)).help).filter(v => v != undefined).join('\n');
        await message.channel.send('Possible arguments for ``script`` command:```' + help + '```');
    },
};
