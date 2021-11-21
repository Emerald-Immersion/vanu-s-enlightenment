module.exports = {
    name: 'chart', // Command name
    args: true, // Specify if arguments are needed
    guildOnly: false, // Specify if the command can only be used in guilds
    aliases: [], // Aliases for the command
    help: '!chart <args>; Type !chart help for command explanation.', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args) {
        const Discord = require('discord.js');
        const config = require('../json/config.json');
        const settings = config.chart;

        message.channel.startTyping();

        switch (args[0]) {
        case 'alert':
        case 'pop': {
            const func = require(`../js/chart/${args[0]}`);
            const chart = await func(config, args, settings, message);

            if (chart == 'argument error') return;
            const attachment = new Discord.MessageAttachment(chart.stream);
            message.channel.send(chart.msg_txt, attachment);
            message.channel.stopTyping();
            return;
        }
        case 'help': {
            const help = require(`../js/chart/${args[0]}`);
            help(config, args, settings, message);
            break;
        }
        default:
            message.channel.send(`Wrong argument: ${args[0]}`);
            message.channel.stopTyping();
            return;
        }
    },
};