module.exports = async function(config, args, settings, message) {
    message.channel.send('Usage of !chart:```!chart pop <hours to look back>\n!chart alert pie <months to look back>```');
};