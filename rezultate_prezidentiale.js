const { exec } = require('child_process');
const { mkdirSync, existsSync, readFileSync, rmSync, writeFileSync, createWriteStream } = require('fs');
let countryCodes = require('./data/map/countries.json');
const { parse } = require('csv-parse');
const csvParser = require('csv-parser');
const { default: axios } = require('axios');

String.prototype.clear = function () {
    return this
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/(MUNICIPIUL|ORAS) ?/ig, '')
        .replace(/\. /ig, '.')
        .replace(/ - /ig, '-')
        ;
}

let countiesName = {
    "AB": "ALBA",
    "AR": "ARAD",
    "AG": "ARGES",
    "BC": "BACAU",
    "BH": "BIHOR",
    "BN": "BISTRITA-NASAUD",
    "BT": "BOTOSANI",
    "BR": "BRAILA",
    "BV": "BRASOV",
    "BZ": "BUZAU",
    "CL": "CALARASI",
    "CS": "CARAS-SEVERIN",
    "CJ": "CLUJ",
    "CT": "CONSTANTA",
    "CV": "COVASNA",
    "DB": "DAMBOVITA",
    "DJ": "DOLJ",
    "GL": "GALATI",
    "GR": "GIURGIU",
    "GJ": "GORJ",
    "HR": "HARGHITA",
    "HD": "HUNEDOARA",
    "IL": "IALOMITA",
    "IS": "IASI",
    "IF": "ILFOV",
    "MM": "MARAMURES",
    "MH": "MEHEDINTI",
    "B": "BUCURESTI",
    "S1": "BUCURESTI SECTORUL 1",
    "S2": "BUCURESTI SECTORUL 2",
    "S3": "BUCURESTI SECTORUL 3",
    "S4": "BUCURESTI SECTORUL 4",
    "S5": "BUCURESTI SECTORUL 5",
    "S6": "BUCURESTI SECTORUL 6",
    "MS": "MURES",
    "NT": "NEAMT",
    "OT": "OLT",
    "PH": "PRAHOVA",
    "SJ": "SALAJ",
    "SM": "SATU MARE",
    "SB": "SIBIU",
    "SR": "STRAINATATE",
    "SV": "SUCEAVA",
    "TR": "TELEORMAN",
    "TM": "TIMIS",
    "TL": "TULCEA",
    "VL": "VALCEA",
    "VS": "VASLUI",
    "VN": "VRANCEA"
};
let countiesCodes = Object.fromEntries(Object.entries(countiesName).map(([key, value]) => [value, key]));
async function downloadFile(url, file) {

    const writer = createWriteStream(file);
    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
    });

    response.data.pipe(writer);
    await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
async function processResults() {
    if (!existsSync('./data/alegeri/raw')) mkdirSync('./data/alegeri/raw');
    let rezultate = {};

    await downloadFile("https://prezenta.roaep.ro/prezidentiale24112024/data/csv/sicpv/pv_part_cntry_prsd.csv", "./data/alegeri/raw/pv_part_cntry_prsd.csv");

    console.log("Processing...");
    let csv = readFileSync(`./data/alegeri/raw/pv_part_cntry_prsd.csv`);
    let data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    for (const row of data) {
        let judet = row.precinct_county_name.clear();
        if (judet.includes('BUCURESTI')) judet = "B";
        else judet = countiesCodes[judet];
        let localitate = row.uat_name.clear();

        if (judet == "SR") {
            if (!countryCodes.hasOwnProperty(localitate)) {
                console.log(localitate);
                continue;
            }
            localitate = countryCodes[localitate];
        }
        if (!rezultate[judet]) rezultate[judet] = {};
        if (!rezultate[judet][localitate]) rezultate[judet][localitate] = { votes: {} };
        const keys = Object.keys(row);
        for (const key of keys) {
            if (!key.includes('-voturi')) continue;
            let candidat = key.replace('-voturi', '');
            if (!rezultate[judet][localitate].votes[candidat]) rezultate[judet][localitate].votes[candidat] = { name: "", party: "", votes: 0 };
            rezultate[judet][localitate].votes[candidat].votes += parseInt(row[key]);
        }
    }
    await downloadFile("https://prezenta.roaep.ro/prezidentiale24112024/data/csv/sicpv/pv_part_cntry_prsd_c.csv", "./data/alegeri/raw/pv_part_cntry_prsd_c.csv");

    csv = readFileSync(`./data/alegeri/raw/pv_part_cntry_prsd_c.csv`);
    data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    rezultate["CORESPONDENTA"] = { "CORESPONDENTA": { votes: {} } };
    for (const row of data) {
        const keys = Object.keys(row);
        for (const key of keys) {
            if (!key.includes('voturi')) continue;
            let candidat = key.replace('-voturi', '');
            if (!rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat]) rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat] = { name: "", party: "", votes: 0 };
            rezultate["CORESPONDENTA"]["CORESPONDENTA"].votes[candidat].votes += parseInt(row[key]);
        }
    }
    if (1 + 1 == 1) {
        let voturiCandidati = {}
        for (const judet of Object.keys(rezultate)) {
            for (const localitate of Object.keys(rezultate[judet])) {
                for (const candidat of Object.keys(rezultate[judet][localitate].votes)) {
                    voturiCandidati[candidat] = (voturiCandidati[candidat] || 0) + rezultate[judet][localitate].votes[candidat].votes
                }

            }
        }
        console.log(voturiCandidati);
    }
    console.log(`Done`);
    writeFileSync(`./data/alegeri/rezultate_prezidentiale1_24112024.json`, JSON.stringify(rezultate));

}
processResults();