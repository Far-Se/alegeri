window._w= {};

window._w.alegeri = {
    "Prezidentiale 2019": "prezidentiale2019",
    "Europarlamentare 2019": "europarlamentare2019",
    "Primari 2020": "locale27092020P",
    "Parlamentare CD 2020": "parlamentare06122020CD",
    "Parlamentare Senat 2020": "parlamentare06122020S",
    "Primari 2024": "locale09062024P",
    "primari Noi2024": "primariNoi",
    "Consiliu Local 2024": "locale09062024CL",
    "Consiliu Judetean 2024": "locale09062024CJ",
    "Presedinte C.J. 2024": "locale09062024PCJ",
    "Europarlamentare 2024": "europarlamentare09062024EUP",
    "Prezidentiale Tur 1 2024": "prezidentiale1_24112024"
}
window._w.prezenta = {
    "parlamentare 2020": "parlamentare06122020",
    "locale2020": "locale27092020",
    "locale2024": "locale09062024",
    "europarlamentare2024": "europarlamentare09062024",
    "prezidentiale Tur 1 2024": "prezidentiale1_24112024",
}

window._w.countiesName = {
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
    "VN": "VRANCEA",
    "CO": "CORESPONDENTA"
};
window._w.countiesCodes = Object.fromEntries(Object.entries(window._w.countiesName).map(([key, value]) => [value, key]));
window._w.partide = [
    {
        "match": "(USR[- ]|UNIUNEA SALVA.I ROM.NIA|\bUSR\b|Lasconi)",
        "properties": {
            "fill": "#00b2ff"
        }
    },
    {
        "match": "(PSD PNL)",
        "properties": {
            "fill": "#ff5100"
        }
    },
    {
        "match": "(PNL|PARTIDUL NATIONAL LIBERAL|KLAUS|CIUCA)",
        "properties": {
            "fill": "#ffc300"
        }
    },
    {
        "match": "(PSD|PARTIDUL SOCIAL DEMOCRAT|DANCILA|CIOLACU)",
        "properties": {
            "fill": "#ff001e"
        }
    },
    {
        "match": "(AUR|ALIANTA PENTRU UNIREA ROMANILOR|SIMION)",
        "properties": {
            "fill": "#A16800"
        }
    }, 
    {
        "match": "(CALIN GEORGESCU)",
        "properties": {
            "fill": "#AC4959"
        }
    },
    {
        "match": "(UDMR|MAGHIAR|KELEMEN)",
        "properties": {
            "fill": "#1ED760"
        }
    },
    {
        "match": "(ALIANTA MAGHIARA)",
        "properties": {
            "fill": "#2e821b"
        }
    },
    {
        "match": "(PMP|MISCAREA POPULARA)",
        "properties": {
            "fill": "#6542B1"
        }
    },
    {
        "match": "(PRO ROMANIA|^PRO)",
        "properties": {
            "fill": "#e16bff"
        }
    },
    {
        "match": "(INDEPENDENT)",
        "properties": {
            "fill": "#394d4d"
        }
    }, {
        "match": "(PROIECTUL EUROPEAN)",
        "properties": {
            "fill": "#C62979"
        }
    },
    {
        "match": "(S\.O\.S)",
        "properties": {
            "fill": "#F8B7C0"
        }
    },
    {
        "match": "(CMM|ALIANTA PENTRU )",
        "properties": {
            "fill": "#154066"
        }
    },
    {
        "match": "(ALDE|ALIANTA LIBERALILOR)",
        "properties": {
            "fill": "#534d82"
        }
    },
    {
        "match": "(ALIANTA SOCIAL LIBERALA)",
        "properties": {
            "fill": "#333331"
        }
    },
    {
        "match": "(ALIANTA PENTRU UNIREA ROMANILOR)",
        "properties": {
            "fill": "#C5A655"
        }
    }
];
window._w.results = {};
let customColors = [
    "#0B84A5",
    "#F6C85F",
    "#6F4E7C",
    "#9DD866",
    "#CA472F",
    "#FFA056",
    "#8DDDD0",
    "#ffa600",
    "#003f5c",
    "#2f4b7c",
    "#665191",
    "#a05195",
    "#d45087",
    "#f95d6a",
    "#ff7c43",
];
let lastColor = 0;
let customCandidates = {};
function getPartyColor(party) {
    if (party === undefined || party == null) return "#878787";
    for (let colors of window._w.partide) {
        if (party.clear().match(new RegExp(colors.match, 'i'))) {
            return colors.properties.fill;
        }
    }
    if (customCandidates.hasOwnProperty(party)) return customCandidates[party];
    customCandidates[party] = customColors[lastColor++ % customColors.length];
    return customCandidates[party];
}
window._w.countries = {
    "ZAF": "AFRICA DE SUD",
    "ALB": "REPUBLICA ALBANIA",
    "DZA": "ALGERIA",
    "AGO": "ANGOLA",
    "SAU": "REGATUL ARABIEI SAUDITE",
    "ARG": "ARGENTINA",
    "ARM": "ARMENIA",
    "AUS": "AUSTRALIA",
    "NZL": "NOUA ZEELANDA",
    "AUT": "AUSTRIA",
    "AZE": "AZERBAIDJAN",
    "BLR": "REPUBLICA BELARUS",
    "BEL": "BELGIA",
    "BIH": "BOSNIA SI HERTEGOVINA",
    "BRA": "BRAZILIA",
    "BGR": "BULGARIA",
    "CAN": "CANADA",
    "CZE": "REPUBLICA CEHA",
    "CHL": "CHILE",
    "CHN": "REPUBLICA POPULARA CHINEZA",
    "CYP": "REPUBLICA CIPRU",
    "COL": "REPUBLICA COLUMBIA",
    "KOR": "REPUBLICA COREEA",
    "HRV": "REPUBLICA CROATIA",
    "CUB": "CUBA",
    "DNK": "DANEMARCA",
    "EGY": "EGIPT",
    "CHE": "ELVETIA",
    "ARE": "EMIRATELE ARABE UNITE",
    "EST": "ESTONIA",
    "ETH": "ETIOPIA",
    "PHL": "FILIPINE",
    "FIN": "FINLANDA",
    "FRA": "FRANTA",
    "MCO": "PRINCIPATUL MONACO",
    "GEO": "GEORGIA",
    "DEU": "GERMANIA",
    "GRC": "REPUBLICA ELENA",
    "IND": "REPUBLICA INDIA",
    "IDN": "REPUBLICA INDONEZIA",
    "JOR": "REGATUL HASEMIT AL IORDANIEI",
    "IRQ": "IRAK",
    "IRN": "REPUBLICA ISLAMICA IRAN",
    "IRL": "IRLANDA",
    "ISL": "ISLANDA",
    "ISR": "STATUL ISRAEL",
    "ITA": "ITALIA",
    "JPN": "JAPONIA",
    "KAZ": "KAZAHSTAN",
    "KEN": "KENYA",
    "KWT": "KUWEIT",
    "LBN": "REPUBLICA LIBANEZA",
    "LTU": "LITUANIA",
    "LVA": "LETONIA",
    "LUX": "LUXEMBURG",
    "MKD": "REPUBLICA MACEDONIA DE NORD",
    "MYS": "MALAYSIA",
    "MLT": "MALTA",
    "GBR": "REGATUL UNIT AL MARII BRITANII SI AL IRLANDEI DE NORD",
    "MAR": "REGATUL MAROC",
    "MEX": "MEXIC",
    "MDA": "REPUBLICA MOLDOVA",
    "MNE": "MUNTENEGRU",
    "NGA": "REPUBLICA FEDERALA NIGERIA",
    "NOR": "NORVEGIA",
    "NLD": "REGATUL TARILOR DE JOS",
    "OMN": "SULTANATUL OMAN",
    "PAK": "REPUBLICA ISLAMICA PAKISTAN",
    "PSE": "PALESTINA",
    "PER": "REPUBLICA PERU",
    "POL": "POLONIA",
    "PRT": "PORTUGALIA",
    "QAT": "QATAR",
    "RUS": "FEDERATIA RUSA",
    "SEN": "SENEGAL",
    "SRB": "REPUBLICA SERBIA",
    "SGP": "REPUBLICA SINGAPORE",
    "SYR": "REPUBLICA ARABA SIRIANA",
    "SVK": "REPUBLICA SLOVACA",
    "SVN": "SLOVENIA",
    "ESP": "SPANIA",
    "LKA": "SRI LANKA",
    "USA": "STATELE UNITE ALE AMERICII",
    "SWE": "SUEDIA",
    "THA": "REGATUL THAILANDEI",
    "TUN": "REPUBLICA TUNISIANA",
    "TUR": "TURCIA",
    "TKM": "TURKMENISTAN",
    "UKR": "UCRAINA",
    "HUN": "UNGARIA",
    "URY": "REPUBLICA ORIENTALA A URUGUAYULUI",
    "UZB": "UZBEKISTAN",
    "VNM": "REPUBLICA SOCIALISTA VIETNAM",
    "ZWE": "ZIMBABWE",
    "TZA": "TANZANIA"
};
window._w.countriesCode = Object.fromEntries(Object.entries(window._w.countries).map(([key, value]) => [value, key]));

let mapTiles = [
    {
        name: 'cartoDB Light',
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    },
    {
        name: 'cartoDB Dark',
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    },
    {
        name: "OSM Terrain",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    },
    {
        name: "ESRI",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    },
    {
        name: "Stadia Light",
        url: "https://tiles.stadiamaps.com/tiles/osm_bright/{z}/{x}/{y}{r}.png",
    },
    {
        name: "Stadia Dark",
        url: "https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png",
    },
    {
        name: "OpenTopoMap",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    },

]
String.prototype.clear = function () {
    return this.replace(/î/g, 'a')
        .replace(/Î/g, 'I')
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase()
        .replace(/(MUNICIPIUL|ORAS) ?/ig, '')
        .replace(/\. /ig, '.')
        .replace(/ - /ig, '-')
        ;
}