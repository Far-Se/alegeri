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
    "locale2020": {
        roaep: "locale27092020",
        file: "locale27092020",
    },
    "parlamentare2020": {
        roaep: "parlamentare06122020",
        file: "parlamentare06122020",
    },
    "locale2024": {
        roaep: "locale09062024v2",
        file: "locale09062024v2",
    },
    "europarlamentare2024": {
        roaep: "europarlamentare09062024",
        file: "europarlamentare09062024",
    },
    "prezidentiale1_2024": {
        roaep: "prezidentiale24112024",
        file: "prezidentiale24112024",
    },
    // "parlamentare2024": {
    //     roaep: "parlamentare01122024",
    //     file: "parlamentare01122024",
    // },
}
//const judeteTEMP = ["is","b"];
const judete = ["ab", "ar", "ag", "bc", "bh", "bn", "bt", "br", "bv", "bz", "cl", "cs", "cj", "ct", "cv", "db", "dj", "gl", "gr", "gj", "hr", "hd", "il", "is", "if", "mm", "mh", "b", "ms", "nt", "ot", "ph", "sj", "sm", "sb", "sv", "tr", "tm", "tl", "vl", "vs", "vn", "sr"];
if(args.length == 0) args[0] = Object.keys(alegeri)[Object.keys(alegeri).length - 1];
if (args.length < 1 || !alegeri[args[0]]) return console.log(`Format: node prezenta.js [${Object.keys(alegeri).map(key => `${key}`).join('|')}]`);


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
async function processPresence(turAlegeri, hours) {
    const alegeriName = turAlegeri.roaep;
    const fileName = turAlegeri.file;
    if (hours === undefined) hours = ["now"];
    let prezenta = {};
    console.log(alegeriName, ' - ', hours);
    for (let i = 0; i < hours.length; i++) {
        let hour = hours[i];
        let elDate = "";
        if (hour !== "now") {
            try {
                const reg = alegeriName.match(/([0-9]{2})([0-9]{2})([0-9]{4})/);
                elDate = `${reg[3]}-${reg[2]}-${reg[1]}`;
                elDate = `${elDate}_${hour.toString().padStart(2, '0')}-00`;
            } catch (e) { console.log(e); }
        }else elDate = "now";

        if (!fs.existsSync('./data/alegeri/raw')) fs.mkdirSync('./data/alegeri/raw');
        console.log(`Processing ${elDate}...`);

        if(alegeriName.includes('locale'))judete = judete.filter(judet => judet !== "sr");
        await new Promise((resolve) => {
            exec(`curl --output-dir ./data/alegeri/raw -O "https://prezenta.roaep.ro/${alegeriName}/data/json/simpv/presence/presence_{${judete.join(',')}}_${elDate}.json"`, (error) => {
                if (error) {
                    console.error(`Error: ${error.message}`);
                    return;
                }
                for (const judet1 of judete) {
                    let judet = judet1.clear();
                    if (!prezenta[judet]) prezenta[judet] = {};
                    let json = [];
                    try {
                        json = require(`./data/alegeri/raw/presence_${judet}_${elDate}.json`);
                    } catch (_) {
                        console.log(`No data for ${judet}: ${elDate}`);
                        console.log(`https://prezenta.roaep.ro/${alegeriName}/data/json/simpv/presence/presence_${judet}_${elDate}.json`);
                        continue;
                    }
                    for (const row of json.precinct) {
                        let localitate = row.uat.name.clear();
                        if (judet == "SR") {
                            if (!countryCodes.hasOwnProperty(localitate)) continue;
                            localitate = countryCodes[localitate];
                        }
                        if (!prezenta[judet].hasOwnProperty(localitate)) prezenta[judet][localitate] = {};
                        if (!prezenta[judet][localitate].hasOwnProperty(hour)) prezenta[judet][localitate][hour] = {};

                        Object.assign(prezenta[judet][localitate][hour], {
                            TP: (prezenta[judet][localitate][hour].TP || 0) + row.initial_count_lc + row.initial_count_lp,
                            TV: (prezenta[judet][localitate][hour].TV || 0) + row.LT,
                            LP: (prezenta[judet][localitate][hour].LP || 0) + row.LP,
                            LS: (prezenta[judet][localitate][hour].LS || 0) + row.LS,
                            UM: (prezenta[judet][localitate][hour].UM || 0) + row.UM,
                        });

                        if (prezenta[judet][localitate][hour].hasOwnProperty('AG'))
                            for (let i=0;i<Object.keys(row.age_ranges).length;i++)
                                prezenta[judet][localitate][hour].AG[i] += Object.values(row.age_ranges)[i];
                        else prezenta[judet][localitate][hour].AG = [...Object.values(row.age_ranges) ];
                    }
                }
                // exec(`rm -rf ./data/alegeri/raw`);
                fs.rmSync('./data/alegeri/raw', { recursive: true, force: true });
                console.log("Done ", elDate);
                resolve();
            });
        });
        if(alegeriName.includes('locale'))judete.push("sr");
        await new Promise((resolve) => setTimeout(resolve, 500));
    }
    if (hours.length) {
        for (const judet of Object.keys(prezenta)) {
            for (const localitate of Object.keys(prezenta[judet])) {
                prezenta[judet][localitate] = {...prezenta[judet][localitate], ...prezenta[judet][localitate][hours[hours.length - 1]] };
            }
        }
    }
    fs.writeFileSync(`./data/alegeri/prezenta_${fileName}.json`, JSON.stringify(prezenta));
    console.log("----Done----");
}
https://prezenta.roaep.ro/parlamentare01122024/data/json/simpv/presence/presence_ab_2024-12-01_08-00.json
(async () => {
    // await processPresence(alegeri[args[0]], Array.from({ length: 14 }, (v, k) => k + 8));
    await processPresence(alegeri[args[0]], Array.from({ length: (new Date()).getHours() - 7 }, (v, k) => k + 8));
    // await processPresence(alegeri[args[0]]);
    // for(const alegere of Object.values(alegeri)){
    //     await processPresence(alegere, Array.from({ length: 14 }, (v, k) => k + 8));
    // }
    console.log("----Done----");
})();
let countryCodes = require('./data/map/countries.json');