module.exports = async function(config, args, settings, message) {
    switch (args[1]) {
    case 'bar': {
        const func = require(`./alert/${args[1]}`);
        const chart = await func(config, args, settings);
        return chart;
    }
    default:
        message.channel.send(`Wrong argument: ${args[1]}`);
        return 'argument error';
    }
};