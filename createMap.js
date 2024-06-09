

let map = L.map('map', {
    zoomSnap: 0,
    zomDelta: 5,
    wheelPxPerZoomLevel:140,
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

window.Commune = null;
let getCommunes = async () => {
    if (!window.Commune) {
        const f = await fetch('data/map/comune.geojson');
        const j = await f.json();
        window.Commune = j;
        return window.Commune;
    } else return window.Commune;
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
let geoJSON = null;
function loadPresence(alegeri) {
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
                                feature.properties.data.percentage = (data[countyCode][name].total_voturi / data[countyCode][name].total_votanti).toFixed(5);
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
<small>LS: ${feature.properties.data.lista_suplimentara} LP: ${feature.properties.data.lista_permanenta} LSC: ${feature.properties.data.LS}</small><br>
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