const fs = require("fs");
const { default: axios } = require("axios");
let countryCodes = require("./data/map/countries.json");
const { parse } = require("csv-parse");
const { exec } = require("child_process");

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
async function downloadAllFiles(numeAlegeri, dateAlegeri) {

    return new Promise((resolve, reject) => {
        let algDates = [];
        for (let date of dateAlegeri) {
            const reg = numeAlegeri.match(/([0-9]{2})([0-9]{2})([0-9]{4})/);
            let elDate = `${reg[3]}-${reg[2]}-${reg[1]}`;
            elDate = `${elDate}_${date.toString().padStart(2, "0")}-00`;
            algDates.push(elDate);
        }

        exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${numeAlegeri}/data/csv/simpv/presence_{${algDates.join(",")}}.csv`, (error) => {
            if (error) {
                console.error(`Error: ${error.message}`);
                resolve();
                return;
            }
            resolve();
        });
    })
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
    const fileName = turAlegeri.file;
    if (hours === undefined) hours = ["now"];
    let prezenta = {};
    console.log(alegeriName);
    if (!fs.existsSync("./data/alegeri/raw")) fs.mkdirSync("./data/alegeri/raw");
    await downloadAllFiles(alegeriName, hours);
    for (let i = 0; i < hours.length; i++) {
        const hour = hours[i];
        let elDate = "";
        if (hour !== "now") {
            try {
                const reg = alegeriName.match(/([0-9]{2})([0-9]{2})([0-9]{4})/);
                elDate = `${reg[3]}-${reg[2]}-${reg[1]}`;
                elDate = `${elDate}_${hour.toString().padStart(2, "0")}-00`;
            } catch (e) { console.log(e); }
        } else {

            elDate = "now";
            await downloadFile(`https://prezenta.roaep.ro/parlamentare01122024//data/csv/simpv/presence_${elDate}.csv`, `./data/alegeri/raw/presence_${elDate}.csv`);

        }
        console.log(`Processing ${alegeriName} ${hour}...`);
        await new Promise(resolve => {

            fs.createReadStream(`./data/alegeri/raw/presence_${elDate}.csv`)
                .pipe(parse({
                    columns: true,
                }))
                .on('data', (row) => {
                    let judet = row[Object.keys(row)[0]];
                    let localitate = row.UAT.clear();

                    if (judet === "SR") {
                        if (row.UAT === "ROMANIA") {
                            judet = "CORESPONDENTA";
                            localitate = "CORESPONDENTA";
                            if (!prezenta["CORESPONDENTA"])
                                prezenta["CORESPONDENTA"] = {};
                        } else {
                            if (!Object.prototype.hasOwnProperty.call(countryCodes, localitate)) return;
                            localitate = countryCodes[localitate];
                        }
                    }

                    if (!prezenta[judet]) prezenta[judet] = {};
                    if (!prezenta[judet][localitate]) prezenta[judet][localitate] = {};
                    if (!prezenta[judet][localitate][hour]) prezenta[judet][localitate][hour] = {};

                    Object.assign(prezenta[judet][localitate][hour], {
                        TP: (prezenta[judet][localitate][hour].TP || 0) + parseInt(row["Înscriși pe liste permanente"]),
                        TV: (prezenta[judet][localitate][hour].TV || 0) + parseInt(row.LT),
                        LP: (prezenta[judet][localitate][hour].LP || 0) + parseInt(row.LP),
                        LS: (prezenta[judet][localitate][hour].LS || 0) + parseInt(row.LS),
                        UM: (prezenta[judet][localitate][hour].UM || 0) + parseInt(row.UM),
                    });
                    if (row.LSC > 0) {
                        prezenta[judet][localitate][hour].LS += parseInt(row.LSC);
                    }
                    let ages = [
                        parseInt(row["Barbati 18-24"]),
                        parseInt(row["Barbati 25-34"]),
                        parseInt(row["Barbati 35-44"]),
                        parseInt(row["Barbati 45-64"]),
                        parseInt(row["Barbati 65+"]),
                        parseInt(row["Femei 18-24"]),
                        parseInt(row["Femei 25-34"]),
                        parseInt(row["Femei 35-44"]),
                        parseInt(row["Femei 45-64"]),
                        parseInt(row["Femei 65+"]),
                    ]
                    if (i === hours.length - 1) {
                        if (Object.prototype.hasOwnProperty.call(prezenta[judet][localitate][hour], "AG"))
                            for (let i = 0; i < ages.length; i++)
                                prezenta[judet][localitate][hour].AG[i] += parseInt(ages[i]);
                        else prezenta[judet][localitate][hour].AG = [...ages];
                    }
                })
                .on('end', () => resolve());
        });

    }
    if (hours.length) {
        for (const judet of Object.keys(prezenta)) {
            for (const localitate of Object.keys(prezenta[judet])) {
                prezenta[judet][localitate] = { ...prezenta[judet][localitate], ...prezenta[judet][localitate][hours[hours.length - 1]] };
                delete prezenta[judet][localitate][hours[hours.length - 1]].AG;
            }
        }
    }
    for (const judet of Object.keys(prezenta)) {
        for (const localitate of Object.keys(prezenta[judet])) {
            for (const hour of Object.keys(prezenta[judet][localitate]))
                if (typeof prezenta[judet][localitate][hour] === "object" && prezenta[judet][localitate][hour] !== null)
                    prezenta[judet][localitate][hour] = Object.values(prezenta[judet][localitate][hour]);
        }
    }
    fs.writeFileSync(`./data/alegeri/prezenta_${fileName}.json`, JSON.stringify(prezenta));
    console.log("----Done----");
}
//https://prezenta.roaep.ro/parlamentare01122024/data/json/simpv/presence/presence_ab_2024-12-01_08-00.json
(async () => {
    await processPresence(alegeri[args[0]], Array.from({ length: 14 }, (v, k) => k + 8));
    // await processPresence(alegeri[args[0]], [21]);
    // await processPresence(alegeri[args[0]], Array.from({ length: (new Date()).getHours() - 7 }, (v, k) => k + 8));
    // await processPresence(alegeri[args[0]]);
    // for(const alegere of Object.values(alegeri)){
    //     await processPresence(alegere, Array.from({ length: 14 }, (v, k) => k + 8));
    // }
    console.log("----Done----");
})();

