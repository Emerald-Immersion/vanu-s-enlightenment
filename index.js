global.paths = require('./js/paths');
global.constants = new (require('./js/constants')).constants();
const fs = require('fs');
const Discord = require('discord.js');
const mariadb = require('mariadb');
const path = require('path');

const config = require('./json/config.json');
const constants = require('./json/constants.json');

const db_options = { host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port };

const client = new Discord.Client();
client.commands = new Discord.Collection();

class guildSettingsObject {
    constructor(database_options) {
        this.database_options = database_options;
    }
    async updateSettings() {
        const db_conn = await mariadb.createConnection(this.database_options);
        await db_conn.query({ sql: 'SELECT * FROM guild_settings' }).then(res => {
            this.settings = [];
            for (const record of res) {
                const obj = record;
                this.settings[record.guild_ID] = obj;
            }
        });
        db_conn.end();
    }
    async addNewGuilds(guild_ID_arr = []) {
        const db_conn = await mariadb.createConnection(this.database_options);
        const db_records = await db_conn.query(`SELECT guild_ID
        FROM guild_settings
        WHERE guild_ID IN ("${guild_ID_arr.join('", "')}")`);

        const new_guilds = guild_ID_arr.filter(ID => db_records.find(record => record.guild_ID == ID) == undefined);
        if (new_guilds[0] == undefined) return;
        const query = `INSERT INTO guild_settings (guild_ID) VALUES ("${new_guilds.join('"),("')}")`;

        await this.database_connection.query(query);
        db_conn.end();
        await this.updateSettings();
    }
    returnSettings() {
        return this.settings;
    }
}

class autoStartObject {
    constructor(SQL_query) {
        const enabled_only = SQL_query.filter(v => v.enabled == 1);
        const args_parsed = enabled_only.map(v => {
            const obj = v;
            obj.args = JSON.parse(v.args);
            return obj;
        });

        this.scripts = this.scriptsObjCreator(args_parsed);
    }
    async scriptsObjCreator(args_parsed) {
        const db_conn = await mariadb.createConnection(db_options);
        const scripts = await db_conn.query('SELECT * FROM scripts');
        db_conn.end();
        // Return an array for each script in the same format as the old script starter,
        // together with new features, i.e script_ID
        return await scripts.map(async script => {
            if (!args_parsed.some(val => val.script_ID == script.script_ID)) return;
            return {
                interval: script.script_interval,
                script_name: script.script_name,
                script_ID: script.script_ID,
                // Put enabled instances of a given script in the same array
                args: await args_parsed.filter(instance => instance.script_ID == script.script_ID && instance.enabled == 1)
                    .map(val => {
                        val.args.autostart_ID = val.autostart_ID;
                        return val.args;
                    }),
            };
        });
    }
}

function prefixLength(message) {
    // Ignore bots
    if (message.author.bot) return 0;

    // If message is from guild and has an ID:
    if (message.guild != undefined && message.guild.id != undefined) {
        // Get the settings for said guild
        const settings = guild_settings.returnSettings();
        const uniq_settings = settings[message.guild.id];

        if (uniq_settings == undefined) {
            guild_settings.addNewGuild(message.guild.id);
            return 0;
        }

        // If guild specific settings exist and the prefix property exist:
        if ('prefix' in uniq_settings) {
            // Check if the message starts with the guild specific prefix
            if (message.content.toLowerCase().startsWith(uniq_settings.prefix.toLowerCase())) return uniq_settings.prefix.length;
        }
        return 0;
    }

    // Message is not from guild:
    // Check for default prefix
    if (message.content.toLowerCase().startsWith(config.bot.prefix.toLowerCase())) return config.bot.prefix.length;
    return 0;
}

function messageHandler(message) {
    if (message.author.id == '171537942790012928' && (message.content.toLowerCase() == 'ok thanks' || message.content.toLowerCase() == 'ok thamk') && message.channel.id == '679322306681765898') {
        message.channel.send(`No problem ${message.author}, happy to help!`);
    }
    if (message.author.id == '171537942790012928' && message.content.toLowerCase() == 'shut up' && message.channel.id == '679322306681765898') {
        message.channel.send(`${message.author} why are you bullying me? I am trying to help!`);
    }

    const prefix_length = prefixLength(message);
    if (prefix_length == 0) return;


    const args = message.content.slice(prefix_length).split(/ +/);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName)
		|| client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));

    if (!command) return;

    // Checks if the command is only discord servers and if the request didn't come from one
    // it will not execute the command
    if (command.guildOnly && message.channel.type !== 'text') {
        return message.reply('I can\'t execute that command inside DMs!');
    }

    if (command.args && !args.length) {
        let reply = `You didn't provide any arguments, ${message.author}!`;

        if (command.usage) {
            reply += `\nThe proper usage would be: \`${config.bot.prefix}${command.name} ${command.usage}\``;
        }

        return message.channel.send(reply);
    }
    try {
        command.execute(message, args, config, constants, client);
    }
    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
}

async function autostartHandler(element) {
    const command = require(path.join(paths.dirs.scripts, element.script_name));

    if (!command) return;

    try {
        return command.execute(element, client);
    }
    catch (error) {
        console.log(error);
    }
}

function autoStartScripts(autostart_array) {
    if (autostart_array == undefined) return;

    for (const element of autostart_array) {
        if (element == undefined || element.enabled == false) return;

        autostartHandler(element);
    }
}

async function rmOldMSG(channel_id) {
    const channel = client.channels.cache.get(channel_id);
    const messages = await channel.messages.fetch().catch(console.error);
    await messages.forEach(msgelement => {
        if (msgelement.author != client.user) return;
        msgelement.delete().catch(console.error);
    });
}

async function fireStarter() {
    // Improved starter from DB with support for management using commands
    const db_conn = await mariadb.createConnection(db_options);
    const autostart = await db_conn.query('SELECT * FROM autostart');
    db_conn.end();
    const DB_autostart = new autoStartObject(autostart);

    DB_autostart.scripts.then(promis_arr => {
        Promise.all(promis_arr).then(resolved => {
            autoStartScripts(resolved.filter(val => val != undefined));
        });
    });
}

const guild_settings = new guildSettingsObject(db_options);
const settings_update = guild_settings.updateSettings();

let dir;
if (process.argv[2] == 'indev') {
    console.log('Using indev command directory');
    dir = './commands_indev';
}
else {
    dir = './commands';
}

const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`${dir}/${file}`);
    client.commands.set(command.name, command);
}

client.on('ready', async () => {
    await guild_settings.addNewGuilds(client.guilds.cache.array().map(guild => guild.id));
    await settings_update;
    client.user.setActivity(config.bot.activity, { type: 'WATCHING' })
        .then(console.log('Activity set to ' + config.bot.activity))
        .catch(console.error);
    console.log('The bot is online!');

    config.rmOldMSG.forEach(element => {
        rmOldMSG(element);
    });

    fireStarter();
    setInterval(fireStarter, 86400000);

    // Deprecated scripts starter
    autoStartScripts(config.autostart);
});

client.on('message', async message => {
    await settings_update;
    messageHandler(message);
});

client.on('guildCreate', guild => {
    guild_settings.addNewGuild([guild.id]);
});

client.login(config.bot.token);