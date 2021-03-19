module.exports = {
    name: 'x_msg', // Command name
    args: true, // Specify if arguments are needed
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: undefined, // Aliases for the command
    help: '!x_msg <amount of messages you want to send>; Send messages and edit content to ID. R DM', // Help information to show
    execute(message, args, config) {
        if (message.author.id != config.author.discord_id) return;
        for (let index = 0; index < parseInt(args[0]); index++) {
            message.channel.send('Message ' + index)
                .then(function(msg) {
                    if (index % 2 == 0) {
                        msg.edit(`**${msg.id}**`);
                    }
                    else {
                        msg.edit(msg.id);
                    }
                });
        }
    },
};
