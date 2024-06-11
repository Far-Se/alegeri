/*
Date:
https://prezenta.roaep.ro/{ALEGERI}/data/json/sicpv/pv/pv_{JUDET}_{prov|part|final}.json
*/
const { exec } = require('child_process');
const { debug } = require('console');
const { mkdir, mkdirSync, fstat, existsSync, readFileSync } = require('fs');

const args = process.argv.slice(2);
const alegeri = {
    "primari2020": "P-locale27092020",
    "2024": "2024-locale09062024",
    "primari2024": "P-locale09062024",
    "CJ2024": "CJ-locale09062024",
    "CL2024": "CL-locale09062024",
    "PCJ2024": "PCJ-locale09062024",

}
//const judete = ["is"];
const judete = ["ab", "ar", "ag", "bc", "bh", "bn", "bt", "br", "bv", "bz", "cl", "cs", "cj", "ct", "cv", "db", "dj", "gl", "gr", "gj", "hr", "hd", "il", "is", "if", "mm", "mh", "b", "ms", "nt", "ot", "ph", "sj", "sm", "sb", "sv", "tr", "tm", "tl", "vl", "vs", "vn"];
args[1] = "prov";
if (args.length < 1 || !alegeri[args[0]]) return console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join('|')}] [prov|part|final]`);

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
function sortByValues(obj, key) {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => b[key] - a[key]);
    return candidatesArray;
}
let processFiles = (alegeriName, tipAlegeri, resultsKind) => {
    let rezultate = {};

    console.log(`Processing ${alegeriName} - ${tipAlegeri}...`);
    for (const judet1 of judete) {
        let judet = judet1.clear();
        rezultate[judet] = {};
        let json = [];
        try {
            json = require(`./data/alegeri/raw/pv_${judet}_${resultsKind}.json`.toLowerCase());
            // json = JSON.parse(readFileSync(`./data/alegeri/raw/pv_${judet}_${resultsKind}.json`, 'utf8'));
        } catch (e) {
            console.log(`No data for ${judet} ${resultsKind}`);
            console.log(e);
            continue;
        }
        let table = [];
        table = Object.values(json.stages[args[1].toUpperCase()].scopes.PRCNCT.categories[tipAlegeri].table);
        for (const row of table) {
            let localitate = row.uat_name.clear();
            if (judet == "SR") {
                if (!countryCodes.hasOwnProperty(localitate)) continue;
                localitate = countryCodes[localitate];
            }
            let votes = [...row.votes];

            if (!rezultate[judet].hasOwnProperty(localitate)) {
                rezultate[judet][localitate] = { votes: {} };
            }
            for (const partid of votes) {
                if (rezultate[judet][localitate].votes.hasOwnProperty(partid.candidate)) {
                    rezultate[judet][localitate].votes[partid.candidate].votes += Number(partid.votes);
                }
                else {
                    let pparty = partid.party ?? "INDEPENDENT";
                    if(pparty.clear().match(/(UNIUNEA SALVATI ROMANIA|\bUSR\b|\bPMP\b|FOR.A DREPTEI)/)) pparty = "USR - ALIANȚA DREAPTA UNITĂ";
                    if(partid.candidate.clear().match(/(UNIUNEA SALVATI ROMANIA|\bUSR\b)/)) partid.candidate = "USR - ALIANȚA DREAPTA UNITĂ";
                    if (tipAlegeri != "P" && !partid.party) pparty = partid.candidate;
                    rezultate[judet][localitate].votes[partid.candidate] = {
                        name: partid.candidate,
                        party: pparty,
                        votes: Number(partid.votes)
                    };
                }
            }
        }
    }
    require('fs').writeFileSync(`./data/alegeri/rezultate_${alegeriName}${tipAlegeri}.json`, JSON.stringify(rezultate));
    console.log("Done");
}
function processResults(numeAlegeri, resultsKind) {
    if (!existsSync('./data/alegeri/raw')) mkdirSync('./data/alegeri/raw');

    let [tipAlegere, alegeriName] = numeAlegeri.split('-');
    console.log(`Fetching ${alegeriName} - ${tipAlegere}`);
    exec("curl --help", (error, stdout, stderr) => {
        console.log(error, "\n", stdout,"\n", stderr);
    })
    exec(`curl --output-dir ${__dirname}/data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/json/sicpv/pv/pv_{${judete.join(',')}}_${resultsKind}.json"`, (error) => {
        if (error) return console.error(`Error: ${error.message}`);

        if (tipAlegere.match(/^[0-9]+$/)) {
            for (const atipAlegere of Object.values(alegeri)) {
                if (atipAlegere.includes(alegeriName)) {
                    let [xtipAlegere, xalegeriName] = atipAlegere.split('-');
                    if (tipAlegere == xtipAlegere) continue;
                    processFiles(xalegeriName, xtipAlegere, resultsKind);
                }
            }
            exec(`rm -rf ./data/alegeri/raw`);
            return;
        }
        processFiles(alegeriName, tipAlegere, resultsKind);
        exec(`rm -rf ./data/alegeri/raw`);
    });
}
processResults(alegeri[args[0]], args[1]);
let countryCodes = require('./data/map/countries.json');