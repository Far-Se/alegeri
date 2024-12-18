const { exec } = require("child_process");
const { mkdirSync, existsSync, writeFileSync } = require("fs");
const { default: axios } = require("axios");
let countryCodes = require("./data/map/countries.json");

const args = process.argv.slice(2);
const alegeri = {
    "primari2020": "P-locale27092020",
    "2024": "2024-locale09062024",
    "primari2024": "P-locale09062024",
    "CJ2024": "CJ-locale09062024",
    "CL2024": "CL-locale09062024",
    "PCJ2024": "PCJ-locale09062024",

};
const judete = [...Object.keys(require("./data/map/county_population.json")).map(e=>e.toLowerCase())];
args[1] ??= "part";
if (args.length < 1 || !alegeri[args[0]]){

    console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join("|")}] [prov|part|final]`);
    process.exit(0);
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
        try{
            table = Object.values(json.stages[args[1].toUpperCase()].scopes.PRCNCT.categories[tipAlegeri].table);
        }catch(_e){
            try {
                table = Object.values(json.stages[args[1].toUpperCase()].scopes.UAT.categories[tipAlegeri].table);
            }catch(_){
                console.log(`No data for ${judet} ${resultsKind}`);
                console.log(Object.keys(json.stages[args[1].toUpperCase()].scopes));
                return;
            }
        }
        for (const row of table) {
            let localitate = row.uat_name.clear();
            if (judet === "SR") {
                if (!Object.prototype.hasOwnProperty.call(countryCodes, localitate)) continue;
                localitate = countryCodes[localitate];
            }
            let votes = [...row.votes];

            if (!Object.prototype.hasOwnProperty.call(rezultate[judet], localitate)) {
                rezultate[judet][localitate] = { votes: {} };
            }
            for (const partid of votes) {
                
                let pparty = partid.party ?? "INDEPENDENT";
                if (pparty.clear().match(/(UNIUNEA SALVATI ROMANIA|\bUSR\b|\bPMP\b|FOR.A DREPTEI)/)) pparty = "USR - ALIANȚA DREAPTA UNITĂ";
                if (partid.candidate.clear().match(/(UNIUNEA SALVATI ROMANIA|\bUSR\b)/)) partid.candidate = "USR - ALIANȚA DREAPTA UNITĂ";
                if(row.uat_name.toUpperCase().indexOf("MUNICIPIUL")=== 0) rezultate[judet][localitate].special = "MUN";
                if(row.uat_name.toUpperCase().indexOf("ORA") === 0) rezultate[judet][localitate].special = "ORAS";
                
                if (Object.prototype.hasOwnProperty.call(rezultate[judet][localitate].votes, partid.candidate)) {
                    rezultate[judet][localitate].votes[partid.candidate].votes += Number(partid.votes);
                }
                else {
                    if (tipAlegeri !== "P" && !partid.party) pparty = partid.candidate;
                    rezultate[judet][localitate].votes[partid.candidate] = {
                        name: partid.candidate,
                        party: pparty,
                        votes: Number(partid.votes)
                    };
                }
            }
        }
    }
    require("fs").writeFileSync(`./data/alegeri/rezultate_${alegeriName}${tipAlegeri}.json`, JSON.stringify(rezultate));
    console.log("Done");
};

async function fetchWithRetry(url, retries = 3, delay = 300) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.get(url, { responseType: "text/plain" });
            if (response.status !== 200) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            writeFileSync(`./data/alegeri/raw/${url.split("/").pop()}`,response.data);
            //exit(0);
            return true;
        } catch (error) {
            console.error(`Attempt ${attempt} failed for ${url} : ${error.message}`);
            if (attempt < retries) {
                await new Promise(res => setTimeout(res, delay));
            } else {
                throw new Error(`Failed to fetch ${url} after ${retries} attempts`);
            }
        }
    }
}


async function fetchMultipleUrlsConcurrently(urls, retries = 3, delay = 300) {
    const fetchPromises = urls.map(url => fetchWithRetry(url, retries, delay));

    const results = await Promise.all(fetchPromises);

    return results.map((result, index) => ({
        url: urls[index],
        ...result
    }));
}

async function fetchResults(numeAlegeri, resultsKind) {
    if (!existsSync("./data/alegeri/raw")) mkdirSync("./data/alegeri/raw");

    let [tipAlegere, alegeriName] = numeAlegeri.split("-");
    console.log(`Fetching ${alegeriName} - ${tipAlegere}`);
    let links = [];
    for (const judet of judete) {
        links.push(`https://prezenta.roaep.ro/${alegeriName}/data/json/sicpv/pv/pv_${judet}_${resultsKind}.json`);
    }
    try {
        await fetchMultipleUrlsConcurrently(links);
        processResults(numeAlegeri, resultsKind);
    } catch (error) {
        console.error("Error fetching URLs:", error);
    }
    return;
}
function processResults(numeAlegeri, resultsKind) {

    let [tipAlegere, alegeriName] = numeAlegeri.split("-");
    if (tipAlegere.match(/^[0-9]+$/)) {
        for (const atipAlegere of Object.values(alegeri)) {
            if (atipAlegere.includes(alegeriName)) {
                let [xtipAlegere, xalegeriName] = atipAlegere.split("-");
                if (tipAlegere === xtipAlegere) continue;
                processFiles(xalegeriName, xtipAlegere, resultsKind);
            }
        }
        exec("rm -rf ./data/alegeri/raw");
        return;
    }
    processFiles(alegeriName, tipAlegere, resultsKind);
    exec("rm -rf ./data/alegeri/raw");

}
fetchResults(alegeri[args[0]], args[1]);

