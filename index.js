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

// 5 minutes

let cooldown = 5 * 60 * 1000;
let lastCall = Date.now() - cooldown;

client.on('message', message => {
    if (message.content.startsWith('!winrate') || message.content.startsWith("!wr")) {
        let winrateArguments = message.content.split('"');

        if (winrateArguments.length !== 5) {
            message.channel.send('Wrong number of arguments. You need to do !wr "username1" "username2"');
            return;
        }

        if ((Date.now() - lastCall) < cooldown) {
            message.channel.send('While developing this application, we need to enforce strict rate limits of 1 winrate request per 5 minutes. A new request is ready in ' + ((cooldown - (Date.now() - lastCall)) / 1000) + " seconds");
            return;
        }

        const user1 = winrateArguments[1];
        const user2 = winrateArguments[3];

        const requestUrl = `http://winrateapi.lucaswinther.info/api/WinRate/GetWinrateTogether/2`;

        axios.get(requestUrl, {
            params: {
                User1: user1,
                User2: user2
            }
        }).then(function (result) {
            console.log(result.data);
            let totalGames = result.data.wins + result.data.losses;

            if (totalGames == 0){
                message.channel.send(`${user1} does not have any recent games with ${user2}`)
                return
            }

            message.channel.send(`${user1}'s winrate with ${user2} is ${((result.data.wins/totalGames) * 100).toFixed(2)}% based on their recent ${totalGames} games.`)
            lastCall = new Date();
        }).catch(function (error) {
            message.channel.send("There was a server problem, please try again later");
            console.log("There was an error getting the winrate");
            console.log(error);
        }).then(function () {
                // always executed
            });
    }
});

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




