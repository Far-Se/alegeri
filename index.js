
window.alegeri =  {
    "locale2020": "locale27092020",
    "parlamentare2020": "parlamentare06122020",
    "locale2024": "locale09062024",
    "europarlamentare2024": "europarlamentare09062024"
}
window.alegeriSelected = "locale2024";
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

//on document ready
document.addEventListener('DOMContentLoaded', function () {
    loadPresence(window.alegeri[window.alegeriSelected]);    
    document.querySelector('#alegeri').addEventListener('change', function (e) {
        window.alegeriSelected = e.target.value;
        loadPresence(window.alegeri[window.alegeriSelected]);
    })
})
