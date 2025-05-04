/* eslint-disable no-undef */

let tested = false;
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
        // window._w.commune.features = window._w.commune.features.filter(feature => !['SRX', 'CO'].includes(feature.properties.county));
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
    let SRTotalVotes = 0;
    if (data["SR"]) {
        SRTotalVotes = Object.values(data["SR"]).reduce((a, b) => a + b.TV, 0);
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
        const countyCode = county === "SR" ? county : county === "CO" ? "CORESPONDENTA" : window._w.countiesCodes[county];
        const fData = data[countyCode]?.[nameUAT];

        if (fData) {
            processFeatureData(fData, county, countyCode, nameUAT, feature);
        } else {
            feature.properties.data = { ...emptyData, error: `No ${fData ? 'UAT' : 'county'} data for ${fData ? nameUAT : county}` };
        }

        return calculateStyle(feature, county, countyCode);
    }

    function processFeatureData(fData, county, countyCode, nameUAT, feature) {
        if (Array.isArray(fData["AG"])) {
            fData.AG = transformAgeGroups(fData["AG"]);
        }
        if (["SR", "CO"].includes(county)) fData.TP = fData.TV;

        feature.properties.data = {
            ...fData,
            total_votanti: fData.TP,
            total_voturi: fData.TV,
            lista_permanenta: fData.LP,
            lista_suplimentara: fData.LS,
            urna_mobila: fData.UM,
            percentage: (fData.TV / fData.TP).toFixed(2)
        };

        if (["SR", "CO"].includes(county)) feature.properties.data.percentage = 0.1;

        updateCountyStats(countyCode, county, nameUAT, fData);
    }

    function transformAgeGroups(ageGroups) {
        const ageRanges = ["18_24", "25_34", "35_44", "45_64", "65+"];
        const genders = ["men", "women"];
        return ageRanges.reduce((acc, range, ageIndex) => {
            genders.forEach((gender, genderIndex) => {
                acc[`${gender}_${range}`] = ageGroups[ageIndex + genderIndex * ageRanges.length] || 0;
            });
            return acc;
        }, {});
    }

    function updateCountyStats(countyCode, county, nameUAT, fData) {
        window._w.countyPopulation[countyCode] = window._w.countyPopulation[countyCode] || {};
        window._w.countyStats[countyCode] = window._w.countyStats[countyCode] || {
            name: county,
            code: countyCode,
            votanti: 0,
            voturi: 0
        };

        window._w.countyPopulation[countyCode][nameUAT] = {
            name: nameUAT,
            votanti: fData.TP,
            voturi: fData.TV,
            percentage: fData.TV / fData.TP
        };
        window._w.hourly = window._w.hourly || {};
        if (!["SR", "CO"].includes(county)) {
            for (let hour = 8; hour <= 21; hour++) {
                if (fData[hour]) {
                    window._w.hourly[hour] = window._w.hourly[hour] || {};
                    Object.keys(fData[hour]).forEach(key => {
                        window._w.hourly[hour][key] = (window._w.hourly[hour][key] || 0) + fData[hour][key];
                    });
                }
            }

            window._w.countyStats[countyCode].votanti += fData.TP;
        }
        window._w.countyStats[countyCode].voturi += fData.TV;
    }

    function calculateStyle(feature, county, countyCode) {
        const data = feature.properties.data;
        let fillColor = '#ff0000';
        let opacity = data.percentage;
        let weight = 0.3;

        if (isNaN(opacity)) {
            opacity = 0;
            fillColor = '#dddddd';
        }

        if (data.total_votanti === 0) {
            handleNoVotanti(data, county, countyCode);
            opacity = data.percentage;
            fillColor = data.percentage === 1 ? '#878787' : fillColor;
        }

        if (county === "SR") {
            opacity = Math.pow(data.total_voturi / SRTotalVotes, 0.45);
        }

        if (window._w.factor) {
            opacity = applyFactor(opacity, data, county);
        }

        if (window._w.factorPercentile) {
            opacity = Math.pow((opacity * 1.1), 2);
        }

        fillColor = mixColor(opacity * 100);
        return {
            fillColor,
            weight,
            color: "#000000",
            fillOpacity: opacity
        };
    }

    function handleNoVotanti(data, county, countyCode) {
        if (["SR", "CO"].includes(county)) {
            data.percentage = 0;
        } else {
            data.percentage = 1;
            console.log(county, countyCode, data.error);
        }
    }

    function applyFactor(opacity, data, county) {
        switch (window._w.factor) {
            case "exponential":
                return Math.pow((opacity * 1.1), 2);
            case "suplimentara":
                return county !== "SR" ? data.lista_suplimentara / data.lista_permanenta : opacity;
            case "permanenta":
                return county !== "SR" ? data.lista_permanenta / data.total_votanti : opacity;
            default:
                return applyAgeFactor(opacity, data);
        }
    }

    function applyAgeFactor(opacity, data) {
        if (data.AG) {
            if (window._w.factor.startsWith("varsta")) {
                const varsta = window._w.factor.replace('varsta', '');
                const ageTV = data.AG[`men_${varsta}`] + data.AG[`women_${varsta}`];
                return ageTV / (data.total_voturi - ageTV);
            } else if (["tineri", "batrani"].includes(window._w.factor)) {
                const ageRanges = window._w.factor === "tineri"
                    ? ["men_18_24", "women_18_24", "men_25_34", "women_25_34", "men_35_44", "women_35_44"]
                    : ["men_45_64", "women_45_64", "men_65+", "women_65+"];
                const ageGroupVotes = ageRanges.reduce((sum, range) => sum + data.AG[range], 0);
                return ageGroupVotes / data.total_voturi;
            }
        }
        return opacity;
    }
    function onEachFeaturePresence(feature, layer) {
        const { properties: lProp } = feature;
        const lData = lProp.data;

        if (lData.percentage === 0) return;

        const hourly = generateHourlyGraph(lData);
        const ageGraph = generateAgeGraph(lData);

        let popupContent = generatePopupContent(lProp, lData, hourly, ageGraph);

        const popup = L.popup({ maxWidth: 700, maxHeight: 800 }).setContent(popupContent);
        layer.bindPopup(popup);

        layer.on('mousemove', (e) => handleMouseMove(e, lProp, lData, layer));
    }



    function generateAgeGraph(lData) {
        if (!lData["AG"]) return '';

        const groupedData = Object.entries(lData["AG"]).reduce((acc, [key, value]) => {
            const [gender, ...ageRange] = key.split('_');
            const ageGroup = ageRange.join('-');
            acc[ageGroup] = acc[ageGroup] || { men: 0, women: 0 };
            acc[ageGroup][gender] += value;
            return acc;
        }, {});

        const maxTotalVotes = Math.max(...Object.values(groupedData).map(group => group.men + group.women));

        return `
            <h3>Varsta</h3>
            <ul class="graphBar ageGroup">
                ${Object.entries(groupedData).map(([ageGroup, { men, women }]) => `
                    <li>
                        <div class="bars">
                            <div class="bar totalVotes" data-tooltip="Total: ${(men + women).toLocaleString()}" style="height: ${(men + women) / maxTotalVotes * 100}px"></div>
                            <div class="bar listaPermanenta" data-tooltip="Barbati: ${men.toLocaleString()}" style="height: ${men / maxTotalVotes * 100}px"></div>
                            <div class="bar listaSuplimentara" data-tooltip="Femei: ${women.toLocaleString()}" style="height: ${women / maxTotalVotes * 100}px"></div>
                        </div>
                        <div class="time">${ageGroup}</div>
                    </li>
                `).join('')}
            </ul>`;
    }

    function generatePopupContent(lProp, lData, hourly, ageGraph) {
        if (["SR", "CO"].includes(lProp.county)) {
            return `
                <div class="${lProp.county}">
                    <h1>${window._w.countries[lProp.name] ?? lProp.name}</h1>
                    <h3>Total voturi: ${lData.total_voturi.toLocaleString()}</h3>
                    <hr>
                    ${hourly}${ageGraph}
                </div>`;
        }

        return `
            <div class="${lProp.county}">
                <h1>${lProp.county}: ${lProp.name}</h1>
                <h3>Numar Votanti: ${lData.total_votanti.toLocaleString()}</h3>
                <h3>Total voturi: ${lData.total_voturi.toLocaleString()}</h3>
                <p>
                    <span>Lista Permanenta: ${lData.lista_permanenta.toLocaleString()} - ${((lData.lista_permanenta / lData.total_voturi) * 100).toFixed(2)}%</span><br>
                    <span>Lista Suplimentara: ${lData.lista_suplimentara.toLocaleString()} - ${((lData.lista_suplimentara / lData.total_voturi) * 100).toFixed(2)}%</span><br>
                    <span>Urna mobila: ${lData.urna_mobila?.toLocaleString()} - ${(((lData.urna_mobila ?? 0) / lData.total_voturi) * 100).toFixed(2)}%</span>
                </p>
                <hr>
                <h2><center>Procent: ${(lData.percentage * 100).toFixed(2)}%</center></h2>
                ${hourly}${ageGraph}
            </div>`;
    }

    function handleMouseMove(e, lProp, lData, layer) {
        const mouse = { x: e.originalEvent.clientX, y: e.originalEvent.clientY };
        const popup = document.querySelector('#popupX');
        const textLength = popup.getBoundingClientRect().width || popup.textContent.length * 10 + 10;

        popup.innerHTML = ["SR", "CO"].includes(lProp.county)
            ? `${window._w.countries[lProp.name] ?? lProp.name}`
            : `${lProp.county}: ${lProp.name} ${parseInt(lData.percentage * 100)}%`;

        popup.style.left = `${mouse.x + textLength > window.innerWidth ? mouse.x - textLength : mouse.x}px`;
        popup.style.top = `${mouse.y - 5}px`;
        popup.style.display = "block";

        layer.on('mouseout click', () => {
            popup.style.display = "none";
        });
    }
}
function generateHourlyGraph(lData) {
    if (!lData["8"]) return '';

    const hourlyData = [];
    const maxTV = Object.keys(lData).reduce((max, hour) => {
        if (hour >= 8 && hour < 22) {
            const prevHour = lData[hour - 1] || [0, 0, 0, 0];
            const currentHour = lData[hour];
            hourlyData.push({
                TV: currentHour[1] - prevHour[1],
                LP: currentHour[2] - prevHour[2],
                LS: currentHour[3] - prevHour[3],
                hour
            });
            return Math.max(max, currentHour[1] - prevHour[1]);
        }
        return max;
    }, 0);

    for (let i = 0; i < 21 - hourlyData.length; i++) {
        hourlyData.push({ TV: 0, LP: 0, LS: 0, hour: hourlyData.length + 8 });
    }

    return `
        <ul class="graphBar perHour">
            ${hourlyData.map(data => `
                <li>
                    <div class="bars">
                        <div class="bar totalVotes" data-tooltip="Total: ${data.TV.toLocaleString()}" style="height: ${(data.TV / maxTV) * 100}%"></div>
                        ${data.LP ? `<div class="bar listaPermanenta" data-tooltip="L. Permanenta: ${data.LP.toLocaleString()}" style="height: ${(data.LP / maxTV) * 100}%"></div>` : ""}
                        ${data.LS && data.LS !== data.TV ? `<div class="bar listaSuplimentara" data-tooltip="L. Suplimentara: ${data.LS.toLocaleString()}" style="height: ${(data.LS / maxTV) * 100}%"></div>` : ""}
                    </div>
                    <div class="time">${data.hour.toString().padStart(2, '0')}</div>
                </li>
            `).join('')}
        </ul>`;
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
    const elInfo = document.querySelector('#elInfo');
    elInfo.innerHTML = "<div id='prezentaTotala'></div><div id='table' class='prezentaTable'></div>";
    document.querySelector('#sortType')?.remove();

    const totalVoturi = Object.values(window._w.countyStats).reduce((sum, county) => sum + county.voturi, 0);
    const totalVotanti = Object.values(window._w.countyStats).reduce((sum, county) => sum + county.votanti, 0);
    const totalPercentage = totalVoturi / totalVotanti;

    const dataAlegeri = getElectionDate();
    document.querySelector('#prezentaTotala').innerHTML = `
        <p>
            <center><span class="">${dataAlegeri}</span></center><br>
            Prezenta ${(totalPercentage * 100).toFixed(2)}%<br>
            <span class="small">${totalVoturi.toLocaleString()} voturi din ${totalVotanti.toLocaleString()}</span>
        </p>
        ${generateHourlyGraph(window._w.hourly)}
        <div class="custom-select">
            <select id="factorSelect" onchange="changeFactor()">
                ${getFactorOptions()}
            </select>
        </div>
        <hr>`;

    if (window._w.factor) document.querySelector('#factorSelect').value = window._w.factor;

    const table = document.querySelector('#table');
    const results = selectedCounty ?
        sortByValues(window._w.countyPopulation[selectedCounty], 'percentage', 'voturi') :
        sortByValues(window._w.countyStats, 'percentage', 'voturi');

    if (selectedCounty) {
        table.innerHTML += `<div onclick="makeTable()">
            <p><span class="big">Inapoi</span></p>
            <p class="small">${window._w.countiesName[selectedCounty] ?? selectedCounty}</p>
        </div>`;
    }

    renderTableContent(table, results, selectedCounty);

    if (selectedCounty) {
        table.innerHTML += `<div onclick="makeTable()"><p><span class="big">Inapoi</span></p>`;
    }
}

function getElectionDate() {
    try {
        const regex = window._w.prezenta[window._w.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/);
        const [year, month, day] = [Number(regex[3]), Number(regex[2]) - 1, Number(regex[1])];
        const date = new Date(year, month, day);
        const now = new Date();
        const monthName = new Intl.DateTimeFormat('en-US', { month: 'long' }).format(date);
        let dataAlegeri = `${regex[1]} ${monthName} ${regex[3]}`;
        if (day === now.getDate() && month === now.getMonth()) {
            dataAlegeri += ` Ora ${now.getHours()}`;
        }
        return dataAlegeri;
    } catch (e) {
        console.log(e);
        return "";
    }
}

function getFactorOptions() {
    const options = [
        { value: "", text: "Prezenta" },
        { value: "exponential", text: "Exponential" },
        { value: "suplimentara", text: "Lista Suplimentara" },
        { value: "permanenta", text: "Lista Permanenta" },
        { value: "tineri", text: "Tineri 18-44" },
        { value: "batrani", text: "Varstnici 45+" },
        { value: "varsta18_24", text: "Varsta 18-24" },
        { value: "varsta25_34", text: "Varsta 25-34" },
        { value: "varsta35_44", text: "Varsta 35-44" },
        { value: "varsta45_64", text: "Varsta 45-64" },
        { value: "varsta65+", text: "Varsta 65+" }
    ];
    return options.map(option => `<option value="${option.value}">${option.text}</option>`).join('');
}

function renderTableContent(table, results, selectedCounty) {
    results.forEach(county => {
        if (["SR", "CO"].includes(county.name)) {
            table.innerHTML += `
                <div class="tCounty" onclick="makeTable('${county.code}')">
                    <p><span class="big">${county.name === "SR" ? "Strainatate" : "Corespondenta"}</span></p>
                    <p class="small">${county.voturi.toLocaleString()} Voturi</p>
                </div>`;
        } else {
            if (selectedCounty === "SR") {
                table.innerHTML += `
                    <div class="tCounty">
                        <p><span class="big">${window._w.countries[county.name] ?? county.name}</span></p>
                        <p class="small">${county.voturi.toLocaleString()} Voturi</p>
                    </div>`;
            } else {
                table.innerHTML += `
                <div class="tCounty" ${!selectedCounty ? `onclick="makeTable('${county.code}')"` : ""}>
                    <p ${county.name.length>15 ? `data-tooltip="${county.name}"`:""}><span class="big" >${county.name}</span></p>
                    <p class="small">${(county.percentage * 100).toFixed(2)}% Prezenta<br> 
                    ${county.voturi.toLocaleString()} / ${county.votanti.toLocaleString()}</p>
                </div>`;
            }
        }
    });
}