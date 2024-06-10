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
const { existsSync, mkdirSync } = require('fs');

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
if (args.length < 1 || !alegeri[args[0]]) return console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join('')}]`);
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
function processPresence(alegeriName) {
    //create dir raw if doesnt exist
    if (!existsSync('./data/alegeri/raw')) mkdirSync('./data/alegeri/raw');
    let prezenta = {};
    exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/json/simpv/presence/presence_{${judete.join(',')}}_now.json"`, (error) => {
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
                json = require(`./data/alegeri/raw/presence_${judet}_now.json`);
            }catch (_)
            {
                continue;
            }
            for (const row of json.precinct) {
                let localitate = row.uat.name.clear();
                if (!prezenta[judet].hasOwnProperty(localitate)) {
                    prezenta[judet][localitate] = {};
                }
                incrementOrSet(prezenta[judet][localitate], 'total_votanti', row.initial_count_lc + row.initial_count_lp);
                incrementOrSet(prezenta[judet][localitate], 'lista_permanenta', row.LP);
                incrementOrSet(prezenta[judet][localitate], 'lista_C', row.LC);
                incrementOrSet(prezenta[judet][localitate], 'lista_suplimentara', row.LS);
                incrementOrSet(prezenta[judet][localitate], 'urna_mobila', row.UM);
                incrementOrSet(prezenta[judet][localitate], 'total_voturi', row.LT);
            }
        }
        require('fs').writeFileSync(`./data/alegeri/prezenta_${alegeriName}.json`, JSON.stringify(prezenta));
        exec(`rm -rf ./data/alegeri/raw`);
        console.log("Done");
    });
}
processPresence(alegeri[args[0]]);