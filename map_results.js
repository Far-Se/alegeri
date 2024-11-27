

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

window._w.Commune = null;
window._w.conturJudete = null;
let getCommunes = async () => {
    if (!window._w.Commune) {
        window._w.Commune = await (await fetch('data/map/comune.geojson')).json();
        window._w.conturJudete = await (await fetch('data/map/ro_judete_polilinie.json')).json();
        window._w.countyPopulation = await (await fetch('data/map/county_population.json')).json();
        return window._w.Commune;
    } else return window._w.Commune;
}

function sortByValues(obj, key, subkey = '') {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => subkey != '' && a[key] == b[key] ? b[subkey] - a[subkey] : b[key] - a[key]);
    return candidatesArray;
}
let geoJSON = null;
let conturGeoJSON = null;

let memFetch = async (alegeri) => {

    if (!Object.prototype.hasOwnProperty.call(window, 'rezultateAlegeri')) window._w.rezultateAlegeri = {};
    if (window._w.rezultateAlegeri[alegeri] !== undefined) return window._w.rezultateAlegeri[alegeri];

    let response = await fetch(`data/alegeri/rezultate_${alegeri}.json`);
    let data = await response.json();

    window._w.rezultateAlegeri[alegeri] = data;
    return data;
}
window._w.statsVotes = [];
window._w.statsVotes.uat = [];
window._w.processedAreas = [];
async function loadResults(alegeri) {
    window._w.results = {};
    window._w.statsVotes.judete = {};
    window._w.statsVotes.uat = [];
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
        let countyCode = window._w.countiesCodes[county];

        let fillColor = "#333333";
        let weight = 0.3;
        let borderColor = "#000000";
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

        if(county == "CO") 
        {
            if(window._w.alegeriSelected == "Prezidentiale Tur 1 2024")
            {
            countyCode = "CORESPONDENTA";
            }else {
                fillOpacity = 0;
                weight = 0.0;
            }
        }
        if (!window._w.statsVotes.judete.hasOwnProperty(county)) window._w.statsVotes.judete[county] = {};
        if (data.hasOwnProperty(countyCode) && data[countyCode].hasOwnProperty(name)) processCountyInfo();
        else {
            // console.log(county, countyCode, name);
            feature.properties.data = { ...emptyData };
        }
        window._w.processedAreas.push(`${countyCode}-${name}`);

        if (window._w.partideAlese.length != 0) processSelectedCounties();
        if (comparaPrimari2020) comparaPrimari();

        if (fillColor == "#333333" && county == "SR") {
            fillOpacity = 0;
            weight = 0;
        }

        return {
            fillColor: fillColor,
            weight: weight,
            color: borderColor,
            fillOpacity: fillOpacity
        }

        function processCountyInfo() {
            let votes = 0;
            let dataVotes = data[countyCode][name].votes;
            if (dataVotes[Object.keys(dataVotes)[0]].name == "") {

                for (const vote of Object.keys(dataVotes)) {
                    try {
                        dataVotes[vote].party = vote;
                        dataVotes[vote].name = vote;
                    } catch (error) {
                    }
                }
            }
            try {
                votes = sortByValues(dataVotes, 'votes');
            } catch (error) {
                console.log(countyCode, name);
                console.log(data[countyCode], data[countyCode][name]);
                console.log('', error);
            }
            let index = 0;
            if (votes.length > 1 && document.querySelector('#toggleLocul2').checked == true) index = 1;
            fillColor = getPartyColor(votes[index].party);
            if (!window._w.results.hasOwnProperty(votes[index].party)) window._w.results[votes[index].party] = { name: votes[index].party, UAT: 0, votes: 0 };
            window._w.results[votes[index].party].UAT++;
            feature.properties.data = {
                totalVoturi: votes.reduce((a, b) => a + b.votes, 0),
            };
            window._w.statsVotes.uat.push({ name: name, county: county, votes: feature.properties.data.totalVoturi, candidates: votes.length, population: window._w.countyPopulation?.[countyCode]?.[name] ?? feature.properties.data.totalVoturi });
            feature.properties.data.votes = votes.map(v => {
                v.percentage = (v.votes / feature.properties.data.totalVoturi * 100).toFixed(2);
                v.procent = v.votes / feature.properties.data.totalVoturi;
                return v;
            });
            if (data[countyCode][name].special == "MUN") {
                //borderColor = "#dddddd";
                weight = 0.4;
            }
            if (window._w.countyPopulation?.[countyCode]?.hasOwnProperty(name)) feature.properties.data.population = window._w.countyPopulation[countyCode][name];
            else feature.properties.data.population = feature.properties.data.totalVoturi;
            // fillColor = parseInt(window._w.countyPopulation?.[countyCode]?.[name] ?? 0) > 3000 ? "#006400" : "#dddddd";

            for (const vote of votes) {
                if (!window._w.statsVotes.judete[county].hasOwnProperty(vote.party)) window._w.statsVotes.judete[county][vote.party] = { name: vote.party, votes: 0, totalVotes: 0, UAT: 0 };
                window._w.statsVotes.judete[county][vote.party].votes += vote.votes;

                if (!window._w.results.hasOwnProperty(vote.party)) window._w.results[vote.party] = { name: vote.party, UAT: 0, votes: 0 };
                window._w.results[vote.party].votes += vote.votes;
            }
            if (feature.properties.data.votes.length == 0) feature.properties.data.votes = [{ party: "N/A", votes: 0, name: "N/A" }];
            else {
                window._w.statsVotes.judete[county][votes[index].party].UAT++;
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
                            if (votes[0].party == compVotes[0].party) fillOpacity = 0.5;
                            else
                                weight = 0.7;
                            feature.properties.data.fostPrimar = `${compVotes[0].name} <br><i>${compVotes[0].party}</i>`;
                        }
                    }
                }
            }
        }

        function processSelectedCounties() {
            if (window._w.partideAlese.length == 1) {
                let index = 0;
                if (feature.properties.data.votes.length > 1 && document.querySelector('#toggleLocul2').checked == true) index = 1;
                if (window._w.partideAlese.includes(feature.properties.data.votes[index].party)) {
                    fillOpacity = 1;
                } else fillOpacity = 0.0;
                if (document.querySelector('#prezentaProcent').checked == true) {
                    fillColor = getPartyColor(window._w.partideAlese[0]);
                    let partid = feature.properties.data.votes.find(v => v.party == window._w.partideAlese[0]);
                    let procent = 0;
                    if (partid != null) procent = partid.procent;
                    fillOpacity = procent;

                }
            } else if (window._w.partideAlese.length == 2) {
                if (feature.properties.data.votes.length >= 2) {
                    fillOpacity = 0.00;
                    for (const p of feature.properties.data.votes) {
                        if (p.party == window._w.partideAlese[0] || p.party == window._w.partideAlese[1]) {
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

    geoJSON = await L.geoJSON(window._w.Commune, {
        style: processCounty,
        onEachFeature: onEachFeatureResults,
    });
    geoJSON.addTo(map);

    const geoJSONLayer = L.geoJSON(window._w.conturJudete, {
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
let mainPopupActive = false;
function onEachFeatureResults(feature, layer) {
    if (layer.options?.fillOpacity == 0) return;
    let data = feature.properties.data;
    let popupContent = '';
    try {
        let title = '';
        if (feature.properties.county == "SR") title = `Diaspora: ${window._w.countries[feature.properties.name]}`;
        else title = `<a href="uat.html#${feature.properties.county.clear()}++${feature.properties.name.clear()}" target="_blank">${feature.properties.county}: ${feature.properties.name}</a>`
        if(!data.population) data.population = data?.totalVoturi ?? 0;
        popupContent = `
<h1>${title}</h1>
<h3>Castigator: ${data?.votes[0].name ?? 'N/A'}</h3>
<h3>Partid: ${data?.votes[0].party ?? 'N/A'}</h3>
<h3>Populatie: ${data?.population?.toLocaleString() ?? 'N/A'}</h3>
<h3>Total voturi: ${data?.totalVoturi.toLocaleString() ?? 'N/A'} - ${(((data?.totalVoturi ?? 1) / (data?.population ?? 1)) * 100).toLocaleString()}%</h3>
${data.hasOwnProperty('fostPrimar') ? `<h3>Fost primar: ${data.fostPrimar}</h3>` : ''}
<div class="votes">`;
    } catch (e) {
        console.log(feature.properties, e);
    }
    for (let votes of data.votes) {
        let fillColor = getPartyColor(votes.party);
        popupContent += `
        <p >
        <span class="bar" style=""><b style="width:${votes.percentage}%"></b></span>
        <span class="color" style="background-color:${fillColor}"></span>
        ${votes.party == votes.name ?
                `<span class="nume">${votes.party}<br>${votes.votes?.toLocaleString()} Voturi - ${votes.percentage}% (${(votes.votes / (data?.population ?? 1) * 100).toLocaleString()}%)</span>` :
                `<span class="nume">${votes.party}<br>${votes.name}: ${votes.votes?.toLocaleString()} - ${votes.percentage}% (${(votes.votes / (data?.population ?? 1) * 100).toLocaleString()}%)</span>`}
        
        </p>`
    }
    // popupContent += JSON.stringify(feature.properties.data);
    popupContent += '</div>';
    var popup = L.popup({
        maxWidth: 700,
        maxHeight: 800
    })
        .setContent(popupContent);
    layer.bindPopup(popup, {
        closeButton: true,
        closeOnEscapeKey: true,
        className: 'shadow1',
        autoPan: true,
    });



    layer.on('mousemove', function (e) {
        let mouse = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
        let popup = document.querySelector('#popupX');
        popup.style.left = `${mouse.x}px`;
        popup.style.top = `${mouse.y}px`;
        popup.style.display = "block";
        popup.innerHTML = `${feature.properties.county}: ${feature.properties.name}`;
        // Open the popup on mouseover

        // Close the popup on mouseout
        layer.on('mouseout', function () {
            popup.style.display = "none";
        });
        layer.on('click', function () {
            popup.style.display = "none";
        });
    });

}
String.prototype.clip = function (n) { return this.length < n ? this : this.substring(0, n - 3) + '...' };
function setTable(county = "") {

    document.querySelector('#elInfo').innerHTML = "<div id='table'></div>";
    document.querySelector('#sliderTransparenta').style.display = window._w.partideAlese.length ? "none" : "flex";
    let table = document.querySelector('#table');
    table.innerHTML = `    `;

    try {
        let regex = window._w.prezenta[window._w.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/);
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(Number(regex[3]), Number(regex[2]) - 1));

        dataAlegeri = `${regex[1]} ${monthName} ${regex[3]}`;
    } catch (e) { console.log(e) }
    document.querySelector("#electionDate")?.remove();
    document.querySelector('#rezultate').insertAdjacentHTML('afterbegin', `<center id="electionDate"><p class="">${dataAlegeri}</p></center>`);

    let results = [];
    if (county == "") results = sortByValues(window._w.results, ...window._w.sortType);
    else results = sortByValues(window._w.statsVotes.judete[county], ...window._w.sortType);
    //sum all votes
    let sum = results.reduce((a, b) => a + b.votes, 0);
    let totalUATs = results.reduce((a, b) => a + b.UAT, 0);
    for (let i = 0; i < results.length; i++) {
        let party = results[i];
        if (i > 50) break;
        const countySelect = `${(party.UAT / totalUATs * 100).toFixed(2)}%`;
        const percent = (party.votes / sum * 100).toFixed(2);
        let difference = "";
        if(i< results.length-1) difference = `+${(party.votes - results[i + 1].votes).toLocaleString()} | `;
        const checked = window._w.partideAlese.includes(party.name) ? "checked" : "";
        const disabled = !window._w.partideAlese.includes(party.name) && window._w.partideAlese.length >= 2 ? "disabled" : "";
        table.innerHTML += `<div>
            <p class="color shadow1" style="background-color:${getPartyColor(party.name)}">
                <input class="iparty" onclick="selectParty('${party.name}')" type="checkbox" value="${party.name}" ${checked} ${disabled}>
            </p>
            <p>
                <span><abbr title="${party.name}">${party.name.clip(27)}</abbr></span>
                <span class="small">${party.votes.toLocaleString()} Voturi - ${percent}%</span>
                <span class="small">${difference}${party.UAT.toLocaleString()} UAT - ${countySelect}</span>
            </p>
        </div>`;
    }
    document.querySelector('#elInfo').insertAdjacentHTML('beforeend', `<div class="custom-select"><select id="countiesSelect" onchange="setTable(this.value)"><option value="">Alege Judet</option></select></div>`);
    let aJudete = [];
    for (let iCounty in window._w.statsVotes.judete) {
        let totalUATs = 0;
        let totalVotes = 0;
        for (let party in window._w.statsVotes.judete[iCounty]) {
            totalUATs += window._w.statsVotes.judete[iCounty][party].UAT;
            totalVotes += window._w.statsVotes.judete[iCounty][party].votes;
        }
        aJudete.push({ name: iCounty, UAT: totalUATs, votes: totalVotes });
    }
    aJudete.sort((a, b) => b.votes - a.votes);
    for (let party of aJudete) {
        document.querySelector('#countiesSelect').innerHTML += `<option value="${party.name}" ${party.name == county ? "selected" : ""}>${party.name == "SR" ? "Strainatate" : party.name}: ${party.votes.toLocaleString()} (${party.UAT.toLocaleString()})</option>`
    }
}
