

let map = L.map('map', {
    zoomSnap: 0,
    zomDelta: 5,
    wheelPxPerZoomLevel: 140,
}).setView([45.9628666, 25.2081763], 7.4);
let mapTile = L.tileLayer(mapTiles[0].url, {
    maxZoom: 18,
    attribution: '&copy;',
    id: 'cartoDB/light-v9',
    tileSize: 512,
    zoomOffset: -1
});
mapTile.addTo(map);

window.Commune = null;
window.conturJudete = null;
let getCommunes = async () => {
    if (!window.Commune) {
        window.Commune = await (await fetch('data/map/comune.geojson')).json();
        window.conturJudete = await (await fetch('data/map/ro_judete_polilinie.json')).json();
        window.countyPopulation = await (await fetch('data/map/county_population.json')).json();
        return window.Commune;
    } else return window.Commune;
}

function sortByValues(obj, key, subkey = '') {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => subkey != '' && a[key] == b[key] ? b[subkey] - a[subkey] : b[key] - a[key]);
    return candidatesArray;
}
String.prototype.clear = function () {
    return this.replace(/î/g, 'a')
        .replace(/Î/g, 'I')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/(MUNICIPIUL|ORAS) ?/ig, '')
        .replace(/\. /ig, '.')
        .replace(/ - /ig, '-')
        ;
}
let geoJSON = null;
let conturGeoJSON = null;

let memFetch = async (alegeri) => {

    if (!window.hasOwnProperty('rezultateAlegeri')) window.rezultateAlegeri = {};
    if (window.rezultateAlegeri[alegeri] !== undefined) return window.rezultateAlegeri[alegeri];

    let response = await fetch(`data/alegeri/rezultate_${alegeri}.json`);
    let data = await response.json();

    window.rezultateAlegeri[alegeri] = data;
    return data;
}
window.statsVotes = [];
window.statsVotes.uat = [];
async function loadResults(alegeri) {
    window.results = {};
    window.statsVotes.judete = {};
    window.statsVotes.uat = [];
    document.querySelector('#loading').style.display = "flex";
    document.querySelector('#rezultate').style.display = "flex";
    const emptyData = {
        castigator: { party: "N/A", votes: 0, name: "N/A" },
        totalVoturi: 0,
        votes: [{ party: "N/A", votes: 0, name: "N/A" }],
    };
    let comparaPrimari2020 = false;
    if (alegeri == "primariNoi") {
        alegeri = "locale09062024P";
        comparaPrimari2020 = true;
    }
    let data = [];
    try {
        data = await memFetch(alegeri);
        await getCommunes();
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('#loading').style.display = "none";
        document.querySelector('#table').innerHTML = 'Inca nu exista date!';
        return;
    }


    if (geoJSON) geoJSON.removeFrom(map);
    if (conturGeoJSON) conturGeoJSON.removeFrom(map);
    let compData = [];
    if (comparaPrimari2020) compData = await memFetch("locale27092020P");
    function processCounty(feature) {
        let county = feature.properties.county.clear();
        let name = feature.properties.name.clear();
        let countyCode = window.countiesCodes[county];

        let fillColor = "#333333";
        let weight = 0.3;
        let fillOpacity = document.querySelector('#slider').value / 100;
        //console.log(fillOpacity);
        if (county == "SR") {
            countyCode = county;
            if (alegeri.includes("locale")) {
                fillOpacity = 0;
                weight = 0.0;
            }
            if (name == "ROU") {
                fillOpacity = 0;
                weight = 0.0;
            }
        }
        if (!window.statsVotes.judete.hasOwnProperty(county)) window.statsVotes.judete[county] = {};
        if (data.hasOwnProperty(countyCode) && data[countyCode].hasOwnProperty(name)) processCountyInfo();
        else feature.properties.data = { ...emptyData };

        if (window.partideAlese.length != 0) processSelectedCounties();
        if (comparaPrimari2020) comparaPrimari();

        if (fillColor == "#333333" && county == "SR") {
            fillOpacity = 0;
            weight = 0;
        }

        return {
            fillColor: fillColor,
            weight: weight,
            color: "#000000",
            fillOpacity: fillOpacity
        }

        function processCountyInfo() {
            let votes = sortByValues(data[countyCode][name].votes, 'votes');
            let index = 0;
            if (votes.length > 1 && document.querySelector('#toggleLocul2').checked == true) index = 1;
            fillColor = getPartyColor(votes[index].party);
            if (!window.results.hasOwnProperty(votes[index].party)) window.results[votes[index].party] = { name: votes[index].party, UAT: 0, votes: 0 };
            window.results[votes[index].party].UAT++;
            feature.properties.data = {
                totalVoturi: votes.reduce((a, b) => a + b.votes, 0),
            };
            window.statsVotes.uat.push({ name: name, county: county, votes: feature.properties.data.totalVoturi, candidates: votes.length , population: window.countyPopulation?.[countyCode]?.[name] ?? 0});
            feature.properties.data.votes = votes.map(v => {
                v.percentage = (v.votes / feature.properties.data.totalVoturi * 100).toFixed(2);
                v.procent = v.votes / feature.properties.data.totalVoturi;
                return v;
            });
            if(window.countyPopulation?.[countyCode]?.hasOwnProperty(name))feature.properties.data.population = window.countyPopulation[countyCode][name];
             
            for (const vote of votes) {
                if (!window.statsVotes.judete[county].hasOwnProperty(vote.party)) window.statsVotes.judete[county][vote.party] = { name: vote.party, votes: 0, totalVotes: 0, UAT: 0 };
                window.statsVotes.judete[county][vote.party].votes += vote.votes;

                if (!window.results.hasOwnProperty(vote.party)) window.results[vote.party] = { name: vote.party, UAT: 0, votes: 0 };
                window.results[vote.party].votes += vote.votes;
            }
            if (feature.properties.data.votes.length == 0) feature.properties.data.votes = [{ party: "N/A", votes: 0, name: "N/A" }];
            else {
                window.statsVotes.judete[county][votes[index].party].UAT++;
            }
        }

        function comparaPrimari() {
            if (data.hasOwnProperty(countyCode) && compData.hasOwnProperty(countyCode)) {
                if (data[countyCode].hasOwnProperty(name) && compData[countyCode].hasOwnProperty(name)) {
                    if (Object.keys(compData[countyCode][name].votes).length > 0 && Object.keys(data[countyCode][name].votes).length > 0) {
                        let votes = sortByValues(data[countyCode][name].votes, 'votes');
                        let compVotes = sortByValues(compData[countyCode][name].votes, 'votes');
                        if (votes[0].name.clear() == compVotes[0].name.clear()) {
                            fillOpacity = 0.1;
                        } else {
                            feature.properties.data.fostPrimar = `${compVotes[0].name} <br><i>${compVotes[0].party}</i>`;
                        }
                    }
                }
            }
        }

        function processSelectedCounties() {
            if (window.partideAlese.length == 1) {
                let index = 0;
                if (feature.properties.data.votes.length > 1 && document.querySelector('#toggleLocul2').checked == true) index = 1;
                if (window.partideAlese.includes(feature.properties.data.votes[index].party)) {
                    fillOpacity = 1;
                } else fillOpacity = 0.0;
                if (document.querySelector('#prezentaProcent').checked == true) {
                    fillColor = getPartyColor(window.partideAlese[0]);
                    let partid = feature.properties.data.votes.find(v => v.party == window.partideAlese[0]);
                    let procent = 0;
                    if (partid != null) procent = partid.procent;
                    fillOpacity = procent;

                }
            } else if (window.partideAlese.length == 2) {
                if (feature.properties.data.votes.length >= 2) {
                    fillOpacity = 0.00;
                    for (const p of feature.properties.data.votes) {
                        if (p.party == window.partideAlese[0] || p.party == window.partideAlese[1]) {
                            fillColor = getPartyColor(p.party);
                            found = 1;
                            fillOpacity = 1.00;
                            break;
                        }
                    }
                }
                else fillOpacity = 0.0;

            }
        }
    }

    geoJSON = await L.geoJSON(window.Commune, {
        style: processCounty,
        onEachFeature: onEachFeatureResults,
    });
    geoJSON.addTo(map);

    const geoJSONLayer = L.geoJSON(window.conturJudete, {
        style: () => {
            return {
                fillColor: "#ff0000",
                fillOpacity: 1,
                weight: 2,
                color: "#474646"
            }
        }
    });
    geoJSONLayer.addTo(map);
    document.querySelector('#loading').style.display = "none";
    setTable();


}
function onEachFeatureResults(feature, layer) {
    if (layer.options?.fillOpacity == 0) return;
    let popupContent = '';
    try {
        popupContent = `
<h1>${feature.properties.county == "SR" ? `Diaspora: ${window.countries[feature.properties.name]}` : `${feature.properties.county}: ${feature.properties.name}`}</h1>
<h3>Castigator: ${feature.properties.data?.votes[0].name ?? 'N/A'}</h3>
<h3>Partid: ${feature.properties.data?.votes[0].party ?? 'N/A'}</h3>
<h3>Populatie: ${feature.properties.data?.population?.toLocaleString() ?? 'N/A'}</h3>
<h3>Total voturi: ${feature.properties.data?.totalVoturi.toLocaleString() ?? 'N/A'} - ${(((feature.properties.data?.totalVoturi ?? 1) / (feature.properties.data?.population ?? 1)) * 100).toLocaleString()}%</h3>
${feature.properties.data.hasOwnProperty('fostPrimar') ? `<h3>Fost primar: ${feature.properties.data.fostPrimar}</h3>` : ''}
<div class="votes">`;
    } catch (e) {
        console.log(feature.properties, e);
    }
    for (let votes of feature.properties.data.votes) {
        let fillColor = getPartyColor(votes.party);
        popupContent += `
        <p >
        <span class="bar" style=""><b style="width:${votes.percentage}%"></b></span>
        <span class="color" style="background-color:${fillColor}"></span>
        ${votes.party == votes.name ?
                `<span class="nume">${votes.party}<br>${votes.votes?.toLocaleString()} Voturi - ${votes.percentage}% (${(votes.votes/ (feature.properties.data?.population ?? 1) * 100).toLocaleString()}%)</span>` :
                `<span class="nume">${votes.party}<br>${votes.name}: ${votes.votes?.toLocaleString()} - ${votes.percentage}% (${(votes.votes/ (feature.properties.data?.population ?? 1) * 100).toLocaleString()}%)</span>`}
        
        </p>`
    }
    // popupContent += JSON.stringify(feature.properties.data);
    popupContent += '</div>';
    var popup = L.popup({
        maxWidth: 700,
        maxHeight: 800
    })
        .setContent(popupContent);
    layer.bindPopup(popup);
}
String.prototype.clip = function (n) { return this.length < n ? this : this.substring(0, n - 3) + '...' };
function setTable(county = "") {

    document.querySelector('#elInfo').innerHTML = "<div id='table'></div>";
    document.querySelector('#sliderTransparenta').style.display = window.partideAlese.length ? "none" : "flex";
    let table = document.querySelector('#table');
    table.innerHTML = `    `;

    let count = 0;

    let results = [];
    if (county == "") results = sortByValues(window.results, 'UAT', 'votes');
    else results = sortByValues(window.statsVotes.judete[county], 'UAT', 'votes');
    //sum all votes
    let sum = results.reduce((a, b) => a + b.votes, 0);
    let totalUATs = results.reduce((a, b) => a + b.UAT, 0);
    for (let party of results) {
        count++;
        if (count > 50) break;

        table.innerHTML += `<div>
        <p class="color" style="background-color:${getPartyColor(party.name)}">
        <input class="iparty" onclick="selectParty('${party.name}')" type="checkbox" value="${party.name}"
        ${window.partideAlese.includes(party.name) ? "checked" : ""}
        ${!window.partideAlese.includes(party.name) && window.partideAlese.length >= 2 ? "disabled" : ""}
         ></p>
        <p>
        <span><abbr title="${party.name}">${party.name.clip(27)}</abbr></span>
        <span>${party.UAT.toLocaleString()} UAT ${county != "" ? `(${(party.UAT / totalUATs * 100).toFixed(2)}%)` : ''} - ${party.votes.toLocaleString()} voturi (${(party.votes / sum * 100).toFixed(2)}%)</span>
        </p>
        </div>`;
    }
    document.querySelector('#elInfo').insertAdjacentHTML('beforeend', `<div class="custom-select"><select id="countiesSelect" onchange="setTable(this.value)"><option value="">Alege Judet</option></select></div>`);
    let aJudete = [];
    for (let iCounty in window.statsVotes.judete) {
        let totalUATs = 0;
        let totalVotes = 0;
        for (let party in window.statsVotes.judete[iCounty]) {
            totalUATs += window.statsVotes.judete[iCounty][party].UAT;
            totalVotes += window.statsVotes.judete[iCounty][party].votes;
        }
        aJudete.push({ name: iCounty, UAT: totalUATs, votes: totalVotes });
    }
    aJudete.sort((a, b) => b.votes - a.votes);
    for (let party of aJudete) {
        document.querySelector('#countiesSelect').innerHTML += `<option value="${party.name}" ${party.name == county ? "selected" : ""}>${party.name == "SR" ? "Strainatate" : party.name}: ${party.votes.toLocaleString()} (${party.UAT.toLocaleString()})</option>`
    }
}
