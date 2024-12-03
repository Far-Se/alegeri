

window._w.alegeriSelected = Object.keys(window._w.alegeri)[Object.keys(window._w.alegeri).length - 1];
window._w.prezentaSelected =  Object.keys(window._w.prezenta)[Object.keys(window._w.prezenta).length - 1];
window._w.isPagePresence = false;

let processHash = () => {
    const hash = decodeURIComponent(window.location.hash.substring(1));
    window._w.isPagePresence = hash.startsWith('prezenta-');
    const selected = hash.replace('prezenta-', '');
    if (window._w.prezenta[selected]) {
        window._w.prezentaSelected = selected;
        document.querySelector(`#prezenta option[value="${selected}"]`).selected = true;
    } else if (window._w.alegeri[selected]) {
        window._w.alegeriSelected = selected;
        document.querySelector(`#alegeri option[value="${selected}"]`).selected = true;
    }
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
    if(!window._w.isPagePresence) document.querySelector(`#toggleAlegeri`).checked = true;
    else document.querySelector(`#toggleAlegeri`).checked = false;
    changeSort();
    // if(window._w.alegeriSelected.includes('Prezidentiale'))changeSort();
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
        window._w.isPagePresence = !window._w.isPagePresence;
        if(window._w.isPagePresence)
        {
            
        window.location.hash = `prezenta-${window._w.prezentaSelected}`;
        }else {
            
        window.location.hash = window._w.alegeriSelected;
        }
        window.location.reload();
        return;
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
    const isPresence = window._w.isPagePresence;
    const selected = isPresence ? window._w.prezentaSelected : window._w.alegeriSelected;
    isPresence ? loadPresence(window._w.prezenta[selected]) : loadResults(window._w.alegeri[selected]);
    document.querySelector('#prezenta').style.display = isPresence ? 'block' : 'none';
    document.querySelector('#alegeri').style.display = isPresence ? 'none' : 'block';
    window.location.hash = isPresence ? `prezenta-${selected}` : selected;
}
function selectParty(party) {
    let checked = document.querySelectorAll('input.iparty:checked');
    window._w.partideAlese = [...checked].map(el => el.value);
    if (window._w.partideAlese.length == 1) document.querySelector('.prezentaProcent').classList.remove('disabled');
    else document.querySelector('.prezentaProcent').classList.add('disabled');
    loadData();
}