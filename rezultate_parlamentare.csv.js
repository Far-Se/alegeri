const fs = require("fs");
let countryCodes = require("./data/map/countries.json");
const { parse } = require("csv-parse");
const { default: axios } = require("axios");
const misc = require("./rezultate_misc.js");
const alegeriAll = {
    "2020" : "parlamentare06122020",
    "2024" : "parlamentare01122024"
};
const alegeri = alegeriAll["2020"];
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
async function processResults() {
    console.log("c[ăîcor".clear());
    if (!fs.existsSync("./data/alegeri/raw")) fs.mkdirSync("./data/alegeri/raw");
    let rezultate = {};

    await downloadFile(`https://prezenta.roaep.ro/${alegeri}/data/csv/sicpv/pv_part_cntry_s.csv`, "./data/alegeri/raw/alegeri.csv");

    console.log("Processing...");
    let csv = fs.readFileSync("./data/alegeri/raw/alegeri.csv");
    let data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    for (const row of data) {
        let judet = row.precinct_county_name.clear();
        if (judet.includes("BUCURESTI")) judet = "B";
        else judet = misc.countiesCodes[judet];
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
    await downloadFile(`https://prezenta.roaep.ro/${alegeri}/data/csv/sicpv/pv_part_cntry_s_c.csv`, "./data/alegeri/raw/alegeri.csv");

    csv = fs.readFileSync("./data/alegeri/raw/alegeri.csv");
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
    fs.writeFileSync(`./data/alegeri/rezultate_${alegeri}.json`, JSON.stringify(rezultate));
    fs.rmSync("./data/alegeri/raw", { recursive: true, force: true });
}
processResults();
