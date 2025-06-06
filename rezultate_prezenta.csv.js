const fs = require("fs");
const { default: axios } = require("axios");
let countryCodes = require("./data/map/countries.json");
const { parse } = require("csv-parser");
// const { parse } = require("csv-parse");
const { exec } = require("child_process");
const csvParser = require("csv-parser");

const args = process.argv.slice(2);
const alegeri = {
    "locale2020": {
        roaep: "locale27092020",
        file: "locale27092020",
    },
    "parlamentare2020": {
        roaep: "parlamentare06122020",
        file: "parlamentare06122020",
    },
    "locale2024": {
        roaep: "locale09062024v2",
        file: "locale09062024v2",
    },
    "europarlamentare2024": {
        roaep: "europarlamentare09062024",
        file: "europarlamentare09062024",
    },
    "prezidentiale1_2024": {
        roaep: "prezidentiale24112024",
        file: "prezidentiale24112024",
    },
    "parlamentare2024": {
        roaep: "parlamentare01122024",
        file: "parlamentare01122024",
    },
    "prezidentiale2_2024": {
        roaep: "prezidentiale08122024",
        file: "prezidentiale08122024",
    },
    "prezidentiale2025": {
        roaep: "prezidentiale04052025",
        file: "prezidentiale04052025",
    },
    "prezidentiale22025": {
        roaep: "prezidentiale18052025",
        file: "prezidentiale18052025",
    },
};
let judete = [...Object.keys(require("./data/map/county_population.json")).map(e => e.toLowerCase()), "sr"];
if (args.length === 0) args[0] = Object.keys(alegeri)[Object.keys(alegeri).length - 1];
if (args.length < 1 || !alegeri[args[0]]) {
    console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join("|")}]`);
    process.exit(0);
}

async function downloadFile(url, file) {

    const writer = fs.createWriteStream(file);
    const response = await axios({
        url,
        method: "GET",
        responseType: "stream"
    });

    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
    });
}
String.prototype.clear = function () {
    return this
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/(MUNICIPIUL|ORAS) ?/ig, "")
        .replace(/\. /ig, ".")
        .replace(/ - /ig, "-")
        ;
};
async function processPresence(turAlegeri, hours) {

    const alegeriName = turAlegeri.roaep;
    const alegeriDate = alegeriName.match(/([0-9]{2})([0-9]{2})([0-9]{4})/);
    const fileName = turAlegeri.file;
    if (hours === undefined) hours = ["now"];

    let prezenta = {};

    console.log(alegeriName);

    if (!fs.existsSync("./data/alegeri/raw")) fs.mkdirSync("./data/alegeri/raw");
    else fs.rmSync("./data/alegeri/raw", { recursive: true, force: true });

    let hoursFormat = [];
    if (hours[0] !== "now") {

        for (let i = 0; i < hours.length; i++)
            hoursFormat[i] = `${alegeriDate[3]}-${alegeriDate[2]}-${alegeriDate[1]}_${hours[i].toString().padStart(2, "0")}-00`;

        //hoursFormat[hoursFormat.length - 1] = "now";
        await new Promise((resolve) =>
            exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/csv/simpv/presence_{${hoursFormat.join(",")}}.csv`, (e) =>
                !e ? resolve() : (console.log(e) && process.exit(1))));

    } else {
        await downloadFile(`https://prezenta.roaep.ro/${alegeriName}//data/csv/simpv/presence_now.csv`, `./data/alegeri/raw/presence_now.csv`);
        console.log(`https://prezenta.roaep.ro/${alegeriName}//data/csv/simpv/presence_now.csv`);
        hoursFormat = ["now"];
    }


    for (let i = 0; i < hours.length; i++) {

        const hour = hours[i];
        console.log(`${alegeriName} Ora ${hour}...`);
        await new Promise(resolve => {
            fs.createReadStream(`./data/alegeri/raw/presence_${hoursFormat[i]}.csv`)
                .pipe(csvParser())
                .on('data', (row) => {

                    let judet = row[Object.keys(row)[0]];
                    let localitate = row['UAT'].clear();

                    if (judet === "SR") {
                        if (row.UAT === "ROMANIA") {
                            judet = localitate = "CORESPONDENTA";
                            prezenta[judet] ??= {};
                        } else if (countryCodes[localitate]) {
                            localitate = countryCodes[localitate];
                        } else return;
                    }

                    prezenta[judet] ??= {};
                    prezenta[judet][localitate] ??= {};
                    prezenta[judet][localitate][hour] ??= {};
                    const hourData = prezenta[judet][localitate][hour];
                    row["TP"] = row["Înscriși pe liste permanente"] || 0;
                    row["TV"] = row["LT"] || 0;


                    ["TP", "TV", "LP", "LS", "UM"].forEach((key) => hourData[key] = (hourData[key] || 0) + (parseInt(row[key]) || 0));

                    if (row.LSC > 0) hourData.LS += parseInt(row.LSC);

                    const ageGroups = ["18-24", "25-34", "35-44", "45-64", "65+"];
                    let ages = [[], []];

                    ageGroups.forEach(ageGroup => ["Barbati", "Femei"].forEach((gender, i) => ages[i].push(parseInt(row[`${gender} ${ageGroup}`]) || 0)));
                    ages = ages.flat();

                    if (i === hours.length - 1) {
                        const ageCounts = ages.map(Number);
                        if (hourData.AG) hourData.AG = hourData.AG.map((count, index) => count + ageCounts[index]);
                        else hourData.AG = ageCounts;
                    }
                })
                .on('end', () => resolve());
        });
    }
    if (hours.length)
        for (const judet of Object.keys(prezenta))
            for (const localitate of Object.keys(prezenta[judet])) {
                prezenta[judet][localitate] = { ...prezenta[judet][localitate], ...prezenta[judet][localitate][hours[hours.length - 1]] };
                delete prezenta[judet][localitate][hours[hours.length - 1]].AG;
            }

    for (const judet of Object.keys(prezenta))
        for (const localitate of Object.keys(prezenta[judet]))
            for (const hour of Object.keys(prezenta[judet][localitate]))
                if (typeof prezenta[judet][localitate][hour] === "object" && prezenta[judet][localitate][hour] !== null)
                    prezenta[judet][localitate][hour] = Object.values(prezenta[judet][localitate][hour]);

    fs.writeFileSync(`./data/alegeri/prezenta_${fileName}.json`, JSON.stringify(prezenta));
    fs.rmSync("./data/alegeri/raw", { recursive: true, force: true });
    console.log("--------");
}
//https://prezenta.roaep.ro/parlamentare01122024/data/json/simpv/presence/presence_ab_2024-12-01_08-00.json
(async () => {
    const start = performance.now();

    // await processPresence(alegeri[args[0]]);
    // await processPresence(alegeri[args[0]], Array.from({ length: (new Date()).getHours() - 7 }, (v, k) => k + 8));
    await processPresence(alegeri[args[0]], Array.from({ length: 14 }, (v, k) => k + 8));
})();

