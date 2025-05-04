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

    map.closePopup();

    let done = false;
    featureGroup.eachLayer(layer => {
        if (done) return;
        done = true;
        if (layer.setStyle) {
            layer.setStyle(processCounty);
            for (const subLayer of Object.values(layer._layers)) {

                subLayer.unbindPopup();
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
            if (alegeri.includes("locale") || name === "ROU") {
            fillOpacity = 0;
            weight = 0.0;
            }
        }

        // if (county === "CO" && window._w.alegeriSelected === "Prezidentiale Tur 1 2024") {
        if (county === "CO") {
            countyCode = "CORESPONDENTA";
            // fillOpacity = 0;
            // weight = 0.0;
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
            fillOpacity = weight = 0;
        }
        if (fillColor === "#333333" && county === "CO") {
            fillOpacity = weight = 0;
        }
        return {
            fillColor,
            weight,
            color: borderColor,
            fillOpacity
        };

        function processCountyInfo() {
            const countyVotes = data[countyCode][name].votes;

            // Populate missing party and name fields
            Object.keys(countyVotes).forEach(key => {
                if (!countyVotes[key].name) {
                    countyVotes[key].party = key;
                    countyVotes[key].name = key;
                }
            });

            // Sort votes by count
            const sortedVotes = sortByValues(countyVotes, 'votes') || [];

            // Determine the index based on toggleLocul2
            const index = (sortedVotes.length > 1 && document.querySelector('#toggleLocul2').checked) ? 1 : 0;

            // Set fill color
            fillColor = getPartyColor(sortedVotes[index]?.party || "#333333");

            // Update results and statsVotes
            const winningParty = sortedVotes[index]?.party || "N/A";
            window._w.results[winningParty] = window._w.results[winningParty] || { name: winningParty, UAT: 0, votes: 0 };
            window._w.results[winningParty].UAT++;

            // Update feature properties data
            const totalVotes = sortedVotes.reduce((acc, vote) => acc + vote.votes, 0);
            feature.properties.data = {
                totalVoturi: totalVotes,
                votes: sortedVotes.map(vote => ({
                    ...vote,
                    percentage: ((vote.votes / totalVotes) * 100).toFixed(2),
                    procent: vote.votes / totalVotes
                })),
                population: window._w.countyPopulation?.[countyCode]?.[name] || totalVotes
            };

            // Handle special cases
            if (data[countyCode][name].special === "MUN") weight = 0.4;

            // Update statsVotes for each party
            sortedVotes.forEach(vote => {
                const partyStats = window._w.statsVotes.judete[county][vote.party] || { name: vote.party, votes: 0, totalVotes: 0, UAT: 0 };
                partyStats.votes += vote.votes;
                window._w.statsVotes.judete[county][vote.party] = partyStats;

                const globalStats = window._w.results[vote.party] || { name: vote.party, UAT: 0, votes: 0 };
                globalStats.votes += vote.votes;
                window._w.results[vote.party] = globalStats;
            });

            // Handle case when there are no votes
            if (!feature.properties.data.votes.length) {
                feature.properties.data.votes = [{ party: "N/A", votes: 0, name: "N/A" }];
            } else {
                window._w.statsVotes.judete[county][winningParty].UAT++;
            }
        }

        function compareMayors() {
            const currentVotes = data?.[countyCode]?.[name]?.votes;
            const previousVotes = compData?.[countyCode]?.[name]?.votes;

            if (currentVotes && previousVotes) {
                const [currentWinner] = sortByValues(currentVotes, 'votes');
                const [previousWinner] = sortByValues(previousVotes, 'votes');

                if (currentWinner.name.clear() === previousWinner.name.clear()) {
                    fillOpacity = 0.1;
                } else {
                    fillOpacity = currentWinner.party === previousWinner.party ? 0.5 : fillOpacity;
                    weight = currentWinner.party === previousWinner.party ? weight : 0.7;
                    feature.properties.data.fostPrimar = `${previousWinner.name} <br><i>${previousWinner.party}</i>`;
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

    const isDiaspora = feature.properties.county === "SR";
    const data = feature.properties.data || {};
    const title = isDiaspora
        ? `Diaspora: ${window._w.countries[feature.properties.name] || 'N/A'}`
        : `<a href="uat.html#${feature.properties.county.clear()}++${feature.properties.name.clear()}" target="_blank">${feature.properties.county}: ${feature.properties.name}</a>`;

    const popupContent = generatePopupContent(title, data, isDiaspora);
    const popup = L.popup({ maxWidth: 700, maxHeight: 800 }).setContent(popupContent);

    layer.bindPopup(popup, {
        closeButton: true,
        closeOnEscapeKey: true,
        className: 'shadow1',
        autoPan: true,
    });

    setupPopupInteractions(layer, feature);
}

function generatePopupContent(title, data, isDiaspora) {
    const totalVotes = data.totalVoturi?.toLocaleString() || 'N/A';
    const population = data.population?.toLocaleString() || 'N/A';
    const votePercentage = ((data.totalVoturi / (data.population || 1)) * 100).toLocaleString();
    const winner = data.votes?.[0] || { name: 'N/A', party: 'N/A' };

    let content = `
        <h1>${title}</h1>
        <h3>Castigator: ${winner.name}</h3>
        <h3>Partid: ${winner.party}</h3>
        ${!isDiaspora ? `<h3>Populatie: ${population}</h3>` : ''}
        <h3>Voturi Totale: ${totalVotes} ${!isDiaspora ? `- ${votePercentage}%` : ''}</h3>
        ${data.fostPrimar ? `<h3>Fost primar: ${data.fostPrimar}</h3>` : ''}
        <div class="votes">
    `;

    (data.votes || []).forEach(vote => {
        content += generateVoteRow(vote, data, isDiaspora);
    });

    content += '</div>';
    return content;
}

function generateVoteRow(vote, data, isDiaspora) {
    const fillColor = getPartyColor(vote.party);
    const votePercent = vote.percentage || 0;
    const popPercent = isDiaspora ? '' : `(${((vote.votes / (data.population || 1)) * 100).toLocaleString()}%)`;
    const voteDisplay = vote.party === vote.name
        ? `${vote.party}<br>${vote.votes?.toLocaleString()} Voturi - ${votePercent}% ${popPercent}`
        : `${vote.party}<br>${vote.name}: ${vote.votes?.toLocaleString()} - ${votePercent}% ${popPercent}`;

    return `
        <p>
            <span class="bar"><b style="width:${votePercent}%"></b></span>
            <span class="color" style="background-color:${fillColor}"></span>
            <span class="nume">${voteDisplay}</span>
        </p>`;
}

function setupPopupInteractions(layer, feature) {
    const popupElement = document.querySelector('#popupX');

    const updatePopupPosition = ({ originalEvent: { pageX, pageY } }) => {
        popupElement.style.transform = `translate(${pageX}px, ${pageY}px)`;
        popupElement.style.display = 'block';
        popupElement.textContent = `${feature.properties.county}: ${feature.properties.name}`;
    };

    const hidePopup = () => {
        popupElement.style.display = 'none';
    };

    layer.on('mousemove', updatePopupPosition);
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
    resetTableUI();

    const electionDateString = getElectionDateString();
    if (electionDateString) {
        document.querySelector("#rezultate").insertAdjacentHTML("afterbegin", `<center id="electionDate"><p>${electionDateString}</p></center>`);
    }

    const results = getSortedResults(county);
    const totalVotes = results.reduce((a, b) => a + b.votes, 0);
    const totalUATs = results.reduce((a, b) => a + b.UAT, 0);

    const pentruGuven = [];
    const isParlamentary = isParliamentaryElection();
    results.slice(0, 51).forEach(party => {
        const percent = (party.votes / totalVotes * 100);

        if (percent > 5 || !isParlamentary) {
            pentruGuven.push({ name: party.name, percent, color: getPartyColor(party.name) });
        }
    });
    const rows = generateTableRows(results, totalVotes, totalUATs);

    document.querySelector("#table").innerHTML = rows;

    adjustGuvernPercentages(pentruGuven);
    insertCreateGuvern(pentruGuven);


    if (results.length === 0) {
        document.querySelector("#table").innerHTML = "<p>No results available.</p>";
    }

    populateCountiesDropdown(county);
}

function resetTableUI() {
    document.querySelector('#elInfo').innerHTML = `<div id="elInfo"><div id="table"></div></div>`;
    document.querySelector("#elInfo .custom-select")?.remove();
    document.querySelector('#cGuvern')?.remove();
    document.querySelector('#procentGuvern')?.remove();
    document.querySelector("#electionDate")?.remove();
    document.querySelector("#table").innerHTML = "";
}

function getElectionDateString() {
    try {
        const regex = window._w.isPagePresence
            ? window._w.prezenta[window._w.prezentaSelected].match(/(\d{2})(\d{2})(\d{4})/)
            : window._w.alegeri[window._w.alegeriSelected].match(/(\d{2})(\d{2})(\d{4})/);

        const monthName = new Intl.DateTimeFormat("en-US", { month: "long" }).format(new Date(Number(regex[3]), Number(regex[2]) - 1));
        return `${regex[1]} ${monthName} ${regex[3]}`;
    } catch (e) {
        console.error(e);
        return null;
    }
}

function getSortedResults(county) {
    return county === ""
        ? sortByValues(window._w.results, ...window._w.sortType)
        : sortByValues(window._w.statsVotes.judete[county], ...window._w.sortType);
}

function generateTableRows(results, totalVotes, totalUATs) {
    return results.slice(0, 51).map(party => {
        const countyPercentage = (party.UAT / totalUATs * 100).toFixed(2) + "%";
        const percent = (party.votes / totalVotes * 100);

        const difference = results.indexOf(party) < results.length - 1
            ? `+${(party.votes - results[results.indexOf(party) + 1].votes).toLocaleString()} | `
            : "";

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
}

function isParliamentaryElection() {
    return window._w.alegeriSelected.includes('Parlamentare');
}

function adjustGuvernPercentages(pentruGuven) {
    const totalPercent = pentruGuven.reduce((a, b) => a + b.percent, 0);
    const perGuv = (100 - totalPercent) / pentruGuven.length;

    pentruGuven.forEach(party => {
        party.percent += perGuv;
    });
}

function populateCountiesDropdown(selectedCounty) {
    const countiesSelectContainer = document.querySelector("#elInfo");
    countiesSelectContainer.insertAdjacentHTML("beforeend", `<div class="custom-select"><select id="countiesSelect" onchange="setTable(this.value)"><option value="">Alege Judet</option></select></div>`);

    const counties = Object.entries(window._w.statsVotes.judete).map(([countyName, county]) => ({
        name: countyName,
        UAT: Object.values(county).reduce((a, b) => a + b.UAT, 0),
        votes: Object.values(county).reduce((a, b) => a + b.votes, 0),
    })).sort((a, b) => b.votes - a.votes);

    const countiesSelect = counties.map(county => `
        <option value="${county.name}" ${county.name === selectedCounty ? "selected" : ""}>
            ${county.name === "SR" ? "Strainatate" : county.name}: ${county.votes.toLocaleString()} (${county.UAT.toLocaleString()})
        </option>
    `).join('');

    document.querySelector("#countiesSelect").innerHTML += countiesSelect;
}

const insertCreateGuvern = (pentruGuven) => {
    const makeItInteractive = isParliamentaryElection();
    document.querySelector('#cGuvern')?.remove();
    document.querySelector('#procentGuvern')?.remove();
    document.querySelector('#sortType').insertAdjacentHTML('beforebegin', `<div id="cGuvern" class="${makeItInteractive || window._w.alegeriSelected.includes("Tur 2") ? "interactive" : ""}"></div>`);
    const container = document.querySelector("#cGuvern");
    let guv = 0;
    let percentGuv = [];
    for (let i = 0; i < pentruGuven.length; i++) {
        const { name, percent, color } = pentruGuven[i];
        if (guv < 50) {
            percentGuv.push(percent);
            guv += percent;
        }
        container.innerHTML += `<p class="color shadow1" data-id="${i}" style="width: ${percent.toFixed(2)}%;background-color:${color}" data-tooltip="${percent.toFixed(2)}% : ${name}"></p>`;
    }
    container.insertAdjacentHTML('afterend',
        makeItInteractive ? `<div id="procentGuvern">${percentGuv.map(e => e.toFixed(2)).join('% + ')}% = ${guv.toFixed(2)}%</div>`
            : `<div id="procentGuvern"></div>`
    );
    if (makeItInteractive) {
        document.querySelectorAll('#cGuvern .color').forEach(el => el.addEventListener('click', (e) => {
            const idx = +e.target.dataset.id;
            if (idx !== pentruGuven.length - 1) {
                [pentruGuven[idx], pentruGuven[idx + 1]] = [pentruGuven[idx + 1], pentruGuven[idx]];
            } else {
                pentruGuven.unshift(pentruGuven.pop());
            }
            insertCreateGuvern(pentruGuven);
        }));
    }
}