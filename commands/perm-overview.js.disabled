module.exports = {
    name: 'perm-overview', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: true, // Specify if the command can only be used in guilds
    help: '!script <command, i.e help> [optional parameters]. Manage scripts. R', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message) {
        const config = require(paths.files.config);
        const { channel, guild } = message;
        const { members } = guild;

        if (!message.member.hasPermission('ADMINISTRATOR') || message.author.id != config.author.discord_id) return;
        channel.startTyping();

        const perms_arr = members.cache.map(member => {
            return member.permissions;
        });

        console.log(perms_arr);

        channel.stopTyping();
    },
};
