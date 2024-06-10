

let map = L.map('map', {
    zoomSnap: 0,
    zomDelta: 5,
    wheelPxPerZoomLevel: 140,
}).setView([45.9628666, 25.2081763], 7.4);
let lightTile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmFyc2UiLCJhIjoiY2tnM3JnOHJtMGRnNzMzcDQ2a3dldHpyYiJ9.cdOn_RRX1YoMWUmoR6i36A', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/light-v9',
    tileSize: 512,
    zoomOffset: -1
});
let darkTile = L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoiZmFyc2UiLCJhIjoiY2tnM3JnOHJtMGRnNzMzcDQ2a3dldHpyYiJ9.cdOn_RRX1YoMWUmoR6i36A', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox/dark-v9',
    tileSize: 512,
    zoomOffset: -1
});

lightTile.addTo(map);
let isLight = true;
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#darkMode')?.addEventListener('click', () => {
        if (isLight) {
            document.getElementById('darkMode').innerText = '🌙';
            isLight = false;
            darkTile.addTo(map);
            lightTile.removeFrom(map);
        } else {
            document.getElementById('darkMode').innerText = '🔆';
            isLight = true;
            lightTile.addTo(map);
            darkTile.removeFrom(map);
        }
    });
});

window.Commune = null;
let getCommunes = async () => {
    if (!window.Commune) {
        const f = await fetch('data/map/comune.geojson');
        const j = await f.json();
        window.Commune = j;
        return window.Commune;
    } else return window.Commune;
}

function sortByValues(obj, key) {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => b[key] - a[key]);
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
function loadPresence(alegeri) {
    alegeri = alegeri.replace(/(\d)[a-z]+/gi, '$1');
    document.querySelector('#loading').style.display = "flex";
    document.querySelector('#rezultate').style.display = "none";
    const emptyData = {
        total_votanti: 0,
        total_voturi: 0,
        lista_permanenta: 0,
        lista_suplimentara: 0,
        LS: 0,
        percentage: 0

    };
    console.log(alegeri);
    fetch(`data/alegeri/prezenta_${alegeri}.json`)
        .then(response => response.json())
        .then(data => {
            getCommunes().then(async communes => {
                if (geoJSON) geoJSON.removeFrom(map);
                geoJSON = await L.geoJSON(communes, {

                    style: function (feature) {
                        let county = feature.properties.county.clear();
                        let name = feature.properties.name.clear();
                        let countyCode = window.countiesCodes[county];

                        if (data.hasOwnProperty(countyCode)) {
                            if (data[countyCode].hasOwnProperty(name)) {
                                feature.properties.data = { ...data[countyCode][name] };
                                feature.properties.data.percentage = (data[countyCode][name].total_voturi / data[countyCode][name].total_votanti).toFixed(2);
                            } else feature.properties.data = { ...emptyData };
                        } else feature.properties.data = { ...emptyData };

                        let fillColor = '#ff0000';
                        if (isNaN(feature.properties.data.percentage)) {
                            feature.properties.data.percentage = 0;
                            fillColor = '#dddddd';
                            console.log(feature.properties.data);
                        }
                        if (feature.properties.data.total_votanti === 0) {
                            feature.properties.data.percentage = 1;
                            fillColor = '#878787';
                            console.log(county, name, countyCode);
                            console.log(feature.properties.county, feature.properties.name, countyCode);
                        }


                        return {
                            fillColor: fillColor,
                            weight: 0.3,
                            color: "#000000",
                            fillOpacity: feature.properties.data.percentage
                        }
                    },
                    onEachFeature: onEachFeaturePresence,
                });
                geoJSON.addTo(map);

                document.querySelector('#loading').style.display = "none";
            })
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function onEachFeaturePresence(feature, layer) {

    popupContent = `
<h1>${feature.properties.county}: ${feature.properties.name}</h1>
<h3>
Numar Votanti: ${feature.properties.data.total_votanti.toLocaleString()}<br>
Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}<br>
<small>LS: ${feature.properties.data.lista_suplimentara} LP: ${feature.properties.data.lista_permanenta} UM: ${feature.properties.data.urna_mobila} LC:${feature.properties.data.lista_C}</small><br>
Procent: ${(feature.properties.data.percentage * 100).toFixed(2)}%<br>
</h3>
<div class="overFlow">`;
    let grupe = []
    Object.keys(feature.properties.data).forEach(e => {
        if (~e.indexOf('Bar') || ~e.indexOf('Fem'))
            grupe.push({
                'type': e,
                'value': feature.properties.data[e]
            });
    })
    grupe.sort((a, b) => parseInt(b.value) - parseInt(a.value));

    grupe.forEach((v) => {
        popupContent += `${v.type} : ${v.value} <br>`;
    })
    // popupContent += JSON.stringify(feature.properties.data);
    popupContent += '</div>';
    var popup = L.popup({
        maxWidth: 700,
        maxHeight: 800
    })
        .setContent(popupContent);
    layer.bindPopup(popup);
}

function loadResults(alegeri) {
    window.results = {};
    document.querySelector('#loading').style.display = "flex";
    document.querySelector('#rezultate').style.display = "flex";
    const emptyData = {
        castigator: { party: "N/A", votes: 0, name: "N/A" },
        totalVoturi: 0,
        votes: [{ party: "N/A", votes: 0, name: "N/A" }],
    };
    fetch(`data/alegeri/rezultate_${alegeri}.json`)
        .then(response => response.json())
        .then(data => {
            getCommunes().then(async communes => {
                if (geoJSON) geoJSON.removeFrom(map);
                geoJSON = await L.geoJSON(communes, {

                    style: function (feature) {
                        let county = feature.properties.county.clear();
                        let name = feature.properties.name.clear();
                        let countyCode = window.countiesCodes[county];
                        let fillColor = "#333333";
                        let fillOpacity = 1;
                        if (data.hasOwnProperty(countyCode)) {
                            if (data[countyCode].hasOwnProperty(name)) {
                                let votes = sortByValues(data[countyCode][name].votes, 'votes');
                                let index = 0;
                                if (votes.length > 1 && document.querySelector('#toggleLocul2').checked == true) index = 1;
                                fillColor = getPartyColor(votes[index].party);
                                if (!window.results.hasOwnProperty(votes[index].party)) window.results[votes[index].party] = { name: votes[index].party, UAT: 0, votes: 0 };
                                window.results[votes[index].party].UAT++;
                                feature.properties.data = {
                                    totalVoturi: votes.reduce((a, b) => a + b.votes, 0),
                                }
                                feature.properties.data.votes = votes.map(v => {
                                    window.results[votes[index].party].votes += v.votes;
                                    v.percentage = (v.votes / feature.properties.data.totalVoturi * 100).toFixed(2);
                                    v.procent = v.votes / feature.properties.data.totalVoturi;
                                    return v;
                                });
                                if (feature.properties.data.votes.length == 0) feature.properties.data.votes = [{ party: "N/A", votes: 0, name: "N/A" }];


                            } else feature.properties.data = { ...emptyData };
                        } else feature.properties.data = { ...emptyData };

                        if (window.partideAlese.length == 1) {
                            if (window.partideAlese.includes(feature.properties.data.votes[0].party)) {
                                fillOpacity = 1;
                            } else fillOpacity = 0.2;
                            if (document.querySelector('#prezentaProcent').checked == true) {
                                fillColor = getPartyColor(window.partideAlese[0]);
                                let partid = feature.properties.data.votes.find(v => v.party == window.partideAlese[0]);
                                let procent = 0;
                                if (partid != null) procent = partid.procent;
                                fillOpacity = procent

                            }
                        } else if (window.partideAlese.length == 2) {
                            
                            if (feature.properties.data.votes.length >= 2 && window.partideAlese.includes(feature.properties.data.votes[0].party) && window.partideAlese.includes(feature.properties.data.votes[1].party)) {
                                let found = 0;
                                for (const p of feature.properties.data.votes) {
                                    if (p.party == window.partideAlese[0] || p.party == window.partideAlese[1]) {
                                        fillColor = getPartyColor(p.party);
                                        found = 1;
                                        break;
                                    }
                                }
                                fillOpacity = 1;
                                if(!found)fillOpacity = 0.05;
                            }
                            else {
                                fillOpacity = 0.2;
                            }
                        }

                        return {
                            fillColor: fillColor,
                            weight: 0.3,
                            color: "#000000",
                            fillOpacity: fillOpacity
                        }
                    },
                    onEachFeature: onEachFeatureResults,
                });
                geoJSON.addTo(map);

                document.querySelector('#loading').style.display = "none";
                setTable();
            })
        })
        .catch(error => {
            console.error('Error:', error);

            document.querySelector('#loading').style.display = "none";
            document.querySelector('#table').innerHTML = 'Inca nu exista date!';
        });
}

function onEachFeatureResults(feature, layer) {
    let popupContent = '';
    try {
        popupContent = `
<h1>${feature.properties.county}: ${feature.properties.name}</h1>
<h3>Castigator: ${feature.properties.data?.votes[0].name ?? 'N/A'}</h3>
<h3>Partid: ${feature.properties.data?.votes[0].party ?? 'N/A'}</h3>
<h3>Total voturi: ${feature.properties.data?.totalVoturi.toLocaleString() ?? 'N/A'}</h3>
<div class="votes">`;
    } catch (e) {
        console.log(feature.properties);
    }
    for (let votes of feature.properties.data.votes) {
        let fillColor = getPartyColor(votes.party);



        popupContent += `
        <p><span class="color" style="background-color:${fillColor}"></span><span class="nume">${votes.party}<br>${votes.name}:${votes.votes} - ${votes.percentage}%</span> </p>`
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
function setTable() {

    let table = document.querySelector('#table');
    table.innerHTML = `    `;

    let count = 0;
    let results = sortByValues(window.results, 'UAT');
    for (let party of results) {
        count++;
        if (count > 8) return;

        table.innerHTML += `<div>
        <p class="color" style="background-color:${getPartyColor(party.name)}"><input class="iparty" onclick="selectParty('${party.name}')" type="checkbox" value="${party.name}"
        ${window.partideAlese.includes(party.name) ? "checked" : ""}
        ${!window.partideAlese.includes(party.name) && window.partideAlese.length >= 2 ? "disabled" : ""}
         ></p>
        <p>
        <span><abbr title="${party.name}">${party.name.clip(30)}</abbr></span>
        <span>${party.UAT.toLocaleString()} UAT - ${party.votes.toLocaleString()} voturi</span>
        </p>
        </div>`;
    }
}