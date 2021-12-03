module.exports = {
    name: 'help', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: undefined, // Aliases for the command
    help: '!help; Show this help page. DM', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    execute(message) {
        const data = [];
        const { commands } = message.client;

        data.push('Here\'s a list of all my commands:');
        data.push(`\`\`\`${commands.map(command => `${command.help}`).join('\n\n')}\`\`\``);
        data.push('R = Restricted, only usable with authorisation\nDM = usable in a DM\nWarning: custom prefix not shown');

        return message.channel.send(data)
            .catch(error => {
                console.error('Could not send help message.\n', error);
                message.reply('It seems like I can\'t send the help message!');
            });
    },
};