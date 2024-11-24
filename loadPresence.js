window.countyPopulation = {};
window.countyStats = {};
function loadPresence(alegeri) {
    document.querySelector('#sliderTransparenta').style.display = "none";
    window.countyStats = {};
    window.countyPopulation = {};
    // alegeri = alegeri.replace(/(\d)[a-z]+/gi, '$1');
    document.querySelector('#loading').style.display = "flex";
    document.querySelector('#rezultate').style.display = "none";
    document.querySelector('#elInfo').innerHTML = '';
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
            getCommunes().then(async (communes) => {
                if (geoJSON) geoJSON.removeFrom(map);
                if (conturGeoJSON) conturGeoJSON.removeFrom(map);
                communes.features = communes.features.filter(feature => feature.properties.county !== 'SR');
                geoJSON = await L.geoJSON(communes, {
                    style: function (feature) {

                        let county = feature.properties.county.clear();
                        let name = feature.properties.name.clear();
                        let countyCode = window.countiesCodes[county];

                        if (data.hasOwnProperty(countyCode)) {
                            if (data[countyCode].hasOwnProperty(name)) {
                                feature.properties.data = { ...data[countyCode][name] };
                                feature.properties.data.total_votanti = data[countyCode][name].TP;
                                feature.properties.data.total_voturi = data[countyCode][name].TV;
                                feature.properties.data.lista_permanenta = data[countyCode][name].LP;
                                feature.properties.data.lista_C = data[countyCode][name].LC;
                                feature.properties.data.lista_suplimentara = data[countyCode][name].LS;
                                feature.properties.data.urna_mobila = data[countyCode][name].UM;
                                feature.properties.data.percentage = (data[countyCode][name].TV / data[countyCode][name].TP).toFixed(2);

                                if (!window.countyPopulation.hasOwnProperty(countyCode))
                                    window.countyPopulation[countyCode] = {};
                                if (!window.countyStats.hasOwnProperty(countyCode))
                                    window.countyStats[countyCode] = { name: county, code: countyCode, votanti: 0, voturi: 0 };

                                window.countyPopulation[countyCode][name] = {
                                    name: name,
                                    votanti: data[countyCode][name].TP,
                                    voturi: data[countyCode][name].TV,
                                    percentage: data[countyCode][name].TV / data[countyCode][name].TP
                                };
                                window.countyStats[countyCode].votanti += data[countyCode][name].TP;
                                window.countyStats[countyCode].voturi += data[countyCode][name].TV;
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
                        let weight = 0.3;
                        if (fillColor === "#878787" && county === "SR") {
                            feature.properties.data.percentage = 0;
                            weight = 0;

                        }
                        return {
                            fillColor: fillColor,
                            weight: weight,
                            color: "#000000",
                            fillOpacity: feature.properties.data.percentage
                        };
                    },
                    onEachFeature: onEachFeaturePresence,
                });
                geoJSON.addTo(map);
                const geoJSONLayer = L.geoJSON(window.conturJudete, {
                    style: (e) => {
                        return {
                            fillColor: "#ff0000",
                            fillOpacity: 1,
                            weight: 0.9,
                            color: "#000000"

                        }
                    }
                });
                geoJSONLayer.addTo(map);
                document.querySelector('#loading').style.display = "none";
                for (let county in window.countyPopulation)
                    window.countyStats[county].percentage = (window.countyStats[county].voturi / window.countyStats[county].votanti);
                makeTable();
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('#loading').style.display = "none";
            document.querySelector('#elInfo').innerHTML = 'Nu exista date!';
        });
}
function onEachFeaturePresence(feature, layer) {
    if (feature.properties.data.percentage === 0) return;
    popupContent = `
<h1>${feature.properties.county}: ${feature.properties.name}</h1>
<h3>
Numar Votanti: ${feature.properties.data.total_votanti.toLocaleString()}<br>
Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}<br>
<small><abbr title="Lista Suplimentara">LS</abbr>: ${feature.properties.data.lista_suplimentara} 
<abbr title="Lista Permanenta">LP</abbr>: ${feature.properties.data.lista_permanenta}
<abbr title="Urna mobila">UM</abbr>: ${feature.properties.data.urna_mobila} 
<abbr title="Lista C">LC</abbr>: ${feature.properties.data.lista_C}</small><br></h3>
<hr>
<h2><center>Procent: ${(feature.properties.data.percentage * 100).toFixed(2)}%</center></h2>`;
    var popup = L.popup({
        maxWidth: 700,
        maxHeight: 800
    })
        .setContent(popupContent);
    layer.bindPopup(popup);


    layer.on('mousemove', function (e) {
        let mouse = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
        let popup = document.querySelector('#popupX');
        popup.style.left = `${mouse.x}px`;
        popup.style.top = `${mouse.y}px`;
        popup.style.display = "block";
        popup.innerHTML = `${feature.properties.county}: ${feature.properties.name} ${parseInt(feature.properties.data.percentage * 100)}%`;
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
function sortByValues(obj, key, subkey = '') {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => subkey !== '' && a[key] === b[key] ? b[subkey] - a[subkey] : b[key] - a[key]);
    return candidatesArray;
}
function makeTable(selectedCounty = "") {
    document.querySelector('#elInfo').innerHTML = "<div id='prezentaTotala'></div><div id='table' class='prezentaTable'></div>";
    let totalVoturi = Object.values(window.countyStats).reduce((a, b) => a + b.voturi, 0);
    let totalVotanti = Object.values(window.countyStats).reduce((a, b) => a + b.votanti, 0);
    let totalPercentage = totalVoturi / totalVotanti;
    let dataAlegeri = "";
    try {
        let regex = window.prezenta[window.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/);
        const [year,month,day] = [Number(regex[3]), Number(regex[2]) - 1,Number(regex[1])];
        const date = new Date(year,month,day);
        const now = new Date();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        console.log(date, day, month, now.getDate(), now.getMonth());
        
        
        dataAlegeri = `${regex[1]} ${monthName} ${regex[3]}`;
        if(day == now.getDate() && month == now.getMonth()) dataAlegeri += ` Ora ${now.getHours()}`;
    } catch (e) { console.log(e) }
    document.querySelector('#prezentaTotala').innerHTML += `
    <p>
    <center><span class="">${dataAlegeri}</span></center><br>
    Prezenta ${(totalPercentage * 100).toFixed(2)}%<br>
    <span class="small">${totalVoturi.toLocaleString()} voturi din ${totalVotanti.toLocaleString()}</span></p>
    <hr>
    `;

    let table = document.querySelector('#table');
    let results = [];
    if (selectedCounty === "") results = sortByValues(window.countyStats, 'percentage', 'voturi');
    else {
        results = sortByValues(window.countyPopulation[selectedCounty], 'percentage', 'voturi');
        table.innerHTML += `<div onclick="makeTable()"><p><span class="big">Inapoi</span></p><p class="small">${selectedCounty}</p></div>`;
    }
    for (let county of results) {
        table.innerHTML += `<div class="tCounty" ${!selectedCounty.length ? `onclick="makeTable('${county.code}')"` : ""}>
        <p><span class="big">${county.name}<span></p>
        <p class="small">${(county.percentage * 100).toFixed(2)}% Prezenta<br> ${county.voturi.toLocaleString()} / ${county.votanti.toLocaleString()}</p>
        </div>`
    }
    if (selectedCounty !== "") table.innerHTML += `<div onclick="makeTable()"><p><span class="big">Inapoi</span></p>`;
}
//make on hover for any div
document.addEventListener('DOMContentLoadedxxx', (event) => {

    document.querySelector('.controls').addEventListener('mouseover', function (event) {
        if (event.target.classList.contains('tCounty')) {
            let shadow = document.querySelector('#popShadow');
            shadow.style.display = "block";
            shadow.style.position = "absolute";
            const rect = event.target.getBoundingClientRect();
            shadow.style.left = `${rect.left}px`;
            shadow.style.top = `${rect.top}px`;
            shadow.style.width = `${rect.width}px`;
            shadow.style.height = `${rect.height}px`;
            shadow.style.zIndex = 99999999;
        }
    });
    document.querySelector('.controls').addEventListener('mouseout', function (event) {
        if (event.target.classList.contains('tCounty')) {
            let shadow = document.querySelector('#popShadow');
            shadow.style.display = "none";
        }
    });
});