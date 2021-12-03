module.exports = {
    name: 'role-members',
    args: true,
    guildOnly: true,
    aliases: ['rm'], // Aliases for the command
    help: '!role-members <role name>; Show members of a role', // Help information to show
    restricted: [], // Options: discord ID, role ID, role Name
    async execute(message, args) {
        try {
            const roleName = args.join(' ');
            console.log(roleName);
            await message.guild.roles.fetch();
            const taggedRole = await message.guild.roles.cache.find(role => role.name == roleName);

            const role_members = await taggedRole.members.map(element => {
                return element.displayName;
            });

            message.channel.send(`**These people were found in the role:**\n${role_members.join('\n')}`);
        }
        catch(error) {
            console.log('error with taggedRole', error);
            message.channel.send('The role can\'t be found');
        }
    },
};
