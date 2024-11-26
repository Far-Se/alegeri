

window._w.alegeriSelected = "Prezidentiale Tur 1 2024";
window._w.prezentaSelected = "prezidentiale Tur 1 2024";
window._w.isPagePresence = false;

let processHash = () =>{
    let hash = window.location.hash.substring(1);
    hash = decodeURIComponent(hash);
    if (hash.includes('prezenta-')) {
        hash = hash.replace('prezenta-', '');
        if(!window._w.prezenta.hasOwnProperty(hash))return;

        window._w.prezentaSelected = hash;
        window._w.isPagePresence = true;
        document.querySelector(`#prezenta option[value="${window._w.prezentaSelected}"]`).setAttribute("selected",true);
        return;
    }
    
    if(!window._w.alegeri.hasOwnProperty(hash))return;
    window._w.alegeriSelected = hash;
    window._w.isPagePresence = false;
    document.querySelector(`#alegeri option[value="${window._w.alegeriSelected}"]`).setAttribute("selected",true);
}
window._w.partideAlese = [];

window._w.sortType = ['UAT', 'votes'];
let changeSort = () => {
    if(window._w.sortType[0] == 'UAT') 
        {
            window._w.sortType = ['votes', 'UAT'];
            document.querySelector('#sortType a').innerHTML = "Sortare: Voturi";
        }
    else {
        window._w.sortType = ['UAT', 'votes'];
        document.querySelector('#sortType a').innerHTML = "Sortare: UAT";
    }
}

document.addEventListener('DOMContentLoaded', function () {
    for (const alegeri of Object.keys(window._w.alegeri)) {
        document.querySelector('#alegeri').insertAdjacentHTML('beforeend',`<option value="${alegeri}" ${alegeri === window._w.alegeriSelected ? 'selected' : ''}>${alegeri.charAt(0).toUpperCase() + alegeri.slice(1).replace(/([a-z])([0-9])/g, '$1 $2')}</option>`);
    }         
    for (const alegeri of Object.keys(window._w.prezenta)) {
        document.querySelector('#prezenta').insertAdjacentHTML('beforeend',`<option value="${alegeri}" ${alegeri === window._w.prezentaSelected ? 'selected' : ''}>${alegeri.charAt(0).toUpperCase() + alegeri.slice(1).replace(/([a-z])([0-9])/g, '$1 $2')}</option>`);
    }  
       for (const mapType of mapTiles) {
        document.querySelector('#mapLayers').insertAdjacentHTML('beforeend',`<option value="${mapType.name}"> ${mapType.name}</option>`);
    }       
    document.querySelector('#sortType a').addEventListener('click', function (e) {
        changeSort();
        loadData();
    })

    if (window.location.hash.length > 1) processHash(); 
    if(window._w.alegeriSelected.includes('Prezidentiale'))changeSort();
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

        window._w.partideAlese = [];
        window._w.alegeriSelected = e.target.value;
        loadData();
    })
    document.querySelector('#prezenta').addEventListener('change', function (e) {
        window._w.partideAlese = [];
        window._w.prezentaSelected = e.target.value;
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
        window._w.partideAlese = [];
        document.querySelector('#rezultate')?.classList.toggle('toggle');
        window._w.isPagePresence = !window._w.isPagePresence;
        document.querySelector('#prezenta').style.display = window._w.isPagePresence ? 'block' : 'none';
        document.querySelector('#alegeri').style.display = !window._w.isPagePresence ? 'block' : 'none';
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
    if (window._w.isPagePresence) {
        loadPresence(window._w.prezenta[window._w.prezentaSelected]);
        window.location.hash = `prezenta-${window._w.prezentaSelected}`;
    } else {
        document.querySelector('#toggleAlegeri').checked = true;
        window.location.hash = window._w.alegeriSelected;
        loadResults(window._w.alegeri[window._w.alegeriSelected]);
    }
    document.querySelector('#prezenta').style.display = window._w.isPagePresence ? 'block' : 'none';
    document.querySelector('#alegeri').style.display = !window._w.isPagePresence ? 'block' : 'none';
}
function selectParty(party) {
    let checked = document.querySelectorAll('input.iparty:checked');
    window._w.partideAlese = [...checked].map(el => el.value);
    if (window._w.partideAlese.length == 1) document.querySelector('.prezentaProcent').classList.remove('disabled');
    else document.querySelector('.prezentaProcent').classList.add('disabled');
    loadData();
}