
/*
* Removes the prefix !wr or !winrate from the string.
* */
let removePrefix = (messageContent) => {
    let endOfPrefix = messageContent.indexOf(' ');
    let newMessageContent = messageContent.slice(endOfPrefix + 1, messageContent.length);

    return newMessageContent;
}

/*
* Returns -1 if invalid, or the number if it isnt invalid.
* */
let parseNumber = (text) => {

    let number = -1;

    if (/^[-+]?(\d+|Infinity)$/.test(text)) {
        number = Number(text)
    }

    return number;
}

let parseOptions = (messageContent) => {

    let options = {};

    let messageContentSplit = messageContent.split(' ');
    let i = 0;
    let shouldExit = false;
    while (!shouldExit) {
        if (messageContentSplit[i].startsWith("--")) {
            switch (messageContentSplit[i].replace('--', '')) {
                case "type":
                    options.type = messageContentSplit[i + 1];
                    break;
                case "matches":
                    options.matches = parseNumber(messageContentSplit[i + 1]);
                    break;
                case "fromdaysago":
                    options.daysago = parseNumber(messageContentSplit[i + 1])
                    break;
            }
            i += 2;
        } else {
            shouldExit = true;
        }
    }
    let newMessageContent;

    if (i != 0){
        // Starts at the end of the final parameter + 1 space
        //console.log(messageContent.indexOf(messageContentSplit[i-2] + " " + messageContentSplit[i-1]));
        //let indexUsersStartAt = messageContent.indexOf(messageContentSplit[i-2] + " " + messageContentSplit[i-1]) + messageContentSplit[i-2].length + messageContentSplit[i-2].length + 2;

        // For now, just start at the index of what the first username is (include the starting ' ')
        let indexUsersStartAt = messageContent.indexOf(messageContentSplit[i]);
        newMessageContent = messageContent.slice(indexUsersStartAt, messageContent.length)
    } else{
        newMessageContent = messageContent;
    }

    options.newMessageContent = newMessageContent;

    return options;
}


/*
 *
 *  TODO: Fix infinite loop if end character is a "
 */
let parseUsers = (messageContent) => {
    let users = [];

    let i = 0;

    if (messageContent[0] !== ' '){
        messageContent = " " + messageContent;
    }

    while (i < messageContent.length && i !== -1){
        let char = messageContent[i];

        let isSpace = char === ' ';
        if (isSpace){
            let nextIsSemicolon = messageContent[i+1] === '"';
            if (nextIsSemicolon){
                i = i + 1;
                let endIndex = messageContent.indexOf('"', i + 1);
                users.push(messageContent.slice(i+1, endIndex));
                i = endIndex + 1;
            }
            else{
                let endIndex = messageContent.indexOf(' ', i+1)
                users.push(messageContent.slice(i+1, endIndex === -1 ? messageContent.length : endIndex))
                i = endIndex;
            }
        }
        else{
            if (i == 0){
                i = -1;
            } else{
                i = i + 1;
            }
        }

    }

    return users;
}

module.exports.parseNumber = (text) => parseNumber(text);
module.exports.removePrefix = (messageContent) => removePrefix(messageContent);
module.exports.parseOptions = (messageContent) => parseOptions(messageContent);
module.exports.parseUsers = (messageContent) => parseUsers(messageContent);