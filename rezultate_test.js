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

    let candidati = {};
    let voturi = 0;
    for (const row of data) {
        const keys = Object.keys(row);
        for (const key of keys) {
            if(key == 'b') voturi += parseInt(row[key]);
            if (!key.includes('voturi')) continue;
            if (!candidati[key]) candidati[key] = 0;
            candidati[key] += parseInt(row[key]);
        }
    }

    await downloadFile("https://prezenta.roaep.ro/prezidentiale24112024/data/csv/sicpv/pv_part_cntry_prsd_c.csv", "./data/alegeri/raw/pv_part_cntry_prsd_c.csv");
    csv = readFileSync(`./data/alegeri/raw/pv_part_cntry_prsd_c.csv`);
    data = await new Promise((resolve) => parse(csv, { columns: true }, (_, data) => resolve(data)));
    
    for (const row of data) {
        const keys = Object.keys(row);
        for (const key of keys) {
            if (!key.includes('voturi')) continue;
            if (!candidati[key]) candidati[key] = 0;
            candidati[key] += parseInt(row[key]);
        }
    }
    candidati = Object.entries(candidati).sort((a,b)=>b[1] - a[1]);
    candidati.splice(4);
    candidati = candidati.map(([key, value]) => console.log(key,value));
    console.log(`Done`);

}
processResults();
