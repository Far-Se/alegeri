

window.alegeriSelected = "locale2024";
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

    document.querySelector('#collapse').addEventListener('click', () => {
        document.querySelector('.controls')?.classList.toggle('collapsed');
        document.querySelector('#unCollapse')?.classList.toggle('collapsed');
    });
    document.querySelector('#unCollapse').addEventListener('click', () => {
        document.querySelector('.controls')?.classList.toggle('collapsed');
        document.querySelector('#unCollapse')?.classList.toggle('collapsed');
    });

    document.querySelector('#toggleAlegeri').addEventListener('change', function (e) {
        document.querySelector('#table').innerHTML = '';
        window.partideAlese = [];
        document.querySelector('#rezultate')?.classList.toggle('toggle');
        isPagePresence = !isPagePresence;
        loadData();
    })
    document.querySelector('#toggleLocul2').addEventListener('change', function (e) {
        loadData()
    })
    document.querySelector('#prezentaProcent').addEventListener('change', function (e) {
        loadData()
    })
    
});
let loadData = () =>{
    if(window.isPagePresence) {

        loadPresence(window.alegeri[window.alegeriSelected]);
    }else
    {
        document.querySelector('#toggleAlegeri').checked = true;
        loadResults(window.alegeri[window.alegeriSelected]);
    }
}
function selectParty(party)
{
    let checked = document.querySelectorAll('input.iparty:checked');
    window.partideAlese = [...checked].map(el => el.value);
    if(window.partideAlese.length == 1)document.querySelector('.prezentaProcent').classList.remove('disabled');
    else document.querySelector('.prezentaProcent').classList.add('disabled');
    loadData();
}