const Discord = require('discord.js');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

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
    if (message.content.startsWith('!winrate')) {
        let winrateArguments = message.content.split(' ');
        if (winrateArguments.length !== 3){
            message.channel.send('Wrong number of arguments. You need to do !winrate username1 username2');
            return;
        }
        if (Date.now() - lastCall < cooldown){
            message.channel.send('While developing this application, we need to enforce strict rate limits of 1 winrate request per 5 minutes. A new request is ready in ' + ((Date.now() - lastCall)/1000) + " seconds");
            return;
        }

        let user1 = winrateArguments[1];
        let user2 = winrateArguments[2];

        fetch(`https://winrateapi.lucaswinther.info/api/WinRate?User1=${user1}&User2=${user2}`)
            .then(res => res.json())
            .then(
                (result) => {

                    let totalGames = result.wins + result.losses;

                    if (totalGames == 0){
                        message.channel.send(`${user1} does not have any recent games with ${user2}`)
                        return
                    }

                    message.channel.send(`${user1}'s winrate with ${user2} is ${result.wins/totalGames}.`)
                    lastCall = new Date();
                },
                // Note: it's important to handle errors here
                // instead of a catch() block so that we don't swallow
                // exceptions from actual bugs in components.
                (error) => {
                    this.setState({
                        isLoaded: true,
                        error
                    });
                }
            )
    }


});

// Try and login with data from last time if no arguments was specified.
let key;

if (arguments.length === 0){
    try{
        data = fs.readFileSync('./key.txt', "utf-8");
        console.log("Key file read...")
        try {
            console.dir(data);
            if (data === ""){
                rl.question("Key was not specified, please enter manually: ", answer => {
                    key = answer;
                });
            }
            console.log("Key successfully loaded from save");
            key = data;
        }
        catch (err) {
            console.log('Error loading last saved key, or key does not exist.')
            console.log(err);
        }
    }
    catch{
        console.log("No previous save data was found.")
    }
}
else{
    key = arguments[0];
    fs.writeFile('./key.txt', key, function (err) {
        if (err) {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            return;
        }
        console.log('Key saved successfully.')
    });
}

// login to Discord with your app's token
client.login(key);




