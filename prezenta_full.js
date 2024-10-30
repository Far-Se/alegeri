/*
Date:
https://prezenta.roaep.ro/{ALEGERI}/data/json/simpv/presence/presence_{CITY_CODE}_now.json
ALEGERI  = locale27092020, parlamentare06122020, locale09062024, europarlamentare09062024
CITY_CODE = ab,ar,ag,bc,bh,bn,bt,br,bv,bz,cl,cs,cj,ct,cv,db,dj,gl,gr,gj,hr,hd,il,is,if,mm,mh,b,ms,nt,ot,ph,sj,sm,sb,sv,tr,tm,tl,vl,vs,vn

CURL Format:
curl -O 'https://prezenta.roaep.ro/{ALEGERI}/data/json/simpv/presence/presence_{ab,ar,ag,bc,bh,bn,bt,br,bv,bz,cl,cs,cj,ct,cv,db,dj,gl,gr,gj,hr,hd,il,is,if,mm,mh,b,ms,nt,ot,ph,sj,sm,sb,sv,tr,tm,tl,vl,vs,vn}_now.json'
*/
//https://prezenta.roaep.ro/locale09062024/data/json/simpv/presence/presence_{ab,ar,ag,bc,bh,bn,bt,br,bv,bz,cl,cs,cj,ct,cv,db,dj,gl,gr,gj,hr,hd,il,is,if,mm,mh,b,ms,nt,ot,ph,sj,sm,sb,sv,tr,tm,tl,vl,vs,vn}_now.json
const { exec } = require('child_process');
const fs = require('fs');


const args = process.argv.slice(2);
const alegeri = {
    "locale2020": "locale27092020",
    "parlamentare2020": "parlamentare06122020",
    "locale2024": "locale09062024",
    "europarlamentare2024": "europarlamentare09062024"
}
//const judeteTEMP = ["is","b"];
const judete = ["ab", "ar", "ag", "bc", "bh", "bn", "bt", "br", "bv", "bz", "cl", "cs", "cj", "ct", "cv", "db", "dj", "gl", "gr", "gj", "hr", "hd", "il", "is", "if", "mm", "mh", "b", "ms", "nt", "ot", "ph", "sj", "sm", "sb", "sv", "tr", "tm", "tl", "vl", "vs", "vn"];
//args[0] = "locale2024";
if (args.length < 1 || !alegeri[args[0]]) return console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join('|')}]`);
function incrementOrSet(obj, key, value) {
    if (obj.hasOwnProperty(key)) {
        obj[key] += value;
    } else {
        obj[key] = value;
    }
}


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
function processPresence(alegeriName, date, hour) {
    if (date == undefined) date = "now";
    //create dir raw if doesnt exist
    if (!fs.existsSync('./data/alegeri/raw')) fs.mkdirSync('./data/alegeri/raw');
    let prezenta = {};
    exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/json/simpv/presence/presence_{${judete.join(',')}}_${date}.json"`, (error) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        console.log("Processing...");
        for (const judet1 of judete) {
            let judet = judet1.clear();
            prezenta[judet] = {};
            let json = [];
            try {
                json = require(`./data/alegeri/raw/presence_${judet}_${date}.json`);
            } catch (_) {
                continue;
            }
            for (const row of json.precinct) {
                let localitate = row.uat.name.clear();
                if (!prezenta[judet].hasOwnProperty(localitate)) {
                    prezenta[judet][localitate] = {};
                }
                incrementOrSet(prezenta[judet][localitate], 'TP', row.initial_count_lc + row.initial_count_lp); //total_votanti
                incrementOrSet(prezenta[judet][localitate], 'TV', row.LT); //total_voturi
                incrementOrSet(prezenta[judet][localitate], 'LP', row.LP); //lista_permanenta
                incrementOrSet(prezenta[judet][localitate], 'LC', row.LC); //lista_C
                incrementOrSet(prezenta[judet][localitate], 'LS', row.LS); //lista_suplimentara
                incrementOrSet(prezenta[judet][localitate], 'UM', row.UM); //urna_mobila
            }
        } 
        if (date == "now")
            fs.writeFileSync(`./data/alegeri/prezenta_${alegeriName}.json`, JSON.stringify(prezenta));
        else
            fs.writeFileSync(`./data/alegeri/prezenta_${alegeriName}_${hour}.json`, JSON.stringify(prezenta));
        exec(`rm -rf ./data/alegeri/raw`);
        // try { fs.rmSync('./data/alegeri/raw', { recursive: true }, (_) => { }); { } } catch (_) { }
        //delete folder raw

        console.log("Done");
    });
}
if (args[1] != undefined) {
    let hour = Number(args[1]);
    if (hour < 8 || hour > 22) return console.log("Month must be between 7 and 22");
    let xDate = alegeri[args[0]].match(/(\d{2})(\d{2})(\d{4})/);
    let date = `${xDate[3]}-${xDate[2]}-${xDate[1]}_`;
    const array = Array.from({ length: 15 }, (_, i) => (i + 8).toString().padStart(2, "0"));

    date += `{${array.join(',')}}-00`;
    processPresence(alegeri[args[0]], date, hour);
}
else
    processPresence(alegeri[args[0]]);