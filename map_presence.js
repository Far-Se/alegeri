window._w.countyPopulation = {};
window._w.countyStats = {};
// const featureGroup = L.featureGroup();
async function loadPresence(alegeri) {
    document.querySelector('#sliderTransparenta').style.display = "none";
    window._w.countyStats = {};
    window._w.countyPopulation = {};
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
    let data = await (await fetch(`data/alegeri/prezenta_${alegeri}.json`)).json();
    if (!geoJSON) {
        console.log('loaded');
        await getCommunes();
        window._w.commune.features = window._w.commune.features.filter(feature => !['SR', 'CO'].includes(feature.properties.county));
        geoJSON = L.geoJSON(window._w.commune, {});
        featureGroup.addTo(map);
        geoJSON.addTo(featureGroup);
        const geoJSONLayer = L.geoJSON(window._w.countyOutline, {
            style: () => ({
                fillColor: "#ff0000",
                fillOpacity: 1,
                weight: 2,
                color: "#474646"
            })
        });
        geoJSONLayer.addTo(map);
    }
    featureGroup.eachLayer(layer => {
        if (layer.setStyle) {
            layer.setStyle(processCounty);
            Object.values(layer._layers).forEach(subLayer => {
                onEachFeaturePresence(subLayer.feature, subLayer);
            });
        }
    });

    document.querySelector('#loading').style.display = "none";
    for (let county in window._w.countyPopulation)
        window._w.countyStats[county].percentage = (window._w.countyStats[county].voturi / window._w.countyStats[county].votanti);
    makeTable();

    function processCounty(feature) {
        let county = feature.properties.county.clear();
        let name = feature.properties.name.clear();
        let countyCode = window._w.countiesCodes[county];

        if (data.hasOwnProperty(countyCode)) {
            if (data[countyCode].hasOwnProperty(name)) {
                const fData = data[countyCode][name];
                feature.properties.data = { ...fData };
                Object.assign(feature.properties.data, {
                    total_votanti: fData.TP,
                    total_voturi: fData.TV,
                    lista_permanenta: fData.LP,
                    lista_C: fData.LC,
                    lista_suplimentara: fData.LS,
                    urna_mobila: fData.UM,
                    percentage: (fData.TV / fData.TP).toFixed(2)
                });

                if (!window._w.countyPopulation.hasOwnProperty(countyCode))
                    window._w.countyPopulation[countyCode] = {};
                if (!window._w.countyStats.hasOwnProperty(countyCode))
                    window._w.countyStats[countyCode] = { name: county, code: countyCode, votanti: 0, voturi: 0 };

                window._w.countyPopulation[countyCode][name] = {
                    name: name,
                    votanti: data[countyCode][name].TP,
                    voturi: data[countyCode][name].TV,
                    percentage: data[countyCode][name].TV / data[countyCode][name].TP
                };
                window._w.countyStats[countyCode].votanti += data[countyCode][name].TP;
                window._w.countyStats[countyCode].voturi += data[countyCode][name].TV;
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
        let opacity = feature.properties.data.percentage;
        if(window._w.prezentaExponentiala) opacity =  Math.pow((feature.properties.data.percentage*1.1),2);
        return {
            fillColor: fillColor,
            weight: weight,
            color: "#000000",
            fillOpacity: opacity
        };

    }
    function onEachFeaturePresence(feature, layer) {
        if (feature.properties.data.percentage === 0) return;
        let hourly = ``;
        if (feature.properties.data["8"]) {
            let fData = feature.properties.data;
            hourly = '<ul class="hourlyBar">';
            let hourlyData = [];
            hourlyData.push({ TV: fData[8].TV, LP: fData[8].LP, LS: fData[8].LS, hour: 8 })
            for (let i = 9; i < 22; i++) {
                if (!fData[i]) hourlyData.push({ TV: 0, LP: 0, LS: 0, hour: i, });
                else
                hourlyData.push({ TV: fData[i].TV - fData[i - 1].TV, LP: fData[i].LP - fData[i - 1].LP, LS: fData[i].LS - fData[i - 1].LS, hour: i, })
            }
            let maxTV = Math.max(...hourlyData.map(data => data.TV));
            for (const data of hourlyData) {
                hourly += `<li>
                <div class="bars">
                <div class="bar totalVotes" data-placement="top" data-tooltip="Total: ${data.TV}" style="height: ${data.TV / maxTV * 100}px"></div>
                <div class="bar listaPermanenta" data-placement="top" data-tooltip="L. Permanenta: ${data.LP}" style="height: ${data.LP / maxTV * 100}px"></div>
                <div class="bar listaSuplimentara" data-placement="top" data-tooltip="L. Suplimentara: ${data.LS}" style="height: ${data.LS / maxTV * 100}px"></div>
                </div>
                <div class="time">${data.hour.toString().padStart(2, '0')}</div>
                </li>`
            }
            hourly += '</ul>';
        }

        popupContent = `
    <h1>${feature.properties.county}: ${feature.properties.name}</h1>
    <h3>
    Numar Votanti: ${feature.properties.data.total_votanti.toLocaleString()}<br>
    Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}<br>
    <small><abbr title="Lista Suplimentara">LS</abbr>: ${feature.properties.data.lista_suplimentara} 
    <abbr title="Lista Permanenta">LP</abbr>: ${feature.properties.data.lista_permanenta}
    <abbr title="Urna mobila">UM</abbr>: ${feature.properties.data.urna_mobila} 
    </h3>
    <hr>
    <h2><center>Procent: ${(feature.properties.data.percentage * 100).toFixed(2)}%</center></h2>
    ${hourly}`;
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
}

function sortByValues(obj, key, subkey = '') {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => subkey !== '' && a[key] === b[key] ? b[subkey] - a[subkey] : b[key] - a[key]);
    return candidatesArray;
}
window._w.prezentaExponentiala = false;
function toggleExp(){
    window._w.prezentaExponentiala = !window._w.prezentaExponentiala;
    loadData();
    

}
function makeTable(selectedCounty = "") {
    document.querySelector('#elInfo').innerHTML = "<div id='prezentaTotala'></div><div id='table' class='prezentaTable'></div>";
    document.querySelector('#sortType')?.remove();
    let totalVoturi = Object.values(window._w.countyStats).reduce((a, b) => a + b.voturi, 0);
    let totalVotanti = Object.values(window._w.countyStats).reduce((a, b) => a + b.votanti, 0);
    let totalPercentage = totalVoturi / totalVotanti;
    let dataAlegeri = "";
    try {
        let regex = window._w.prezenta[window._w.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/);
        const [year, month, day] = [Number(regex[3]), Number(regex[2]) - 1, Number(regex[1])];
        const date = new Date(year, month, day);
        const now = new Date();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        dataAlegeri = `${regex[1]} ${monthName} ${regex[3]}`;
        if (day == now.getDate() && month == now.getMonth()) dataAlegeri += ` Ora ${now.getHours()}`;
    } catch (e) { console.log(e) }
    document.querySelector('#prezentaTotala').innerHTML += `
    <p>
    <center><span class="">${dataAlegeri}</span></center><br>
    Prezenta ${(totalPercentage * 100).toFixed(2)}%<br>
    <span class="small">${totalVoturi.toLocaleString()} voturi din ${totalVotanti.toLocaleString()}</span>
    </p>
    <a href="#" onclick="toggleExp()" id="exponential">Exponential</a>
    <hr>
    `;
    if(window._w.prezentaExponentiala) 
        document.querySelector('#exponential').classList.add('active');

    let table = document.querySelector('#table');
    let results = [];
    if (selectedCounty === "") results = sortByValues(window._w.countyStats, 'percentage', 'voturi');
    else {
        results = sortByValues(window._w.countyPopulation[selectedCounty], 'percentage', 'voturi');
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