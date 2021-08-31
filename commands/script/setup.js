module.exports = {
    name: 'setup', // Command name
    args: false, // Specify if arguments are needed
    guildOnly: true, // Specify if the command can only be used in guilds
    aliases: undefined, // Aliases for the command
    help: 'setup: Walks through the script setup procedure', // Help information to show
    async execute({ message }) {
        class askQuestions {
            constructor({ questions = [], wait = 60000, retries = 3, channel }) {
                this.questions = questions;
                this.wait = wait;
                this.retries = [];
                this.res = [];
                this.sentMessages = [];
                this.constant_retries = retries;
                this.channel = channel;
            }
            async main(questions_in) {
                let json;
                this.sentMessages[this.sentMessages.length] = this.channel.send('Please answer the following questions to set up a script.\nBy answering: ``Please stop and exit`` you can cancel the operation');

                if (typeof questions_in == 'object') this.questions = this.questions.concat(questions_in);

                for (let index = 0; index < this.questions.length; index++) {
                    const question = this.questions[index].question;
                    if (this.retries[index] == undefined) this.retries[index] = this.constant_retries;

                    await this.asker(async (messages) => {
                        const content = messages.first().content;
                        if (content == 'Please stop and exit') {
                            this.res[index] = 'U_KEY_PRESSED';
                            this.sentMessages[this.sentMessages.length] = this.channel.send('Exiting.');
                            return;
                        }
                        const { res: parsed_answer, script_setup } = await this.questions[index].answer(content);

                        if (script_setup != undefined) {
                            if (script_setup.questions != undefined) this.questions = this.questions.concat(script_setup.questions);
                            if (script_setup.json != undefined) json = script_setup.json;
                        }
                        if (parsed_answer == 'INVALID_ANSWER') {
                            if (this.retriesIsZero(index)) return this.res[index] = 'INVALID_ANSWER';
                            this.decrementRetries(index);
                            index--;
                            return;
                        }
                        this.res[index] = parsed_answer;
                        this.sentMessages[this.sentMessages.length] = this.channel.send(`You've entered: \`\`${parsed_answer}\`\``);
                        await json;
                    }, question);

                    if (breaks.some(x => x == this.res[index])) {
                        this.sentMessages[this.sentMessages.length] = this.channel.send('You\'ve entered the wrong input too many times. Run this command again to retry');
                        break;
                    }
                }

                const { res } = this;
                return { res, json };
            }
            async asker(callback, content) {
                const { wait } = this;
                const ask_msg = this.channel.send(content);
                this.sentMessages[this.sentMessages.length] = ask_msg;

                await ask_msg.then(async () => {
                    const filter = m => message.author.id === m.author.id;

                    await this.channel.awaitMessages(filter, { wait, max: 1, errors: ['time'] })
                        .then(await callback)
                        .catch(async (err) => {
                            console.error(err);
                            this.sentMessages[this.sentMessages.length] = this.channel.send('You did not enter any input! Run this command again to retry');
                        });
                });
            }
            async cleanup() {
                let should_clean;
                let error;

                do {
                    await this.asker(async messages => {
                        const content = messages.first().content.toLowerCase();
                        if (content != 'yes' && content != 'no') return should_clean = 'INVALID_ANSWER';
                        return should_clean = (content == 'yes') ? true : false;
                    }, 'Would you like to remove all these messages?');
                }
                while (should_clean == 'INVALID_ANSWER');

                if (should_clean) {
                    this.sentMessages[this.sentMessages.length] = this.channel.send('Removing.');

                    // Make sure all promises are returned
                    for (const index in this.sentMessages) {
                        this.sentMessages[index].then((msg) => {
                            msg.delete()
                                .catch(async err => {
                                    error = { name: 'REMOVE_ERROR', err };
                                });
                        });
                    }
                }
                if (error != undefined) throw error;
            }
            incrementRetries(index) {
                this.retries[index]++;
            }
            decrementRetries(index) {
                this.retries[index]--;
            }
            retriesIsZero(index) {
                return (this.retries[index] === 0);
            }
        }

        const config = require(paths.files.config);

        // const fs = require('fs');
        const path = require('path');
        const mariadb = require('mariadb');

        const db_conn = mariadb.createConnection({ host: config.mariadb.host, user: config.mariadb.user, password: config.mariadb.password, database: config.mariadb.database, port: config.mariadb.port });

        const script_path = paths.dirs.scripts;
        const breaks = ['NO_ANSWER', 'U_KEY_PRESSED', 'INVALID_ANSWER'];
        const all_scripts = await (await db_conn).query('SELECT * FROM scripts').catch(err => console.error(err));
        const scripts = all_scripts.filter(script => script.hidden == 0);
        // const extension = '.js';
        // const scripts = fs.readdirSync(script_path).filter(file => file.endsWith(extension)).map(v => v.split(extension)[0]);

        const question_options = {
            channel: message.channel,
            questions: [
                {
                    question: `\`\`Enter the script name:\`\`\nPossible script names are: \`\`${scripts.map(v => v.script_name).join('``, ``')}\`\``,
                    answer: async function(v) {
                        if (!scripts.some(val => val.script_name == v)) return { res: 'INVALID_ANSWER' };
                        const script_setup = await require(path.join(script_path, v)).setup;
                        return { res: v, script_setup };
                    },
                },
                {
                    question: '``Enter the value for "Enabled" as true or false:``',
                    answer: (v) => {
                        if (v != 'true' && v != 'false') return { res: 'INVALID_ANSWER' };
                        return { res: (v == 'true') ? '1' : '0' };
                    },
                },
            ],
        };

        const inputGenerator = new askQuestions(question_options);
        const promise = inputGenerator.main();

        promise.then(async ({ res: responses, json: json }) => {
            if (breaks.filter(element => responses.includes(element)).length != 0) {
                return inputGenerator.cleanup().catch(err => {
                    console.error(err);
                    // const err_attachment = new Discord.MessageAttachment(Buffer.from(JSON.stringify(err)), 'error.txt');
                    message.channel.send('There was an error removing all or some messages, please remove some other way');
                });
            }

            const channel = message.channel;

            const script_ID = scripts.find(v => responses[0] == v.script_name).script_ID;
            const enabled = responses[1];
            const args = await json({ channel, responses });

            const query = (await db_conn).query(`
            INSERT INTO autostart(script_ID, enabled, guild_ID, args)
            VALUES("${script_ID}", "${enabled}", ${message.guild.id}, '${args}')
            `);

            query.catch(err => console.error(err));

            query.then(v => {
                channel.send(`The ID of this command is: ${v.insertId}. You need this to manage the script. Script will run on next restart`);
                db_conn.end();
            });
        });

        promise.then(() => {
            inputGenerator.cleanup().catch(err => {
                console.error(err);
                // const err_attachment = new Discord.MessageAttachment(Buffer.from(JSON.stringify(err)), 'error.txt');
                message.channel.send('There was an error removing all or some messages, please remove some other way');
            });
        });
    },
};
