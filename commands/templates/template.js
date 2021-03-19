module.exports = {
    name: undefined, // Command name
    args: false, // Specify if arguments are needed
    guildOnly: true, // Specify if the command can only be used in guilds
    aliases: [], // Aliases for the command
    help: '', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config, constants, client) {
        // The command code
    },
};
