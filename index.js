

window.alegeriSelected = "Primari 2024";
window.prezentaSelected = "locale2024";
window.isPagePresence = false;

let processHash = () =>{
    let hash = window.location.hash.substring(1);
    hash = decodeURIComponent(hash);
    if (hash.includes('prezenta-')) {
        hash = hash.replace('prezenta-', '');
        if(!window.prezenta.hasOwnProperty(hash))return;

        window.prezentaSelected = hash;
        window.isPagePresence = true;
        document.querySelector(`#prezenta option[value="${window.prezentaSelected}"]`).setAttribute("selected",true);
        return;
    }
    
    if(!window.alegeri.hasOwnProperty(hash))return;
    window.alegeriSelected = hash;
    window.isPagePresence = false;
    document.querySelector(`#alegeri option[value="${window.alegeriSelected}"]`).setAttribute("selected",true);
}
window.partideAlese = [];
//on document ready
document.addEventListener('DOMContentLoaded', function () {
    for (const alegeri of Object.keys(window.alegeri)) {
        document.querySelector('#alegeri').insertAdjacentHTML('beforeend',`<option value="${alegeri}" ${alegeri === window.alegeriSelected ? 'selected' : ''}>${alegeri.charAt(0).toUpperCase() + alegeri.slice(1).replace(/([a-z])([0-9])/g, '$1 $2')}</option>`);
    }         
    for (const alegeri of Object.keys(window.prezenta)) {
        document.querySelector('#prezenta').insertAdjacentHTML('beforeend',`<option value="${alegeri}" ${alegeri === window.prezentaSelected ? 'selected' : ''}>${alegeri.charAt(0).toUpperCase() + alegeri.slice(1).replace(/([a-z])([0-9])/g, '$1 $2')}</option>`);
    }  
       for (const mapType of mapTiles) {
        document.querySelector('#mapLayers').insertAdjacentHTML('beforeend',`<option value="${mapType.name}"> ${mapType.name}</option>`);
    }       

    if (window.location.hash.length > 1) processHash(); 
    loadData();
    document.querySelector('#mapLayers').addEventListener('change', function (e) {
        let value = e.target.value;
        let index = mapTiles.findIndex(t => t.name == value);
        if(!~index)return;
        mapTile.removeFrom(map);
        mapTile = L.tileLayer(mapTiles[index].url, {
            maxZoom: 18,
            attribution: '&copy;',
            id: 'cartoDB/dark-v9',
            tileSize: 512,
            zoomOffset: -1
        });
        mapTile.addTo(map);
    });
    document.querySelector('#alegeri').addEventListener('change', function (e) {

        window.partideAlese = [];
        window.alegeriSelected = e.target.value;
        loadData();
    })
    document.querySelector('#prezenta').addEventListener('change', function (e) {
        window.partideAlese = [];
        window.prezentaSelected = e.target.value;
        loadData();
    })

    document.querySelector('#collapse').addEventListener('click', () => {
        document.querySelector('.controls')?.classList.toggle('collapsed');
        document.querySelector('#unCollapse')?.classList.toggle('collapsed');
    });
    document.querySelector('#unCollapse').addEventListener('click', () => {
        document.querySelector('.controls')?.classList.toggle('collapsed');
        document.querySelector('#unCollapse')?.classList.toggle('collapsed');
    });

    document.querySelector('#toggleAlegeri').addEventListener('change', function (e) {
        document.querySelector('#elInfo').innerHTML = '';
        window.partideAlese = [];
        document.querySelector('#rezultate')?.classList.toggle('toggle');
        isPagePresence = !isPagePresence;
        document.querySelector('#prezenta').style.display = isPagePresence ? 'block' : 'none';
        document.querySelector('#alegeri').style.display = !isPagePresence ? 'block' : 'none';
        loadData();
    })
    document.querySelector('#toggleLocul2').addEventListener('change', function (e) {
        loadData()
    })
    document.querySelector('#prezentaProcent').addEventListener('change', function (e) {
        loadData()
    })
    //generate code when slider is unfocused
    document.querySelector('#slider').addEventListener('change', function (e) {
        loadData()
    })

});
let loadData = () => {
    if (window.isPagePresence) {
        loadPresence(window.prezenta[window.prezentaSelected]);
        window.location.hash = `prezenta-${window.prezentaSelected}`;
    } else {
        document.querySelector('#toggleAlegeri').checked = true;
        window.location.hash = window.alegeriSelected;
        loadResults(window.alegeri[window.alegeriSelected]);
    }
    document.querySelector('#prezenta').style.display = isPagePresence ? 'block' : 'none';
    document.querySelector('#alegeri').style.display = !isPagePresence ? 'block' : 'none';
}
function selectParty(party) {
    let checked = document.querySelectorAll('input.iparty:checked');
    window.partideAlese = [...checked].map(el => el.value);
    if (window.partideAlese.length == 1) document.querySelector('.prezentaProcent').classList.remove('disabled');
    else document.querySelector('.prezentaProcent').classList.add('disabled');
    loadData();
}