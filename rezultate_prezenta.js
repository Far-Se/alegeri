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
    "europarlamentare2024": "europarlamentare09062024",
    "prezidentiale2024": "prezidentiale24112024"
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
function processPresence(alegeriName) {
    //create dir raw if doesnt exist
    if (!fs.existsSync('./data/alegeri/raw')) fs.mkdirSync('./data/alegeri/raw');
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
        if(alegeriName === 'prezidentiale24112024') alegeriName = 'prezidentiale1_24112024';
            
        if(fs.existsSync(`./data/alegeri/prezenta_${alegeriName}.json`)){
            let date = new Date();
            if(alegeriName.includes(`${date.getDate()}${date.getMonth()+1}${date.getFullYear()}`))
            {
                let hour = new Date().getHours() - 1;
                fs.renameSync(`./data/alegeri/prezenta_${alegeriName}.json`, `./data/alegeri/prezenta_${alegeriName}_${hour}.json`);
                let data = require(`./data/alegeri/prezenta_${alegeriName}_${hour}.json`);
                for (const judet of Object.keys(data)) {
                    for (const localitate of Object.keys(data[judet])) {
                        if (!prezenta[judet]) prezenta[judet] = {};
                        if (!prezenta[judet][localitate]) prezenta[judet][localitate] = {};
                        prezenta[judet][localitate][hour] = { ...data[judet][localitate] };
                    }
                }
            }
        }
        fs.writeFileSync(`./data/alegeri/prezenta_${alegeriName}.json`, JSON.stringify(prezenta));
        exec(`rm -rf ./data/alegeri/raw`);
        // fs.rmdir('./data/alegeri/raw', { recursive: true });
        //delete folder raw

        console.log("Done");
    });
}
processPresence(alegeri[args[0]]);