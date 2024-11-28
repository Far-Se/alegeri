document.addEventListener('DOMContentLoaded', function () {
    let hash = window.location.hash.length > 1 ? window.location.hash.substring(1) : '';
    if (hash.length) loadUAT(hash);

});
function closeThis(el) {
    console.log(el.target);
    el.target.closest('.col').remove();
}
function sortByValues(obj, key, subkey = '') {
    let candidatesArray = Object.values(obj);
    candidatesArray.sort((a, b) => subkey != '' && a[key] == b[key] ? b[subkey] - a[subkey] : b[key] - a[key]);
    return candidatesArray;
}
let loadData = async () => {

    if (!window._w.hasOwnProperty('rezultateAlegeri')) window._w.rezultateAlegeri = {};
    if (Object.keys(window._w.rezultateAlegeri).length > 0) return window._w.rezultateAlegeri;

    for (const alegeri of Object.values(window._w.alegeri)) {
        if (alegeri == "primariNoi") continue;
        window._w.rezultateAlegeri[alegeri] = await (await fetch(`data/alegeri/rezultate_${alegeri}.json`)).json();
        window._w.countyPopulation = await (await fetch('data/map/county_population.json')).json();
    }
    return window._w.rezultateAlegeri;
}
async function loadUAT(hash) {
    let [countyName, UAT] = hash.split('++');
    UAT = decodeURIComponent(UAT);
    county = window._w.countiesCodes[countyName];
    document.querySelector('#loading').style.display = "flex";
    await loadData();
    let data = {};
    for (const [alegeri, info] of Object.entries(window._w.rezultateAlegeri)) {
        try {
            let votes = info[county][UAT].votes;
            if (votes[Object.keys(votes)[0]].name === "") {
                for (const key in votes) {
                    try {
                        votes[key].party = key;
                        votes[key].name = key;
                    } catch (error) {
                        // Handle error if necessary
                    }
                }
            }
            data[alegeri] = {};
            data[alegeri].votes = sortByValues(votes, 'votes');
            data[alegeri].totalVoturi = data[alegeri].votes.reduce((a, b) => a+b.votes, 0);
            if (window._w.countyPopulation?.[county]?.hasOwnProperty(UAT)) data[alegeri].population = window._w.countyPopulation[county][UAT];
            data[alegeri].votes = data[alegeri].votes.map(v => {
                v.percentage = (v.votes / data[alegeri].totalVoturi * 100).toFixed(2);
                v.procent = v.votes / data[alegeri].totalVoturi;
                return v;
            });
        } catch (e) { console.log(e); }
    }
    let alg = Object.keys(data);
    alg.reverse();
    for (const election of alg) {
        const electionName = Object.entries(window._w.alegeri).find(([_, value]) => value === election)[0];
        const electionInfo = data[election];
        let html = `
        <div class="col" draggable="true">
            <div class="card">
                <div class="card-header">${electionName}</div>
                <div class="card-body">
                    <div class="close" onclick="closeThis(event)">X</div>
                    <div class="card-text">
        `;
        let popupContent = `
            <h3>Castigator: ${electionInfo?.votes[0].name ?? 'N/A'}</h3>
            <h3>Partid: ${electionInfo?.votes[0].party ?? 'N/A'}</h3>
            <h3>Populatie: ${electionInfo?.population?.toLocaleString() ?? 'N/A'}</h3>
            <h3>Total voturi: ${electionInfo?.totalVoturi.toLocaleString() ?? 'N/A'} - ${(((electionInfo?.totalVoturi ?? 1) / (electionInfo?.population ?? 1)) * 100).toLocaleString()}%</h3>
            ${electionInfo.hasOwnProperty('fostPrimar') ? `<h3>Fost primar: ${electionInfo.fostPrimar}</h3>` : ''}
            <div class="votes">
        `;
        for (const vote of electionInfo.votes) {
            const fillColor = getPartyColor(vote.party);
            const votePercentage = (vote.votes / (electionInfo?.population ?? 1) * 100).toFixed(2);
            popupContent += `
                <p>
                    <span class="bar"><b style="width:${vote.percentage}%"></b></span>
                    <span class="color" style="background-color:${fillColor}"></span>
                    <span class="nume">${vote.party}<br>${vote.name !== vote.party ? `${vote.name}: ` : ''}${vote.votes?.toLocaleString()} Voturi - ${vote.percentage}% (${votePercentage}%)</span>
                </p>
            `;
        }
        popupContent += '</div>';
        html += popupContent;
        html += `</div></div></div></div>`;
        document.querySelector('#content').insertAdjacentHTML('beforeend', html);
    }
    document.querySelector('#content').insertAdjacentHTML('beforeBegin', `<h1>${countyName}: ${UAT}</h1>`);
    
    document.querySelector('#loading').style.display = "none";
}