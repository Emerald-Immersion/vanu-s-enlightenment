module.exports = {
    name: 'message',
    args: true,
    guildOnly: false,
    aliases: undefined, // Aliases for the command
    help: '!message <message you want to send>; Send messages as this bot. R DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message, args, config) {
        if (message.author.id == config.author.discord_id) {
            let messageText = args[0];
            for (let i = 1, l = Object.keys(args).length; i + 1 <= l; i++) {
                messageText = messageText + ' ' + args[i];
            }
            message.channel.send(messageText);
        }
    },
};
