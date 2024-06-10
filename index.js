
window.alegeri = {
    "locale2020": "locale27092020",
    "parlamentare CD 2020": "parlamentare06122020CD",
    "parlamentare Senat 2020": "parlamentare06122020S",
    "locale2024": "locale09062024",
    "primari Noi2024": "primariNoi",
    "europarlamentare2024": "europarlamentare09062024EUP"
}
window.alegeriSelected = "locale2024";
window.isPagePresence = false;

window.countiesName = {
    "AB": "ALBA",
    "AR": "ARAD",
    "AG": "ARGES",
    "BC": "BACAU",
    "BH": "BIHOR",
    "BN": "BISTRITA-NASAUD",
    "BT": "BOTOSANI",
    "BR": "BRAILA",
    "BV": "BRASOV",
    "BZ": "BUZAU",
    "CL": "CALARASI",
    "CS": "CARAS-SEVERIN",
    "CJ": "CLUJ",
    "CT": "CONSTANTA",
    "CV": "COVASNA",
    "DB": "DAMBOVITA",
    "DJ": "DOLJ",
    "GL": "GALATI",
    "GR": "GIURGIU",
    "GJ": "GORJ",
    "HR": "HARGHITA",
    "HD": "HUNEDOARA",
    "IL": "IALOMITA",
    "IS": "IASI",
    "IF": "ILFOV",
    "MM": "MARAMURES",
    "MH": "MEHEDINTI",
    "B": "BUCURESTI",
    "S1": "BUCURESTI SECTORUL 1",
    "S2": "BUCURESTI SECTORUL 2",
    "S3": "BUCURESTI SECTORUL 3",
    "S4": "BUCURESTI SECTORUL 4",
    "S5": "BUCURESTI SECTORUL 5",
    "S6": "BUCURESTI SECTORUL 6",
    "MS": "MURES",
    "NT": "NEAMT",
    "OT": "OLT",
    "PH": "PRAHOVA",
    "SJ": "SALAJ",
    "SM": "SATU MARE",
    "SB": "SIBIU",
    "SR": "STRAINATATE",
    "SV": "SUCEAVA",
    "TR": "TELEORMAN",
    "TM": "TIMIS",
    "TL": "TULCEA",
    "VL": "VALCEA",
    "VS": "VASLUI",
    "VN": "VRANCEA"
};
window.countiesCodes = Object.fromEntries(Object.entries(window.countiesName).map(([key, value]) => [value, key]));
window.partideAlese = [];
//on document ready
document.addEventListener('DOMContentLoaded', function () {

    loadData();
    document.querySelector('#alegeri').addEventListener('change', function (e) {
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
    window.partideAlese = [];
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