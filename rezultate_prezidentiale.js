const { mkdirSync, existsSync, readFileSync, writeFileSync, createWriteStream } = require("fs");
let countryCodes = require("./data/map/countries.json");
const { parse } = require("csv-parse");
const { default: axios } = require("axios");

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
const countiesCodes = [...Object.keys(require("./data/map/county_population.json")),"s1", "s2", "s3", "s4", "s5", "s6", "sr"].map(e=>e.toUpperCase());
async function downloadFile(url, file) {

    const writer = createWriteStream(file);
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
async function processResults() {
    if (!existsSync("./data/alegeri/raw")) mkdirSync("./data/alegeri/raw");
    let rezultate = {};

    await downloadFile("https://prezenta.roaep.ro/prezidentiale24112024/data/csv/sicpv/pv_part_cntry_prsd.csv", "./data/alegeri/raw/pv_part_cntry_prsd.csv");

    console.log("Processing...");
    let csv = readFileSync("./data/alegeri/raw/pv_part_cntry_prsd.csv");
    let data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    for (const row of data) {
        let judet = row.precinct_county_name.clear();
        if (judet.includes("BUCURESTI")) judet = "B";
        else judet = countiesCodes[judet];
        let localitate = row.uat_name.clear();

        if (judet === "SR") {
            if (!countryCodes[localitate]) {
                console.log(localitate);
                continue;
            }
            localitate = countryCodes[localitate];
        }
        if (!rezultate[judet]) rezultate[judet] = {};
        if (!rezultate[judet][localitate]) rezultate[judet][localitate] = { votes: {} };
        const keys = Object.keys(row);
        for (const key of keys) {
            if (!key.includes("-voturi")) continue;
            let candidat = key.replace("-voturi", "");
            if (!rezultate[judet][localitate].votes[candidat]) rezultate[judet][localitate].votes[candidat] = { name: "", party: "", votes: 0 };
            rezultate[judet][localitate].votes[candidat].votes += parseInt(row[key]); 
        }
    }
    await downloadFile("https://prezenta.roaep.ro/prezidentiale24112024/data/csv/sicpv/pv_part_cntry_prsd_c.csv", "./data/alegeri/raw/pv_part_cntry_prsd_c.csv");

    csv = readFileSync("./data/alegeri/raw/pv_part_cntry_prsd_c.csv");
    data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    rezultate["CORESPONDENTA"] = { "CORESPONDENTA": { votes: {} } };
    for (const row of data) {
        const keys = Object.keys(row);
        for (const key of keys) {
            if (!key.includes("voturi")) continue;
            let candidat = key.replace("-voturi", "");
            if (!rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat]) rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat] = { name: "", party: "", votes: 0 };
            rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat].votes += parseInt(row[key]);
        }
    }
    console.log("Done");
    writeFileSync("./data/alegeri/rezultate_prezidentiale1_24112024.json", JSON.stringify(rezultate));

}
processResults();
