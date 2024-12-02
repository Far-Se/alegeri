/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */


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

function sortByValues(obj, key, subkey = '') {
    return Object.values(obj).sort((a, b) =>
        subkey ? (a[key] !== b[key] ? b[key] - a[key] : b[subkey] - a[subkey]) : b[key] - a[key]
    );
}
let geoJSON = null;
const featureGroup = L.featureGroup();

let memFetch = (() => {
    const cache = Object.create(null);
    return async (alegeri) => cache[alegeri] || (cache[alegeri] = (await fetch(`data/alegeri/rezultate_${alegeri}.json`)).json());
})();
window._w.statsVotes = [];
window._w.statsVotes.uat = [];
window._w.processedAreas = [];
const getCommunes = async () => {
    if (window._w.commune) return;
    const promises = [
        fetch('data/map/county_population.json').then(r => r.json()),
        fetch('data/map/comune.geojson').then(r => r.json()),
        fetch('data/map/ro_judete_polilinie.json').then(r => r.json()),
    ];
    const [countyPopulation, commune, countyOutline] = await Promise.all(promises);
    window._w.countyPopulation = countyPopulation;
    window._w.countyOutline = countyOutline;
    window._w.commune = commune;
}
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
    } catch (error) {
        console.error('Error:', error);
        document.querySelector('#loading').style.display = "none";
        document.querySelector('#table').innerHTML = 'Inca nu exista date!';
        return;
    }

    if (!geoJSON) {
        await getCommunes();
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

    let compData = [];
    if (comparaPrimari2020) compData = await memFetch("locale27092020P");

    let done = false;
    featureGroup.eachLayer(layer => {
        if (done) return;
        done = true;
        if (layer.setStyle) {
            layer.setStyle(processCounty);
            for (const subLayer of Object.values(layer._layers)) {
                onEachFeatureResults(subLayer.feature, subLayer);
            }
        }
    });
    function processCounty(feature) {
        const county = feature.properties.county.clear();
        const name = feature.properties.name.clear();
        let countyCode = window._w.countiesCodes[county];

        let fillColor = "#333333";
        let weight = 0.3;
        let borderColor = "#000000";
        let fillOpacity = document.querySelector('#slider').value / 100;

        if (county === "SR") {
            countyCode = county;
            if (alegeri.includes("locale")) {
                fillOpacity = 0;
                weight = 0.0;
            }
            if (name === "ROU") {
                fillOpacity = 0;
                weight = 0.0;
            }
        }

        if (county === "CO" && window._w.alegeriSelected === "Prezidentiale Tur 1 2024") {
            countyCode = "CORESPONDENTA";
        } else if (county === "CO") {
            fillOpacity = 0;
            weight = 0.0;
        }

        if (!Object.prototype.hasOwnProperty.call(window._w.statsVotes.judete, county)) window._w.statsVotes.judete[county] = {};

        if (Object.prototype.hasOwnProperty.call(data, countyCode) && Object.prototype.hasOwnProperty.call(data[countyCode], name)) processCountyInfo();
        else {
            feature.properties.data = { ...emptyData };
        }

        window._w.processedAreas.push(`${countyCode}-${name}`);

        if (window._w.partideAlese.length !== 0) processSelectedParties();
        if (comparaPrimari2020) compareMayors();

        if (fillColor === "#333333" && county === "SR") {
            fillOpacity = 0;
            weight = 0;
        }
        return {
            fillColor,
            weight,
            color: borderColor,
            fillOpacity
        };

        function processCountyInfo() {
            const countyVotes = data[countyCode][name].votes;

            // Populate party and name if empty
            if (countyVotes[Object.keys(countyVotes)[0]].name === "") {
                for (const key in countyVotes) {
                    try {
                        countyVotes[key].party = key;
                        countyVotes[key].name = key;
                    } catch (_error) {
                        // Handle error if necessary
                    }
                }
            }

            // Sort votes by vote count
            let sortedVotes = [];
            try {
                sortedVotes = sortByValues(countyVotes, 'votes');
            } catch (error) {
                console.error(`Error processing votes for ${countyCode} - ${name}:`, error);
            }

            // Determine the index based on toggleLocul2
            let index = 0;
            if (sortedVotes.length > 1 && document.querySelector('#toggleLocul2').checked) {
                index = 1;
            }

            // Set fill color
            fillColor = getPartyColor(sortedVotes[index].party);

            // Update results and statsVotes
            if (!Object.prototype.hasOwnProperty.call(window._w.results, sortedVotes[index].party)) {
                window._w.results[sortedVotes[index].party] = { name: sortedVotes[index].party, UAT: 0, votes: 0 };
            }
            window._w.results[sortedVotes[index].party].UAT++;

            // Update feature properties data
            feature.properties.data = {
                totalVoturi: sortedVotes.reduce((acc, vote) => acc + vote.votes, 0),
            };

            window._w.statsVotes.uat.push({
                name,
                county,
                votes: feature.properties.data.totalVoturi,
                candidates: sortedVotes.length,
                population: window._w.countyPopulation?.[countyCode]?.[name] ?? feature.properties.data.totalVoturi
            });

            // Update percentages for each vote
            feature.properties.data.votes = sortedVotes.map(vote => {
                vote.percentage = (vote.votes / feature.properties.data.totalVoturi * 100).toFixed(2);
                vote.procent = vote.votes / feature.properties.data.totalVoturi;
                return vote;
            });

            // Update special cases and population data
            if (data[countyCode][name].special === "MUN") {
                weight = 0.4;
            }
            feature.properties.data.population = window._w.countyPopulation?.[countyCode]?.[name] ?? feature.properties.data.totalVoturi;

            // Update statsVotes and results for each party
            for (const vote of sortedVotes) {
                if (!Object.prototype.hasOwnProperty.call(window._w.statsVotes.judete[county], vote.party)) {
                    window._w.statsVotes.judete[county][vote.party] = { name: vote.party, votes: 0, totalVotes: 0, UAT: 0 };
                }
                window._w.statsVotes.judete[county][vote.party].votes += vote.votes;

                if (!Object.prototype.hasOwnProperty.call(window._w.results, vote.party)) {
                    window._w.results[vote.party] = { name: vote.party, UAT: 0, votes: 0 };
                }
                window._w.results[vote.party].votes += vote.votes;
            }

            // Handle case when there are no votes
            if (feature.properties.data.votes.length === 0) {
                feature.properties.data.votes = [{ party: "N/A", votes: 0, name: "N/A" }];
            } else {
                window._w.statsVotes.judete[county][sortedVotes[index].party].UAT++;
            }
        }

        function compareMayors() {
            if (data?.[countyCode]?.[name]?.votes && compData?.[countyCode]?.[name]?.votes) {
                const [firstVote, ...otherVotes] = sortByValues(data[countyCode][name].votes, 'votes');
                const [firstCompVote, ...otherCompVotes] = sortByValues(compData[countyCode][name].votes, 'votes');

                if (firstVote.name.clear() == firstCompVote.name.clear()) {
                    fillOpacity = 0.1;
                } else {
                    if (firstVote.party == firstCompVote.party) fillOpacity = 0.5;
                    else
                        weight = 0.7;
                    feature.properties.data.fostPrimar = `${firstCompVote.name} <br><i>${firstCompVote.party}</i>`;
                }
            }
        }

        function processSelectedParties() {
            const selectedParties = window._w.partideAlese;
            const votes = feature.properties.data.votes;
            const isLocul2Checked = document.querySelector('#toggleLocul2').checked;
            const isPrezentaProcentChecked = document.querySelector('#prezentaProcent').checked;
            let voteIndex = (votes.length > 1 && isLocul2Checked) ? 1 : 0;

            if (selectedParties.length === 1) {
                const selectedParty = selectedParties[0];
                fillOpacity = selectedParties.includes(votes[voteIndex].party) ? 1.0 : 0.0;
                if (isPrezentaProcentChecked) {
                    const partyVote = votes.find(vote => vote.party === selectedParty);
                    fillOpacity = partyVote ? partyVote.procent * 2 : 0;
                }
                fillColor = getPartyColor(selectedParty);
            } else if (selectedParties.length === 2 && votes.some(vote => selectedParties.includes(vote.party))) {
                fillOpacity = 1.0;
                fillColor = getPartyColor(votes.find(vote => selectedParties.includes(vote.party)).party);
            }
        }
    }



    document.querySelector('#loading').style.display = "none";
    setTable();
}

function onEachFeatureResults(feature, layer) {
    if (layer.options?.fillOpacity === 0) return;
    const isSR = feature.properties.county == "SR";

    const data = feature.properties.data;
    const title = isSR
        ? `Diaspora: ${window._w.countries[feature.properties.name]}`
        : `<a href="uat.html#${feature.properties.county.clear()}++${feature.properties.name.clear()}" target="_blank">${feature.properties.county}: ${feature.properties.name}</a>`;

    const totalVoturiFormat = data?.totalVoturi.toLocaleString() ?? 'N/A';
    const procentPopulatie = (data?.totalVoturi / (data?.population ?? 1) * 100).toLocaleString();
    let popupContent = [
        `<h1>${title}</h1>`,
        `<h3>Castigator: ${data?.votes[0].name ?? 'N/A'}</h3>`,
        `<h3>Partid: ${data?.votes[0].party ?? 'N/A'}</h3>`,
        !isSR ? (`<h3>Populatie: ${data?.population?.toLocaleString() ?? 'N/A'}</h3>`) : "",
        `<h3>Voturi Totale: ${totalVoturiFormat} ${!isSR ? `- ${procentPopulatie}%` : ''}</h3>`,
        data['fostPrimar'] ? `<h3>Fost primar: ${data.fostPrimar}</h3>` : '',
        `<div class="votes">`
    ].join('');

    for (const vote of data.votes) {
        const fillColor = getPartyColor(vote.party);
        const votePercentage = vote.percentage;
        const perTotalPopPercent = isSR ? '' : `(${(vote.votes / (data?.population ?? 1) * 100).toLocaleString()}%)`;
        const voteDisplay = vote.party === vote.name
            ? `${vote.party}<br>${vote.votes?.toLocaleString()} Voturi - ${votePercentage}% ${perTotalPopPercent}`
            : `${vote.party}<br>${vote.name}: ${vote.votes?.toLocaleString()} - ${votePercentage}% ${perTotalPopPercent}`;

        popupContent += `
            <p>
                <span class="bar"><b style="width:${votePercentage}%"></b></span>
                <span class="color" style="background-color:${fillColor}"></span>
                <span class="nume">${voteDisplay}</span>
            </p>`;
    }
    popupContent += '</div>';
    const popup = L.popup({ maxWidth: 700, maxHeight: 800 }).setContent(popupContent);
    layer.bindPopup(popup, {
        closeButton: true,
        closeOnEscapeKey: true,
        className: 'shadow1',
        autoPan: true,
    });

    const popupElement = document.querySelector('#popupX');

    layer.on('mousemove', ({ originalEvent: { pageX, pageY } }) => {
        popupElement.style.transform = `translate(${pageX}px, ${pageY}px)`;
        popupElement.style.display = 'block';
        popupElement.textContent = `${feature.properties.county}: ${feature.properties.name}`;
    });

    const hidePopup = () => popupElement.style.display = 'none';
    layer.on('mouseout', hidePopup);
    layer.on('click', hidePopup);
}

/**
 * Clip a string to a maximum number of characters.
 * If the string is shorter than the specified length, it is returned unchanged.
 * If the string is longer than the specified length, it is truncated and an ellipsis is appended.
 * @param {number} n - The maximum number of characters to return.
 * @returns {string} The clipped string.
 */
String.prototype.clip = function (n) {
    return this.length < n ? this : this.substring(0, n - 3) + '...';
};

/**
 * Populates the table with data from the selected county or all counties if county is not specified.
 * @param {string} [county] - The code of the county to display results for.
 */
function setTable(county = "") {
    document.querySelector('#elInfo').innerHTML = `<div id="elInfo"><div id="table"></div></div>`;
    const tableContainer = document.querySelector("#table");
    const electionDateContainer = document.querySelector("#electionDate");
    const electionDate = document.querySelector("#rezultate");

    document.querySelector("#elInfo .custom-select")?.remove();
    tableContainer.innerHTML = "";
    electionDateContainer?.remove();

    try {
        const regex = window._w.prezenta[window._w.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/);
        const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(Number(regex[3]), Number(regex[2]) - 1));
        const electionDateString = `${regex[1]} ${monthName} ${regex[3]}`;
        electionDate.insertAdjacentHTML("afterbegin", `<center id="electionDate"><p class="">${electionDateString}</p></center>`);
    } catch (e) {
        console.log(e);
    }

    const results = county === "" ? sortByValues(window._w.results, ...window._w.sortType) : sortByValues(window._w.statsVotes.judete[county], ...window._w.sortType);
    const totalVotes = results.reduce((a, b) => a + b.votes, 0);
    const totalUATs = results.reduce((a, b) => a + b.UAT, 0);

    const pentruGuven = [];
    const rows = results.slice(0, 51).map(party => {
        const countyPercentage = (party.UAT / totalUATs * 100).toFixed(2) + "%";
        const percent = (party.votes / totalVotes * 100);
        if (percent > 5) pentruGuven.push({ name: party.name, percent: percent, color: getPartyColor(party.name) });
        const difference = results.indexOf(party) < results.length - 1 ? `+${(party.votes - results[results.indexOf(party) + 1].votes).toLocaleString()} | ` : "";
        const checked = window._w.partideAlese.includes(party.name) ? "checked" : "";
        const disabled = !window._w.partideAlese.includes(party.name) && window._w.partideAlese.length >= 2 ? "disabled" : "";

        return `
            <div>
                <p class="color shadow1" style="background-color:${getPartyColor(party.name)}">
                    <input class="iparty" onclick="selectParty('${party.name}')" type="checkbox" value="${party.name}" ${checked} ${disabled}>
                </p>
                <p>
                    <span><abbr title="${party.name}">${party.name.clip(27)}</abbr></span>
                    <span class="small">${party.votes.toLocaleString()} Voturi - ${percent.toFixed(2)}%</span>
                    <span class="small">${difference}${party.UAT.toLocaleString()} UAT - ${countyPercentage}</span>
                </p>
            </div>
        `;
    }).join('');

    tableContainer.innerHTML = rows;

    if (window._w.alegeriSelected.includes('Parlamentare')) {
        let totalPercent = pentruGuven.map(e=>e.percent).reduce((a,b)=>a+b,0);
        let perGuv = (100 - totalPercent) / pentruGuven.length;
        for (let i = 0; i < pentruGuven.length; i++) {
            pentruGuven[i].percent += perGuv;
        }
        insertCreateGuvern(pentruGuven);
    }

    const countiesSelectContainer = document.querySelector("#elInfo");
    countiesSelectContainer.insertAdjacentHTML("beforeend", `<div class="custom-select"><select id="countiesSelect" onchange="setTable(this.value)"><option value="">Alege Judet</option></select></div>`);

    const counties = Object.entries(window._w.statsVotes.judete).map(([countyName, county]) => ({
        name: countyName,
        UAT: Object.values(county).reduce((a, b) => a + b.UAT, 0),
        votes: Object.values(county).reduce((a, b) => a + b.votes, 0),
    })).sort((a, b) => b.votes - a.votes);

    const countiesSelect = counties.map(countySelect => `
        <option value="${countySelect.name}" ${countySelect.name === county ? "selected" : ""}>
            ${countySelect.name === "SR" ? "Strainatate" : countySelect.name}: ${countySelect.votes.toLocaleString()} (${countySelect.UAT.toLocaleString()})
        </option>
    `).join('');
    document.querySelector("#countiesSelect").innerHTML += countiesSelect;
}

const insertCreateGuvern = (pentruGuven) => {
    document.querySelector('#cGuvern')?.remove();
    document.querySelector('#procentGuvern')?.remove();
    document.querySelector('#sortType').insertAdjacentHTML('beforebegin', `<div id="cGuvern"></div>`);
    const container = document.querySelector("#cGuvern");
    let guv = 0;
    let percentGuv = [];
    for (let i = 0; i < pentruGuven.length; i++) {
        const { name, percent, color } = pentruGuven[i];
        if(guv <50)
        {
            percentGuv.push(percent);
            guv += percent;
        }
        container.innerHTML += `<p class="color shadow1" data-id="${i}" style="width: ${percent.toFixed(2)}%;background-color:${color}" data-tooltip="${percent.toFixed(2)}% : ${name}"></p>`;
    }
    container.insertAdjacentHTML('afterend',
        `<div id="procentGuvern">${percentGuv.map(e=>e.toFixed(2)).join('% + ')}% = ${guv.toFixed(2)}%</div>`
    );
    document.querySelectorAll('#cGuvern .color').forEach(el => el.addEventListener('click', (e) => {
        const idx = +e.target.dataset.id;
        if (idx !== pentruGuven.length-1) {
            [pentruGuven[idx], pentruGuven[idx + 1]] = [pentruGuven[idx + 1], pentruGuven[idx]];
        } else {
            pentruGuven.unshift(pentruGuven.pop());
        }
        insertCreateGuvern(pentruGuven);
    }));
}