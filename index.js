
const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const inputParsers = require('./inputParser');

module.exports.removePrefix = (prefix) => removePrefix(prefix);

let CLIENT_ID = '776207570482233376';
let CLIENT_TOKEN = ""

let debug_mode = true;


if (debug_mode){
    CLIENT_TOKEN = "Nzc2MjA3NTcwNDgyMjMzMzc2.GhUO6L.bdQ_0EhEaXshsCGv3jMl0IOxZz9xOquMGzGwNE"
}
else if (process.env.apikey == null){
    console.log("Please specify an API key in your environment variables.");
    process.exit(1);
}
else{
    CLIENT_TOKEN = process.env.apikey;
}

console.log("Building command")
const getWinrateTogetherBuilder = new SlashCommandBuilder()
    .setName('getwinratetogether')
    .setDescription('Get winrate together')
    .addStringOption(option => option.setName('user1').setDescription('The first user to get winrate with').setRequired(true))
    .addStringOption(option => option.setName('user2').setDescription('The second user of the winrate call').setRequired(false))
    .addStringOption(option => option.setName('user3').setDescription('The third user of the winrate call').setRequired(false))
    .addStringOption(option => option.setName('user4').setDescription('The second user of the winrate call').setRequired(false))
    .addStringOption(option => option.setName('user5').setDescription('The second user of the winrate call').setRequired(false))
    .addStringOption(option => option.setName('gametypes').setDescription('The gamemodes to check. Rf = ranked flex Rs = ranked solo/duo A = aram C = custom games').setRequired(false))



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

    if (interaction.commandName === 'ping') {
        await interaction.reply('Pong!');
    }
    else if (interaction.commandName === 'getwinratetogether'){
        const result = await getWinrateTogether(interaction.options.getString('user1'), interaction.options.getString('user2'),interaction.options.getString('user3'),interaction.options.getString('user4'),interaction.options.getString('user5'),interaction.options.getString('gametypes'));

        console.log("Finished awaiting result.")
        console.log(result);

        if (result.error != null){
            await interaction.reply("There was an error getting the winrate, please try again later.")
        }
        else{
            const {wins, losses} = result;

            console.log(interaction.options.getString('user1'))
            console.log(interaction.options.getString('user2'))
            const users = "" + interaction.options.getString('user1') + (interaction.options.getString('user2') == null ? '' : ` and ${interaction.options.getString('user2')}`) + (interaction.options.getString('user3') == null ? '' : ` and ${interaction.options.getString('user3')}`) + (interaction.options.getString('user4') == null ? '' : ` and ${interaction.options.getString('user4')}`) + (interaction.options.getString('user5') == null ? '' : ` and ${interaction.options.getString('user5')}`);

            await interaction.reply(`The winrate of ${users} is ${wins} wins and ${losses} in ${interaction.options.getString('gametypes') == null ? '' : `in game type ${interaction.options.getString('gamemodes')}`} losses which ${((wins/(wins + losses)) * 100).toFixed(2)}%`);

        }
    }
});


const getWinrateTogether = async (user1, user2, user3, user4, user5, gametypes) => {

    return new Promise(resolve => {

        const requestUrl = `https://winrateapi.lucaswinther.info/api/winrate/SameTeam?TeamMate=${user1}${user2==null ? '' : `&TeamMate=${user2}`}${user3==null ? '' : `&TeamMate=${user3}`}${user4==null ? '' : `&TeamMate=${user4}`}${user5==null ? '' : `&TeamMate=${user5}`}${gametypes==null ? '' : `&GameTypes=${gametypes}`}`;

        axios.get(requestUrl, {
            params: {}
        }).then(function (result) {
            console.log("Here is the result:")
            console.log(result.data);
            console.log("There was a note: ");
            console.log(result.data.note);

            resolve({wins: result.data.wins,
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



let sendRealAnswer = (message, users, options) => {

    let parameters = {}

    // Adds the users
    switch (users.length) {
        case 1:
            parameters = {
                user1: users[0]
            }
            break;
        case 2:
            parameters = {
                user1: users[0],
                user2: users[1]
            }
            break;
        case 3:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2]
            }
            break;
        case 4:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2],
                user4: users[3]
            }
            break;
        case 5:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2],
                user4: users[3],
                user5: users[4]
            }
            break;

    }

    // Adds the options
    for (const [key, value] of Object.entries(options)){
        switch (key) {
            case "type":
                // Bad input is handled on API
                parameters.MatchSelector = value;
                break;
            case "matches":
                let matchesIsValid = value >= 1 && value <= 200;
                if (matchesIsValid){
                    parameters.NoMatches = value;
                } else{
                    message.channel.send("Invalid --matches parameter. Please specify a value between 1 and 200");
                }
                break;
            case "daysago":
                let daysagoIsValid = value > 0;
                if (daysagoIsValid){
                    parameters.NoOfDays = value;
                }
        }
    }

    const requestUrl = `https://winrateapi.lucaswinther.info/api/WinRate/GetWinrateTogether/${users.length}`;

    //
    // Set a standard number of matches to look through, if youre are getting a winrate of just 1 person.
    //
    if (parameters.NoMatches === undefined && parameters.user2 === undefined){
        parameters.NoMatches = 50;
    }

    console.log("Params: ")
    console.log(parameters);

    axios.get(requestUrl, {
        params: parameters
    }).then(function (result) {
        console.log("Here is the result:")
        console.log(result.data);
        console.log("There was a note: ");
        console.log(result.data.note);

        // We hit API limit.
        if (result.data?.note === '1'){
            message.channel.send("Unable to fully satisfy the request, please try again later. The message below describes how far we looked.");
        }
        if (result.data?.note === '2'){
            message.channel.send("Not enough matches played to satisfy the matches parameter");
        }


        let totalGames = result.data.wins + result.data.losses;

        if (totalGames === 0){
            message.channel.send(`The specified user(s) do not have any recent games together.`)
            return
        }

        if (parameters.user2 !== undefined){
            message.channel.send(`The winrate of ${parameters.user1}, ${parameters.user2}${parameters.user3 !== undefined ? `, ${parameters.user3}` : ""}${parameters.user4 !== undefined ? `, ${parameters.user4}` : ""}${parameters.user5 !== undefined ? `, ${parameters.user5}` : ""} is ${((result.data.wins/totalGames) * 100).toFixed(2)}% based on their recent ${totalGames} ${totalGames > 1 ? "games" : "game"} together.`)
        }
        else{
            message.channel.send(`The winrate of ${parameters.user1} is ${((result.data.wins/totalGames) * 100).toFixed(2)}% based on their recent ${totalGames} games.`)
        }




        lastCall = new Date();
    }).catch(function (error) {
        message.channel.send("A username wasn't found, or there was a server problem, please try again later");
        console.log("There was an error getting the winrate");
        console.log(error);
    }).then(function () {
        // always executed
    });
}


client.login(CLIENT_TOKEN);


/*if (process.env.apikey == null){
    console.log("Please specify an API key in your environment variables.");
    process.exit(1);
}
else{
    key = process.env.apikey;
}*/

// login to Discord with your app's token

module.exports.removePrefix = (prefix) => removePrefix(prefix);


/*
const Discord = require('discord.js');
const axios = require('axios');
const inputParsers = require('./inputParser');

// create a new Discord client
const client = new Discord.Client();

// when the client is ready, run this code
// this event will only trigger one time after logging in
client.once('ready', () => {
    console.log('Ready!');
});

let easterEggs = {
    "Joe": "Joe Mama",
    "Ligma": "Ligma Balls"
}

// 10 seconds
let cooldown = 10 * 1000;
let lastCall = Date.now() - cooldown;

client.on('message', message => {
    if (message.content.startsWith('!winrate') || message.content.startsWith("!wr")) {

        let messageContent = message.content;

        messageContent = inputParsers.removePrefix(messageContent);

        let options = inputParsers.parseOptions(messageContent);
        messageContent = options.newMessageContent;

        let users;
        try {
            users = inputParsers.parseUsers(messageContent);
        } catch (e) {
            message.channel.send('Uneven number of " in specified usernames. Please check your input for errors.');
            return;
        }

        let validNoOfUsers = [1, 2, 3, 4, 5]

        if (!validNoOfUsers.includes(users.length)) {
            message.channel.send('Wrong number of arguments. You need to do !wr username1 username2 "user name 3" ...');
            return;
        }

        if ((Date.now() - lastCall) < cooldown) {
            message.channel.send(`While developing this application, we need to enforce strict rate limits of 1 winrate request per ${cooldown/1000} seconds. A new request is ready in ` + ((cooldown - (Date.now() - lastCall)) / 1000) + " seconds");
            return;
        }

        let isEasterEggs = Object.keys(easterEggs).includes(users[0]);
        if (isEasterEggs){
            sendEasterEggAnswer(message, users[0])
        }
        else{
            sendRealAnswer(message, users, options);
        }

    }
});


let sendEasterEggAnswer = (message, easterEggMessage) => {
    message.channel.send(easterEggs[easterEggMessage]);
}

let sendRealAnswer = (message, users, options) => {

    let parameters = {}

    // Adds the users
    switch (users.length) {
        case 1:
            parameters = {
                user1: users[0]
            }
            break;
        case 2:
            parameters = {
                user1: users[0],
                user2: users[1]
            }
            break;
        case 3:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2]
            }
            break;
        case 4:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2],
                user4: users[3]
            }
            break;
        case 5:
            parameters = {
                user1: users[0],
                user2: users[1],
                user3: users[2],
                user4: users[3],
                user5: users[4]
            }
            break;

    }

    // Adds the options
    for (const [key, value] of Object.entries(options)){
        switch (key) {
            case "type":
                // Bad input is handled on API
                parameters.MatchSelector = value;
                break;
            case "matches":
                let matchesIsValid = value >= 1 && value <= 200;
                if (matchesIsValid){
                    parameters.NoMatches = value;
                } else{
                    message.channel.send("Invalid --matches parameter. Please specify a value between 1 and 200");
                }
                break;
            case "daysago":
                let daysagoIsValid = value > 0;
                if (daysagoIsValid){
                    parameters.NoOfDays = value;
                }
        }
    }

    const requestUrl = `https://winrateapi.lucaswinther.info/api/WinRate/GetWinrateTogether/${users.length}`;

    /!*
     * Set a standard number of matches to look through, if youre are getting a winrate of just 1 person.
     *!/
    if (parameters.NoMatches === undefined && parameters.user2 === undefined){
        parameters.NoMatches = 50;
    }

    console.log("Params: ")
    console.log(parameters);

    axios.get(requestUrl, {
        params: parameters
    }).then(function (result) {
        console.log("Here is the result:")
        console.log(result.data);
        console.log("There was a note: ");
        console.log(result.data.note);

        // We hit API limit.
        if (result.data?.note === '1'){
            message.channel.send("Unable to fully satisfy the request, please try again later. The message below describes how far we looked.");
        }
        if (result.data?.note === '2'){
            message.channel.send("Not enough matches played to satisfy the matches parameter");
        }


        let totalGames = result.data.wins + result.data.losses;

        if (totalGames === 0){
            message.channel.send(`The specified user(s) do not have any recent games together.`)
            return
        }

        if (parameters.user2 !== undefined){
            message.channel.send(`The winrate of ${parameters.user1}, ${parameters.user2}${parameters.user3 !== undefined ? `, ${parameters.user3}` : ""}${parameters.user4 !== undefined ? `, ${parameters.user4}` : ""}${parameters.user5 !== undefined ? `, ${parameters.user5}` : ""} is ${((result.data.wins/totalGames) * 100).toFixed(2)}% based on their recent ${totalGames} ${totalGames > 1 ? "games" : "game"} together.`)
        }
        else{
            message.channel.send(`The winrate of ${parameters.user1} is ${((result.data.wins/totalGames) * 100).toFixed(2)}% based on their recent ${totalGames} games.`)
        }




        lastCall = new Date();
    }).catch(function (error) {
        message.channel.send("A username wasn't found, or there was a server problem, please try again later");
        console.log("There was an error getting the winrate");
        console.log(error);
    }).then(function () {
        // always executed
    });
}

// Read auth key from environment variables.
let key;
if (process.env.apikey == null){
    console.log("Please specify an API key in your environment variables.");
    process.exit(1);
}
else{
    key = process.env.apikey;
}

// login to Discord with your app's token
client.login(key);

module.exports.removePrefix = (prefix) => removePrefix(prefix);


*/
