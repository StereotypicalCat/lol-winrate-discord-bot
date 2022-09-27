
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');

module.exports.removePrefix = (prefix) => removePrefix(prefix);

let CLIENT_ID = '776207570482233376';
let CLIENT_TOKEN = "";

let debug_mode = false;

if (process.env.apikey == null){
    console.log("Please specify an API key in your environment variables.");
    process.exit(1);
}
else{
    CLIENT_TOKEN = process.env.apikey;
}

class TwoWayMap {
    constructor(map) {
        this.map = map;
        this.reverseMap = {};
        for(const key in map) {
            const value = map[key];
            this.reverseMap[value] = key;
        }
    }
    get(key) { return this.map[key]; }
    revGet(key) { return this.reverseMap[key]; }
}

const GameTypeToTextTwoWayMap = new TwoWayMap({
    'Rf': 'Ranked Flex',
    'Rs': 'Ranked Solo/Duo',
    'A': 'Aram',
    'C': 'Custom',
    'Cl': 'Clash',
    'B': 'Blind',
    'RfRs': 'Ranked',
    '': 'All',
    'BAC': 'Unranked',
});

const RoleToTextTwoWayMap = new TwoWayMap({
    'to': 'Toplane',
    'su': "Support",
    'ju': "Jungle",
    'mi': "Midlane",
    'bo': "Botlane",
});

// Per server cooldown between api calls
// Increased if a request has high number of matches
let cooldownPerMatchRequested = 1000;
let server_cooldowns = new Map()

console.log("Building command")



const getWinrateTogetherBuilder = new SlashCommandBuilder()
    .setName('winrate')
    .setDescription('Gets the winrate')
    .addSubcommand(subcommand =>
        subcommand.setName('of_player')
            .setDescription('Gets the winrate of a player')
            .addStringOption(option => option.setName('user1').setDescription('The Username of the Player').setRequired(true))
            .addStringOption(option => option.setName('user1_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user1_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('gametypes').setDescription('The gamemodes to check.').setRequired(false).addChoices(
                { name: 'Ranked Flex', value: 'Ranked Flex' },
                { name: 'Ranked Solo/Duo', value: 'Ranked Solo/Duo' },
                { name: 'Aram', value: 'Aram'},
                { name: 'Custom', value: 'Custom'},
                { name: 'Clash', value: 'Clash'},
                { name: 'Blind', value: 'Blind'},
                { name: 'All', value: 'All'},
                { name: 'Ranked', value: 'Ranked'},
                { name: 'Unranked', value: 'Unranked'},
            ))
            .addIntegerOption(option => option.setName('history').setDescription('The number of games to check').setRequired(false).addChoices(
                { name: 'Recent', value: 10 },
                { name: 'Last 25', value: 25 },
                { name: 'Last 50', value: 50 },
            )))
    .addSubcommand(subcommand =>
        subcommand.setName('of_player_against')
            .setDescription('Gets the winrate of a player against specific users and champions in different roles')
            .addStringOption(option => option.setName('user1').setDescription('The Username of the Player').setRequired(true))
            .addStringOption(option => option.setName('user1_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user1_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('gametypes').setDescription('The gamemodes to check.').setRequired(false).addChoices(
                { name: 'Ranked Flex', value: 'Ranked Flex' },
                { name: 'Ranked Solo/Duo', value: 'Ranked Solo/Duo' },
                { name: 'Aram', value: 'Aram'},
                { name: 'Custom', value: 'Custom'},
                { name: 'Clash', value: 'Clash'},
                { name: 'Blind', value: 'Blind'},
                { name: 'All', value: 'All'},
                { name: 'Ranked', value: 'Ranked'},
                { name: 'Unranked', value: 'Unranked'},
            ))

            .addIntegerOption(option => option.setName('history').setDescription('The number of games to check').setRequired(false).addChoices(
                { name: 'Recent', value: 10 },
                { name: 'Last 25', value: 25 },
                { name: 'Last 50', value: 50 },
            ))
            .addStringOption(option => option.setName('enemy1').setDescription('The Username of the Player').setRequired(false))
            .addStringOption(option => option.setName('enemy1_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('enemy1_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('enemy2').setDescription('The Username of the Player').setRequired(false))
            .addStringOption(option => option.setName('enemy2_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('enemy2_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('enemy3').setDescription('The Username of the Player').setRequired(false))
            .addStringOption(option => option.setName('enemy3_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('enemy3_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('enemy4').setDescription('The Username of the Player').setRequired(false))
            .addStringOption(option => option.setName('enemy4_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('enemy4_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('enemy5').setDescription('The Username of the Player').setRequired(false))
            .addStringOption(option => option.setName('enemy5_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('enemy5_champ').setDescription('The first user to get winrate with').setRequired(false))

    )
            .addSubcommand(subcommand =>
        subcommand.setName('of_teammates')
            .setDescription('Gets the winrate with up to five teammates')
            .addStringOption(option => option.setName('user1').setDescription('The first user to get winrate with').setRequired(true))
            .addStringOption(option => option.setName('user2').setDescription('The second user of the winrate call').setRequired(true))
            .addStringOption(option => option.setName('user1_role').setDescription('The first user to get winrate with').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user1_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('user2_role').setDescription('The second user of the winrate call').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user2_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('user3').setDescription('The third user of the winrate call').setRequired(false))
            .addStringOption(option => option.setName('user3_role').setDescription('The third user of the winrate call').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user3_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('user4').setDescription('The second user of the winrate call').setRequired(false))
            .addStringOption(option => option.setName('user4_role').setDescription('The second user of the winrate call').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user4_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('user5').setDescription('The second user of the winrate call').setRequired(false))
            .addStringOption(option => option.setName('user5_role').setDescription('The second user of the winrate call').setRequired(false).addChoices(
                { name: 'Top', value: 'to' },
                { name: 'Middle', value: 'mi'},
                { name: 'Bottom', value: 'bo'},
                { name: 'Jungle', value: 'ju'},
                { name: 'Support', value: 'su'},
            ))
            .addStringOption(option => option.setName('user5_champ').setDescription('The first user to get winrate with').setRequired(false))
            .addStringOption(option => option.setName('gametypes').setDescription('The gamemodes to check.').setRequired(false).addChoices(
                { name: 'Ranked Flex', value: 'Ranked Flex' },
                { name: 'Ranked Solo/Duo', value: 'Ranked Solo/Duo' },
                { name: 'Aram', value: 'Aram'},
                { name: 'Custom', value: 'Custom'},
                { name: 'Clash', value: 'Clash'},
                { name: 'Blind', value: 'Blind'},
                { name: 'All', value: 'All'},
                { name: 'Ranked', value: 'Ranked'},
                { name: 'Unranked', value: 'Unranked'},
            ))
            .addIntegerOption(option => option.setName('history').setDescription('The number of games to check').setRequired(false).addChoices(
                { name: 'Recent', value: 10 },
                { name: 'Last 25', value: 25 },
                { name: 'Last 50', value: 50 },
            ))
    );




console.log("converting command to json")
const jsonCommand = getWinrateTogetherBuilder.toJSON();

const commands = [
    {
        name: 'ping',
        description: 'Replies with Pong!',
    },
    jsonCommand
];

const rest = new REST({ version: '10' }).setToken(CLIENT_TOKEN);

(async () => {
    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }
})();

const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});


client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (Date.now() < server_cooldowns.get(interaction.guildId)) {
        interaction.reply({content: `A recent request was made from this server. A new request is ready in ${Math.ceil(((server_cooldowns.get(interaction.guildId) - Date.now()) / 1000))} seconds`,
            ephemeral: true});
        return;
    }

    if (interaction.commandName === 'ping') {
        await interaction.reply('**Pong!**');
    }

    if (interaction.commandName === 'winrate') {
        handleWinrate(interaction);
    }

});


let format_users = (interaction_options) => {

    let users = ''

    for (let i = 1; i < 6; i++){
        let newUser = ''

        if (interaction_options.get(`user${i}`) != null){
            newUser += interaction_options.getString(`user${i}`)
        }
        if (interaction_options.get(`user${i}_role`) != null){
            newUser += ' playing ' + RoleToTextTwoWayMap.get(interaction_options.getString(`user${i}_role`))
        }
        if (interaction_options.get(`user${i}_champ`) != null){
            newUser += ' as ' + interaction_options.getString(`user${i}_champ`)
        }


        users += newUser === '' ? '' : newUser + ', '
    }

    return users.substring(0, users.length - 2)

}


let handleWinrate = async (interaction) => {
    let subcommand = interaction.options.getSubcommand()

    if (subcommand === 'of_player' || subcommand === 'of_teammates'){
        // Make discord wait more than 3 seconds for reply.
        server_cooldowns.set(interaction.guildId, Date.now() + (interaction.options.getInteger('history') == null ? 10  * cooldownPerMatchRequested : interaction.options.getInteger('history') * cooldownPerMatchRequested));

        await interaction.deferReply()

        try {
            const result = await getWinrateTogether(interaction.options);

            console.log("Finished awaiting result.")
            console.log(result);

            let final_string = ""

            const {error, wins, losses} = result;

            if (error !== ''){
                //await interaction.editReply("There was an error getting the winrate, please try again later.")
                final_string = final_string + result.error.toString()
            }
            if (wins + losses !== 0){

                let gameType =  interaction.options.getString('gametypes') == null ? '' : "in " + interaction.options.getString('gametypes') + ' games'
                let users = format_users(interaction.options)
                let winrate_as_percent = ((wins/(wins + losses)) * 100).toFixed(2)

                final_string = final_string + `\n` + (`The winrate of ${users} ${gameType}is ${wins} wins and ${losses} losses which is **${winrate_as_percent}%**`);
            }

            await interaction.editReply(final_string);
        } catch (e){
            console.log(e);
            await interaction.editReply("There was an error getting the winrate, please try again later.")
        }
    }
}

let appendIfNotNull = (UrlSearchParamss, nameOfParam, valueOfParam) => {
    if (valueOfParam != null && valueOfParam !== ''){
        UrlSearchParamss.append(nameOfParam, valueOfParam);
    }
}

const getWinrateTogether = async (interaction_options) => {

    let paramsObj = new URLSearchParams();

    appendIfNotNull(paramsObj, "TeamMate1", interaction_options.getString('user1'));
    appendIfNotNull(paramsObj, "TeamMate2", interaction_options.getString('user2'));
    appendIfNotNull(paramsObj, "TeamMate3", interaction_options.getString('user3'));
    appendIfNotNull(paramsObj, "TeamMate4", interaction_options.getString('user4'));
    appendIfNotNull(paramsObj, "TeamMate5", interaction_options.getString('user5'));
    appendIfNotNull(paramsObj, "TeamMatePosition1", interaction_options.getString('user1_role'));
    appendIfNotNull(paramsObj, "TeamMatePosition2", interaction_options.getString('user2_role'));
    appendIfNotNull(paramsObj, "TeamMatePosition3", interaction_options.getString('user3_role'));
    appendIfNotNull(paramsObj, "TeamMatePosition4", interaction_options.getString('user4_role'));
    appendIfNotNull(paramsObj, "TeamMatePosition5", interaction_options.getString('user5_role'));
    appendIfNotNull(paramsObj, "TeamMateChampion1", interaction_options.getString('user1_champ'));
    appendIfNotNull(paramsObj, "TeamMateChampion2", interaction_options.getString('user2_champ'));
    appendIfNotNull(paramsObj, "TeamMateChampion3", interaction_options.getString('user3_champ'));
    appendIfNotNull(paramsObj, "TeamMateChampion4", interaction_options.getString('user4_champ'));
    appendIfNotNull(paramsObj, "TeamMateChampion5", interaction_options.getString('user5_champ'));
    appendIfNotNull(paramsObj, "GameTypes", GameTypeToTextTwoWayMap.get(interaction_options.getString('gametypes')));
    appendIfNotNull(paramsObj, "NoMatches", interaction_options.getInteger('history'));

    return new Promise(resolve => {

        //const requestUrl = `?TeamMate=${user1}${user2==null ? '' : `&TeamMate=${user2}`}${user3==null ? '' : `&TeamMate=${user3}`}${user4==null ? '' : `&TeamMate=${user4}`}${user5==null ? '' : `&TeamMate=${user5}`}${gametypes==null ? '' : `&GameTypes=${gametypes}`}${history==null ? '' : `&NoMatches=${history}`}`;
        const baseUrl = 'https://winrateapi.lucaswinther.info/api/winrate/SameTeam'

        console.log("Sending Request")

        console.log(paramsObj)

        axios.get(baseUrl, {
            params: paramsObj
        }).then(function (result) {
/*            console.log("Here is the result:")
            console.log(result.data);
            console.log("There was a note: ");
            console.log(result.data.note);*/

            resolve({
                error: result.data.error,
                wins: result.data.wins,
                losses: result.data.losses})

        }).catch(function (error) {
            //  message.channel.send("A username wasn't found, or there was a server problem, please try again later");
            console.log("There was an error getting the winrate");
            console.log(error);

            resolve({error: "There was an error"})

        }).then(function () {
            // always executed
            console.log("request finished")
        });
    });
}


client.login(CLIENT_TOKEN);