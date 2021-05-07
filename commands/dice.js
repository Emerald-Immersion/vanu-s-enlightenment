module.exports = {
    name: 'dice',
    args: false,
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: [], // Aliases for the command
    help: '!dice <amount of sides>; Rolls a dice with x amount of sides. Default of 6. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args, config) {
        message.channel.startTyping();

        let requestedSides = 6;
        const intParsedInput = parseInt(args[0]);

        if (args[0] != undefined) {
            if (Number.isInteger(intParsedInput) && intParsedInput > 0) {
                requestedSides = intParsedInput;
            }
            else {
                message.channel.stopTyping();
                return message.channel.send('Incorrect argument');
            }
        }

        // Do the math, pick an inclusive rounded random number between 1 and 6 (default) or a specified number
        const sideRolled = Math.round(Math.random() * (requestedSides - 1) + 1);

        message.channel.stopTyping();
        message.channel.send(`You rolled side **${sideRolled}** out of **${requestedSides}** sides`);
    },
};