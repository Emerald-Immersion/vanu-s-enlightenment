module.exports = {
    name: 'mention_remover',
    async execute(autostart_row, client) {
        async function main(channel_id, user_id) {
            // Get channel and the user that mentions should not contain
            const channel = await client.channels.cache.get(channel_id);
            const user = await client.users.fetch(user_id);

            // Create message collector and check if a message in said channel
            // has a mention of ${user} and is deletable by the bot
            const msg_collector = channel.createMessageCollector(msg => msg.mentions.has(user) && msg.deletable);

            // Delete any message that pass through the filter and warn the offending user
            msg_collector.on('collect', msg => {
                channel.send(`Be nice ${msg.author}, don't mention ${user.username}`);
                msg.delete();
            });
        }

        // Spawn an instance for all values of args
        for (const { channel_id, user_id } of autostart_row.args) {
            main(channel_id, user_id);
        }
    },
};
