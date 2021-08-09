const Discord = require('discord.js');
const axios = require('axios');

// Get arguments
let arguments = process.argv.slice(2);
console.log(arguments);

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
        let winrateArguments = message.content.split('"');

        let validNoOfArgs = [3, 5, 7, 9, 11]

        if (!validNoOfArgs.includes(winrateArguments.length)) {
            message.channel.send('Wrong number of arguments. You need to do !wr "username1" "username2" ...');
            return;
        }

        if ((Date.now() - lastCall) < cooldown) {
            message.channel.send(`While developing this application, we need to enforce strict rate limits of 1 winrate request per ${cooldown/1000} seconds. A new request is ready in ` + ((cooldown - (Date.now() - lastCall)) / 1000) + " seconds");
            return;
        }

        let isEasterEggs = Object.keys(easterEggs).includes(winrateArguments[1]);
        if (isEasterEggs){
            sendEasterEggAnswer(message, winrateArguments[1])
        }
        else{
            sendRealAnswer(message, winrateArguments);
        }

    }
});

let sendEasterEggAnswer = (message, easterEggMessage) => {
    message.channel.send(easterEggs[easterEggMessage]);
}
let sendRealAnswer = (message, winrateArguments) => {

    let total = 0;
    let parameters = {}

    switch (winrateArguments.length) {
        case 3:
            total = 1;
            parameters = {
                user1: winrateArguments[1]
            }
            break
        case 5:
            total = 2;
            parameters = {
                user1: winrateArguments[1],
                user2: winrateArguments[3]
            }
            break
        case 7:
            total = 3;
            parameters = {
                user1: winrateArguments[1],
                user2: winrateArguments[3],
                user3: winrateArguments[5]
            }
            break;
        case 9:
            total = 4;
            parameters = {
                user1: winrateArguments[1],
                user2: winrateArguments[3],
                user3: winrateArguments[5],
                user4: winrateArguments[7]
            }
            break;
        case 11:
            total = 5;
            parameters = {
                user1: winrateArguments[1],
                user2: winrateArguments[3],
                user3: winrateArguments[5],
                user4: winrateArguments[7],
                user5: winrateArguments[9]
            }
    }

    const requestUrl = `http://winrateapi.lucaswinther.info/api/WinRate/GetWinrateTogether/${total}`;

    axios.get(requestUrl, {
        params: parameters
    }).then(function (result) {
        console.log(result.data);
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




