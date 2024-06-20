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

    if (!window.hasOwnProperty('rezultateAlegeri')) window.rezultateAlegeri = {};
    if (Object.keys(window.rezultateAlegeri).length > 0) return window.rezultateAlegeri;

    for (const alegeri of Object.values(window.alegeri)) {
        if (alegeri == "primariNoi") continue;
        window.rezultateAlegeri[alegeri] = await (await fetch(`data/alegeri/rezultate_${alegeri}.json`)).json();
        window.countyPopulation = await (await fetch('data/map/county_population.json')).json();
    }
    return window.rezultateAlegeri;
}
async function loadUAT(hash) {
    let [countyName, UAT] = hash.split('++');
    UAT = decodeURIComponent(UAT);
    county = window.countiesCodes[countyName];
    document.querySelector('#loading').style.display = "flex";
    await loadData();
    let data = {};
    for (const alegeri of Object.entries(window.rezultateAlegeri)) {
        try {
            let votes = alegeri[1][county][UAT].votes;
            data[alegeri[0]] = {};
            data[alegeri[0]].votes = sortByValues(votes, 'votes');
            data[alegeri[0]].totalVoturi = data[alegeri[0]].votes.reduce((a, b) => a+b.votes, 0);
            if (window.countyPopulation?.[county]?.hasOwnProperty(UAT)) data[alegeri[0]].population = window.countyPopulation[county][UAT];
            data[alegeri[0]].votes = data[alegeri[0]].votes.map(v => {
                v.percentage = (v.votes / data[alegeri[0]].totalVoturi * 100).toFixed(2);
                v.procent = v.votes / data[alegeri[0]].totalVoturi;
                return v;
            });
        } catch (e) { console.log(e); }
    }
    let alg = Object.keys(data);
    alg.reverse();
    for(const alegeri of alg) {
        let numeAlegeri = Object.entries(window.alegeri).find(x => x[1] == alegeri)[0];
        let info = data[alegeri];
        let html = ``;

        html += `<div class="card">
        <div class="card-header">${numeAlegeri}</div><div class="card-body">
        <div class="close" onclick="closeThis(event)">X</div>
        `;
        html += `<div class="card-text">`;
        let popupContent = '';
        try {
    
            popupContent = `
    <h3>Castigator: ${info?.votes[0].name ?? 'N/A'}</h3>
    <h3>Partid: ${info?.votes[0].party ?? 'N/A'}</h3>
    <h3>Populatie: ${info?.population?.toLocaleString() ?? 'N/A'}</h3>
    <h3>Total voturi: ${info?.totalVoturi.toLocaleString() ?? 'N/A'} - ${(((info?.totalVoturi ?? 1) / (info?.population ?? 1)) * 100).toLocaleString()}%</h3>
    ${info.hasOwnProperty('fostPrimar') ? `<h3>Fost primar: ${info.fostPrimar}</h3>` : ''}
    <div class="votes">`;
        } catch (e) {
            console.log(feature.properties, e);
        }
        for (let votes of info.votes) {
            let fillColor = getPartyColor(votes.party);
            popupContent += `
            <p >
            <span class="bar" style=""><b style="width:${votes.percentage}%"></b></span>
            <span class="color" style="background-color:${fillColor}"></span>
            ${votes.party == votes.name ?
                    `<span class="nume">${votes.party}<br>${votes.votes?.toLocaleString()} Voturi - ${votes.percentage}% (${(votes.votes / (info?.population ?? 1) * 100).toFixed(2)}%)</span>` :
                    `<span class="nume">${votes.party}<br>${votes.name}: ${votes.votes?.toLocaleString()} - ${votes.percentage}% (${(votes.votes / (info?.population ?? 1) * 100).toFixed(2)}%)</span>`}
            
            </p>`
        }
        // popupContent += JSON.stringify(feature.properties.info);
        popupContent += '</div>';
        html +=popupContent;
        html += `</div></div></div>`

        document.querySelector('#content').insertAdjacentHTML('beforeend', `<div class="col">${html}</div>`);
    }
    document.querySelector('#content').insertAdjacentHTML('beforeBegin', `<h1>${countyName}: ${UAT}</h1>`);
    document.querySelector('#loading').style.display = "none";
}
