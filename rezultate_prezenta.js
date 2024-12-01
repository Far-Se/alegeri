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
    "prezidentiale2024": "prezidentiale24112024",
    "parlamentare2024": "parlamentare01122024",
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
async function processPresence(alegeriName, hour) {
    let elDate = "";
    try {
        const reg = alegeriName.match(/([0-9]{2})([0-9]{2})([0-9]{4})/);
        elDate = `${reg[3]}-${reg[2]}-${reg[1]}`;

    } catch (e) { }
    if (hour) {
        elDate = `${elDate}_${hour.toString().padStart(2, '0')}-00`;
    } else
        elDate = "now";
    //create dir raw if doesnt exist
    if (!fs.existsSync('./data/alegeri/raw')) fs.mkdirSync('./data/alegeri/raw');
    let prezenta = {};
    return new Promise((resolve) => {
        exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/json/simpv/presence/presence_{${judete.join(',')}}_${elDate}.json"`, (error) => {
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
                    json = require(`./data/alegeri/raw/presence_${judet}_${elDate}.json`);
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
                    incrementOrSet(prezenta[judet][localitate], 'LC', row.LSC); //lista_C
                    incrementOrSet(prezenta[judet][localitate], 'LS', row.LS); //lista_suplimentara
                    incrementOrSet(prezenta[judet][localitate], 'UM', row.UM); //urna_mobila
                    if (prezenta[judet][localitate].hasOwnProperty('AG'))
                        for (const age of Object.keys(row.age_ranges))
                            prezenta[judet][localitate].AG[age] += row.age_ranges[age];
                    else prezenta[judet][localitate].AG = { ...row.age_ranges };


                }
            }
            prezenta["INFO"] = { hour: hour };
            if (alegeriName === 'prezidentiale24112024') alegeriName = 'prezidentiale1_24112024';

            if (fs.existsSync(`./data/alegeri/prezenta_${alegeriName}.json`)) {
                let data = require(`./data/alegeri/prezenta_${alegeriName}.json`);
                if (data["INFO"]) {
                    let exHour = data["INFO"].hour;
                    if (exHour != hour)
                        for (const judet of Object.keys(data)) {
                            for (const localitate of Object.keys(data[judet])) {
                                if (!prezenta[judet]) prezenta[judet] = {};
                                if (!prezenta[judet][localitate]) prezenta[judet][localitate] = {};
                                for (let i = 8; i < 21; i++) {
                                    if (data[judet][localitate].hasOwnProperty(i))
                                    {
                                        if(data[judet][localitate][i].AG) delete data[judet][localitate][i].AG;
                                        prezenta[judet][localitate][i] = { ...data[judet][localitate][i] };
                                    }
                                }
                                prezenta[judet][localitate][exHour] = { ...data[judet][localitate] };
                            }
                        }
                }
            }
            fs.writeFileSync(`./data/alegeri/prezenta_${alegeriName}.json`, JSON.stringify(prezenta));
            exec(`rm -rf ./data/alegeri/raw`);
            // fs.rmdir('./data/alegeri/raw', { recursive: true });
            //delete folder raw

            console.log("Done");
            resolve();
        });
    });
}
https://prezenta.roaep.ro/parlamentare01122024/data/json/simpv/presence/presence_ab_2024-12-01_08-00.json
(async () => {
    await processPresence(alegeri[args[0]], 8);
    // await processPresence(alegeri[args[0]], 9);
})();