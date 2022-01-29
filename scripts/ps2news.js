module.exports = {
    name: 'ps2news',
    async execute(args, client) {
        const Parser = require('rss-parser');
        const parser = new Parser();
        const Discord = require('discord.js');
        const fs = require('fs');

        const sites = await createSiteObjects();

        let lastCheckDate = fs.readFileSync('./txt/ps2news_lastcheckdate.txt');
        // lastCheckDate = Date.parse('Wed, 20 Jun 2020 01:13:23 +0000');

        async function createSiteObjects() {
            const channel_arr = [];
            for (const obj of args.channels) {
                const channel = await client.channels.cache.get(obj.channel_id);
                let newsRole;
                if (obj.guild_id != undefined || obj.role_id != undefined) {
                    const guild = await client.guilds.cache.get(obj.guild_id);
                    newsRole = await guild.roles.cache.find(role => role.id === obj.role_id);
                }
                channel_arr.push({ channel: channel, role: newsRole });
            }
            return channel_arr;
        }

        async function retrieveRSSFeed(URL) {
            return await parser.parseURL(URL).catch(function(error) {
                console.error(error);
            });
        }

        async function timestampToDateString(timestamp) {
            // Convert a timestamp into a date string
            const d = new Date(timestamp);
            const datestring = `${d.toLocaleTimeString()}\n${d.toLocaleDateString()} Dutch time`;
            return datestring;
        }

        async function createEmbed(item, feedTitle, feedGenerator, forumLink) {
            const pubDateString = await timestampToDateString(Date.parse(item.isoDate));

            let description;
            if (item.contentSnippet.length >= 800) {
                description = await item.contentSnippet.slice(0, 800) + '... (this was shortened to 800 characters)';
            }
            else {
                description = await item.contentSnippet;
            }

            const embed = new Discord.MessageEmbed()
                .setTitle(item.title.slice(0, 256))
                .setAuthor(item.author)
                .setColor('#00a9a3')
                .setDescription(description)
                .setFooter('Vanu\'s Enlightenment', 'https://i.imgur.com/YhAm36S.png')
                .setThumbnail('https://i.imgur.com/sdx94Qh.png')
                .setTimestamp()
                .setURL(item.link)
                .addField('Publish date:', pubDateString, true)
                .addField('Title of feed:', feedTitle, true)
                .addField('Name of generator:', feedGenerator, true)
                .addField('Link to forum:', forumLink, false);
            return embed;
        }

        function checkDate(item) {
            const timestamp = Date.parse(item.isoDate);
            return timestamp >= lastCheckDate;
        }

        function setCheckDate() {
            const d = Date.now();
            lastCheckDate = d;
            fs.writeFileSync('./txt/ps2news_lastcheckdate.txt', JSON.stringify(d));
        }

        async function checkNews(URL, type) {
            const feed = await retrieveRSSFeed(URL);

            if (feed == undefined) {
                console.log(URL);
                return;
            }
            if (feed.items.some(checkDate) == true) {
                console.log('New news for: ' + URL);
                const newItems = feed.items.filter(checkDate);
                newItems.reverse();

                newItems.forEach(async function(item) {
                    const embed = await createEmbed(item, feed.title, feed.generator, feed.link);

                    for (const { channel, role } of sites) {
                        let mentions;
                        if (role == undefined) {
                            mentions = 'Mentions: none';
                        }
                        else if (type == '1') {
                            mentions = `Mentions: ${role}`;
                        }
                        else {
                            mentions = 'Mentions: none';
                        }
                        channel.send({ embeds: [ embed ] });
                    }
                });
            }
        }

        async function main() {
            console.log('Checking for news');
            const news_announcements = 'https://forums.daybreakgames.com/ps2/index.php?forums/official-news-and-announcements.19/index.rss';
            const game_updates = 'https://forums.daybreakgames.com/ps2/index.php?forums/game-update-notes.73/index.rss';
            const test_announcements = 'https://forums.daybreakgames.com/ps2/index.php?forums/test-server-announcements.69/index.rss';
            await checkNews(news_announcements, '1'); // type 1
            await checkNews(game_updates, '1'); // type 2
            await checkNews(test_announcements, '2'); // type 3

            setCheckDate();
        }

        setInterval(function() { main(); }, args.interval);
        main();
    },
};
