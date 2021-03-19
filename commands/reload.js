module.exports = {
    name: 'reload',
    args: true,
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: [], // Aliases for the command
    help: '!reload <command name>; Reloads a command. R DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config) {
        if (message.author.id != config.author.discord_id) return;
        const commandName = args[0].toLowerCase();

        delete require.cache[require.resolve(`./${commandName}.js`)];

        try {
            const newCommand = require(`./${commandName}.js`);
            message.client.commands.set(newCommand.name, newCommand);
        }
        catch (error) {
            console.log(error);
            return message.channel.send(`There was an error while reloading a command \`${commandName}\`:\n\`${error.message}\``);
        }
        message.channel.send(`Command \`${commandName}\` was reloaded!`);
    },
};