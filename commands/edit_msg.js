module.exports = {
    name: 'edit_msg', // Command name
    args: true, // Specify if arguments are needed
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: undefined, // Aliases for the command
    help: '!edit_msg <Channel ID> <Message ID> <Content>; Edit messages. R DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args, config, constants, client) {
        if (message.author.id != config.author.discord_id) return;
        const channel = await client.channels.cache.get(args[0]);
        const msg = await channel.messages.fetch(args[1]);
        await args.shift();
        await args.shift();
        const string = await args.join(' ');
        msg.edit(string);
    },
};
