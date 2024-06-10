/*
Date:
https://prezenta.bec.ro/prezidentiale10112019/data/pv/csv/pv_AB_PRSD_FINAL.csv
https://prezenta.bec.ro/europarlamentare26052019/data/pv/csv/pv_AB_EUP_FINAL.csv
*/
const { exec } = require('child_process');
const { mkdirSync, existsSync, readFileSync, rmSync } = require('fs');
//const judete = ["is"];
const judete = ["ab", "ar", "ag", "bc", "bh", "bn", "bt", "br", "bv", "bz", "cl", "cs", "cj", "ct", "cv", "db", "dj", "gl", "gr", "gj", "hr", "hd", "il", "is", "if", "mm", "mh", "b", "ms", "nt", "ot", "ph", "sj", "sm", "sb", "sv", "tr", "tm", "tl", "vl", "vs", "vn","s1","s2","s3","s4","s5","s6","sr"];

const alegeriName = "europarlamentare2019";

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
const prezidentiale = {
    1: "KLAUS-WERNER IOHANNIS",
    2: "THEODOR PALEOLOGU",
    3: "ILIE-DAN BARNA",
    4: "HUNOR KELEMEN",
    5: "VASILICA-VIORICA DĂNCILĂ",
    6: "CĂTĂLIN-SORIN IVAN",
    7: "NINEL PEIA",
    8: "SEBASTIAN-CONSTANTIN POPESCU",
    9: "JOHN-ION BANU",
    10: "MIRCEA DIACONU",
    11: "BOGDAN-DRAGOS-AURELIU MARIAN-STANOEVICI",
    12: "RAMONA-IOANA BRUYNSEELS",
    13: "VIOREL CATARAMĂ",
    14: "ALEXANDRU CUMPĂNAŞU"
}
const euro =  {
    g1: "PARTIDUL SOCIAL DEMOCRAT",
    g2: "ALIANȚA 2020 USR PLUS",
    g3: "PARTIDUL PRO ROMANIA",
    g4: "UNIUNEA DEMOCRATĂ MAGHIARĂ DIN ROMANIA",
    g5: "PARTIDUL NAȚIONAL LIBERAL",
    g6: "PARTIDUL ALIANȚA LIBERALILOR ȘI DEMOCRAȚILOR - ALDE",
    g7: "PARTIDUL PRODEMO",
    g8: "PARTIDUL MIȘCAREA POPULARĂ",
    g9: "PARTIDUL SOCIALIST ROMAN",
    g10: "PARTIDUL SOCIAL DEMOCRAT INDEPENDENT",
    g11: "PARTIDUL ROMANIA UNITĂ",
    g12: "UNIUNEA NAȚIONALĂ PENTRU PROGRESUL ROMANIEI",
    g13: "BLOCUL UNITĂȚII NAȚIONALE - BUN",
    g14: "GREGORIANA-CARMEN TUDORAN",
    g15: "GEORGE-NICOLAE SIMION",
    g16: "PETER COSTEA"
}
function processResults() {
    if (!existsSync('./data/alegeri/raw')) mkdirSync('./data/alegeri/raw');
    let rezultate = {};
    exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.bec.ro/europarlamentare26052019/data/pv/csv/pv_{${judete.join(',').toUpperCase()}}_EUP_FINAL.csv"`, (error) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        console.log("Processing...");
        for (const judet1 of judete) {
            let judet = judet1.clear();
            rezultate[judet] = {};
            let json = [];
            try{
            json = readFileSync(`./data/alegeri/raw/pv_${judet.toUpperCase()}_EUP_FINAL.csv`, 'utf8').split('\n')
            }catch(_)
            {
                console.log(`No data for ${judet}`);
                continue;
            }

            let headers = json[0].split(',').map(x => x.trim());
            values = json.slice(1).map(line => line.split(',').map(x => x.trim()));

            let table = [];
            for (const row of values) {
                let obj = {};
                for (let i = 0; i < headers.length; i++) {
                    obj[headers[i]] = row[i];
                }
                table.push(obj);
            }

            if (judet.match(/S\d/)) {
                if (!rezultate.hasOwnProperty('B')) rezultate["B"] = {};
                judet = 'B';
            }

            for (const row of table) {
                let localitate = "";
                try {
                    if(judet == 'B')
                    localitate = row.Localitate.replace(/"/g, '').clear();
                    else
                    localitate = row.Uat.replace(/"/g, '').clear();
                } catch (_) {
                    continue;
                }
                if (judet == "SR") {
                    if (!countryCodes.hasOwnProperty(localitate)) continue;
                    localitate = countryCodes[localitate];
                }
                if (!rezultate[judet].hasOwnProperty(localitate)) {
                    rezultate[judet][localitate] = { votes: {} };
                }
                for (const key of Object.keys(row)) {
                    if (key.indexOf('g') == 0) {
                        // const candidat = prezidentiale[Number(key.replace('g', ''))].clear(); // Prezidential
                        const candidat = euro[key].clear();
                        if (candidat) {

                            if (rezultate[judet][localitate].votes.hasOwnProperty(candidat)) {
                                rezultate[judet][localitate].votes[candidat].votes += Number(row[key]);
                            }
                            else
                                rezultate[judet][localitate].votes[candidat] = {
                                    name: candidat,
                                    party: candidat,
                                    votes: Number(row[key])
                                };
                        }

                    }
                }
            }
        }

        require('fs').writeFileSync(`./data/alegeri/rezultate_${alegeriName}.json`, JSON.stringify(rezultate));
        // exec(`rm -rf ./data/alegeri/raw`);
        rmSync(`./data/alegeri/raw`, { recursive: true });

        console.log("Done");


    });
}
processResults();

let countryCodes = require('./data/map/countries.json');