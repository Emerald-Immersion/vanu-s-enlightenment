module.exports = {
    name: 'dice',
    args: false,
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: [], // Aliases for the command
    help: '!dice <amount of sides>; Rolls a dice with x amount of sides. Default of 6. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config) {
        message.channel.startTyping();

        // Do the math, pick an inclusive rounded random number between 1 and 6 (default) or a specified number
        const sides = args[0] || 6;
        const sideRolled = Math.round(Math.random() * (sides - 1) + 1);

        message.channel.send(sideRolled);
        message.channel.stopTyping();
    },
};