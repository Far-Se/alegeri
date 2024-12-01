window._w.countyPopulation = {};
window._w.countyStats = {};
let debug = 0;
// const featureGroup = L.featureGroup();
function mixColor(percentage) {
    percentage = Math.max(0, Math.min(100, percentage));

    const color0 = { r: 255, g: 255, b: 255 };   // #ffcc00
    const color50 = { r: 255, g: 0, b: 0 }; // #66ccff
    const color100 = { r: 128, g: 0, b: 0 };   // #0000ff

    let start, end, factor;

    if (percentage < 50) {
        start = color0;
        end = color50;
        factor = percentage / 50;
    } else {
        start = color50;
        end = color100;
        factor = (percentage - 50) / 50;
    }

    const r = start.r + factor * (end.r - start.r);
    const g = start.g + factor * (end.g - start.g);
    const b = start.b + factor * (end.b - start.b);

    const red = Math.round(r);
    const green = Math.round(g);
    const blue = Math.round(b);

    const toHex = component => component.toString(16).padStart(2, '0');
    const hex = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;

    return hex;
}
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
        window._w.commune.features = window._w.commune.features.filter(feature => !['SRX', 'CO'].includes(feature.properties.county));
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
        let nameUAT = feature.properties.name.clear();
        let countyCode = window._w.countiesCodes[county];

        if (county === "SR") {
            countyCode = county;
            if (nameUAT === "ROU") {
                fillOpacity = 0;
                weight = 0.0;
            }
        }

        if (data.hasOwnProperty(countyCode)) {
            if (data[countyCode].hasOwnProperty(nameUAT)) {
                const fData = data[countyCode][nameUAT];
                if (fData["AG"]) {
                    if (fData["AG"] !== null && Array.isArray(fData["AG"])) {
                        let obj = {};
                        Object.assign(obj, {
                            "men_18_24": fData["AG"][0],
                            "men_25_34": fData["AG"][1],
                            "men_35_44": fData["AG"][2],
                            "men_45_64": fData["AG"][3],
                            "men_65+": fData["AG"][4],
                            "women_18_24": fData["AG"][5],
                            "women_25_34": fData["AG"][6],
                            "women_35_44": fData["AG"][7],
                            "women_45_64": fData["AG"][8],
                            "women_65+": fData["AG"][9],
                        });
                        fData.AG = { ...obj };
                    }
                }
                if (county == "SR") fData.TP = fData.TV;
                feature.properties.data = { ...fData };
                Object.assign(feature.properties.data, {
                    total_votanti: fData.TP,
                    total_voturi: fData.TV,
                    lista_permanenta: fData.LP,
                    lista_suplimentara: fData.LS,
                    urna_mobila: fData.UM,
                    percentage: (fData.TV / fData.TP).toFixed(2)
                });
                if (county == "SR") feature.properties.data.percentage = 0.1;

                if (!window._w.countyPopulation.hasOwnProperty(countyCode))
                    window._w.countyPopulation[countyCode] = {};
                if (!window._w.countyStats.hasOwnProperty(countyCode))
                    window._w.countyStats[countyCode] = { name: county, code: countyCode, votanti: 0, voturi: 0 };

                window._w.countyPopulation[countyCode][nameUAT] = {
                    name: nameUAT,
                    votanti: fData.TP,
                    voturi: fData.TV,
                    percentage: fData.TV / fData.TP
                };
                window._w.countyStats[countyCode].votanti += fData.TP;
                window._w.countyStats[countyCode].voturi += fData.TV;
            } else feature.properties.data = { ...emptyData, error: `No UAT data for ${nameUAT}` };
        } else feature.properties.data = { ...emptyData, error: `No county data for ${county}` };

        let fillColor = '#ff0000';
        fillColor = mixColor(feature.properties.data.percentage * 100);
        if (isNaN(feature.properties.data.percentage)) {
            feature.properties.data.percentage = 0;
            fillColor = '#dddddd';
            console.log(feature.properties.data);
        }
        let opacity = feature.properties.data.percentage;
        let weight = 0.3;
        if (feature.properties.data.total_votanti === 0) {
            if (county == "SR") {
                feature.properties.data.percentage = 0;
                opacity = 0;
                weight = 0;
            } else {
                feature.properties.data.percentage = 1;
                fillColor = '#878787';
                console.log(county, nameUAT, countyCode, feature.properties.data.error);
                console.log(feature.properties.county, feature.properties.name, countyCode);
            }
        }
        if (county !== "SR") {
            if (window._w.factor == "exponential") opacity = Math.pow((opacity * 1.1), 2);
            else if (window._w.factor == "suplimentara") opacity = feature.properties.data.lista_suplimentara / feature.properties.data.lista_permanenta;
            else if (feature.properties.data.AG) {
                if (window._w.factor.includes("varsta")) {
                    const varsta = window._w.factor.replace('varsta', '');
                    let ageTV = feature.properties.data.AG[`men_${varsta}`] + feature.properties.data.AG[`women_${varsta}`];
                    opacity = ageTV / (feature.properties.data.total_voturi - ageTV);
                    // opacity = Math.pow((opacity * 1.1), 2);
                    // opacity = 1 / (1 + Math.exp(-(opacity - 0.5) * 10));
                }
                else if (["tineri", "batrani"].includes(window._w.factor)) {
                    let ageGroupVotes = 0;
                    const ageRanges =
                        window._w.factor == "tineri" ?
                            ["men_18_24", "women_18_24", "men_25_34", "women_25_34", "men_35_44", "women_35_44",]
                            : ["men_45_64", "women_45_64", "men_65+", "women_65+"];
                    for (const ageRange of ageRanges)
                        ageGroupVotes += feature.properties.data.AG[ageRange];

                    opacity = ageGroupVotes / feature.properties.data.total_voturi;
                }
            }
        }
        if (window._w.factorPercentile) opacity = Math.pow((opacity * 1.1), 2);
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
            hourly = '<ul class="graphBar perHour">';
            let hourlyData = [];
            hourlyData.push({ TV: fData[8][1], LP: fData[8][2], LS: fData[8][3], hour: 8 })
            for (let i = 9; i < 22; i++) {
                if (!fData[i]) hourlyData.push({ TV: 0, LP: 0, LS: 0, hour: i});
                else
                    hourlyData.push({ TV: fData[i][1] - fData[i - 1][1], LP: fData[i][2] - fData[i - 1][2], LS: fData[i][3] - fData[i - 1][3], hour: i})
            }
            let maxTV = Math.max(...hourlyData.map(data => data.TV));
            for (const data of hourlyData) {
                hourly += `<li>
                <div class="bars">
                <div class="bar totalVotes" data-placement="top" data-tooltip="Total: ${data.TV.toLocaleString()}" style="height: ${data.TV / maxTV * 100}px"></div>
                <div class="bar listaPermanenta" data-placement="top" data-tooltip="L. Permanenta: ${data.LP.toLocaleString()}" style="height: ${data.LP / maxTV * 100}px"></div>
                <div class="bar listaSuplimentara" data-placement="top" data-tooltip="L. Suplimentara: ${data.LS.toLocaleString()}" style="height: ${data.LS / maxTV * 100}px"></div>
                </div>
                <div class="time">${data.hour.toString().padStart(2, '0')}</div>
                </li>`
            }
            hourly += '</ul>';
        }
        let ageGraph = ``;
        if (feature.properties.data["AG"]) {

            ageGraph = '<h3>Varsta</h3><ul class="graphBar ageGroup">';
            let ageData = feature.properties.data["AG"];
            let maxTV = Math.max(...Object.values(ageData));
            let data = {};
            for (const aData of Object.keys(ageData)) {
                let form = aData.split('_');
                let group = form[0];
                let age = form.slice(1).join('-');
                if (!data.hasOwnProperty(age)) data[age] = {};
                data[age][group] = ageData[aData];
            }
            maxTV = Math.max(...Object.values(data).map(data => Object.values(data).reduce((a, b) => a + b)));
            debug = 1;
            for (const ageGroup of Object.keys(data)) {
                let value = data[ageGroup];
                ageGraph += `<li>
                <div class="bars">
                <div class="bar totalVotes" data-placement="top" data-tooltip="Total: ${(value["men"] + value["women"]).toLocaleString()}" style="height: ${(value["men"] + value["women"]) / maxTV * 100}px"></div>
                <div class="bar listaPermanenta" data-placement="top" data-tooltip="Barbati: ${value["men"].toLocaleString()}" style="height: ${value["men"] / maxTV * 100}px"></div>
                <div class="bar listaSuplimentara" data-placement="top" data-tooltip="Femei: ${value["women"].toLocaleString()}" style="height: ${value["women"] / maxTV * 100}px"></div>
                </div>
                <div class="time">${ageGroup}</div>
                </li>`
            }
            ageGraph += '</ul>';
        }

        popupContent = `
        <div class="${feature.properties.county}">
    <h1>${feature.properties.county}: ${feature.properties.name}</h1>
    <h3>Numar Votanti: ${feature.properties.data.total_votanti.toLocaleString()}</h3>
    <h3>Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}</h3>
    <p>
    <span>Lista Permanenta: ${feature.properties.data.lista_permanenta.toLocaleString()} - ${((feature.properties.data.lista_permanenta / feature.properties.data.total_voturi * 100).toFixed(2))}%</span><br>
    <span>Lista Suplimentara: ${feature.properties.data.lista_suplimentara.toLocaleString()} - ${((feature.properties.data.lista_suplimentara / feature.properties.data.total_voturi * 100).toFixed(2))}%</span><br>
    <span>Urna mobila: ${feature.properties.data.urna_mobila?.toLocaleString()} - ${((feature.properties.data.urna_mobila ?? 0 / feature.properties.data.total_voturi * 100).toFixed(2))}%</span>
    </p>
    <hr>
    <h2><center>Procent: ${(feature.properties.data.percentage * 100).toFixed(2)}%</center></h2>
    ${hourly}${ageGraph}</div>`;
        if (feature.properties.county == "SR") {
            popupContent = `
        <div class="${feature.properties.county}">
    <h1>${window._w.countries[feature.properties.name] ?? feature.properties.name}</h1>
    <h3>Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}</h3>
    <hr>
    ${hourly}${ageGraph}</div>`;
        }
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
            if (feature.properties.county == "SR") popup.innerHTML = `${window._w.countries[feature.properties.name] ?? feature.properties.name}`;
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
window._w.factor = "";
function changeFactor() {
    window._w.factor = document.querySelector('#factorSelect').value;
    loadData();
}
window._w.factorPercentile = false;
function toggleExp() {
    window._w.factorPercentile = !window._w.factorPercentile;
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
    <div class="custom-select"><select id="factorSelect" onchange="changeFactor()">
        <option value="">Prezenta</option>
        <option value="exponential">Exponential</option>
        <option value="suplimentara">Lista Suplimentara</option>
        <option value="tineri">Tineri 18-44</option>
        <option value="batrani">Varstnici 45+</option>
        <option value="varsta18_24">Varsta 18-24</option>
        <option value="varsta25_34">Varsta 25-34</option>
        <option value="varsta35_44">Varsta 35-44</option>
        <option value="varsta45_64">Varsta 45-64</option>
        <option value="varsta65+">Varsta 65+</option>
    </select></div>
        <hr>`;
    /*
    
<div class="customToggles">
<a href="#" onclick="toggleExp()" id="exponential" class="${window._w.factorPercentile ? "active" : ""}">Exponential</a> 
</div>
    */
    if (window._w.factor != "") document.querySelector('#factorSelect').value = window._w.factor;

    let table = document.querySelector('#table');
    let results = [];
    if (selectedCounty === "") results = sortByValues(window._w.countyStats, 'percentage', 'voturi');
    else {
        results = sortByValues(window._w.countyPopulation[selectedCounty], 'percentage', 'voturi');
        table.innerHTML += `<div onclick="makeTable()"><p><span class="big">Inapoi</span></p><p class="small">${window._w.countiesName[selectedCounty] ?? selectedCounty}</p></div>`;
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