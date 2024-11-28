const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('./data/alegeri/prezenta_prezidentiale_2024')
    .filter(file => path.extname(file) === '.json')

let auxData = {};
for (const file of files) {
    let hour = 0;
    try {
        hour = file.match(/(\d+)\./)[1];
    } catch (e) {
        console.log(`No date for ${file}`);
        continue;
    }

    const data = require(`./data/alegeri/prezenta_prezidentiale_2024/${file}`);
    for (const judet of Object.keys(data)) {
        for (const localitate of Object.keys(data[judet])) {
            if (!auxData[judet]) auxData[judet] = {};
            if (!auxData[judet][localitate]) auxData[judet][localitate] = {};
            auxData[judet][localitate][hour] = { ...data[judet][localitate] };
            if(hour == 21) auxData[judet][localitate] = {...auxData[judet][localitate], ...data[judet][localitate] };
        }
    }
}
fs.writeFileSync('./data/alegeri/prezenta_prezidentiale1_24112024_HOURLY.json', JSON.stringify(auxData));
console.log(auxData);
console.log();
