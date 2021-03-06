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

    /*
     * Set a standard number of matches to look through, if youre are getting a winrate of just 1 person.
     */
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


