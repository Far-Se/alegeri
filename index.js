

window.alegeriSelected = "locale2024";
window.prezentaSelected = "locale2024";
window.isPagePresence = false;
window.partideAlese = [];
//on document ready
document.addEventListener('DOMContentLoaded', function () {

    loadData();
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
    } else {
        document.querySelector('#toggleAlegeri').checked = true;
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