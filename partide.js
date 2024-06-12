

window.alegeri = {
    "prezidentiale 2019": "prezidentiale2019",
    "Europarlamentare 2019": "europarlamentare2019",
    "locale2020": "locale27092020P",
    "parlamentare CD 2020": "parlamentare06122020CD",
    "parlamentare Senat 2020": "parlamentare06122020S",
    "primari2024": "locale09062024P",
    "primari Noi2024": "primariNoi",
    "Consiliu Local 2024": "locale09062024CL",
    "Consiliu Judetean 2024": "locale09062024CJ",
    "Presedinte C.J. 2024": "locale09062024PCJ",
    "europarlamentare2024": "europarlamentare09062024EUP"
}
window.prezenta = {
    "parlamentare 2020": "parlamentare06122020",
    "locale2020": "locale27092020",
    "locale2024": "locale09062024",
    "europarlamentare2024": "europarlamentare09062024"
}

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
window.partide = [
    {
        "match": "(USR[- ]|UNIUNEA SALVA.I ROM.NIA|\bUSR\b)",
        "properties": { 
            "fill": "#00A6FF"
        }
    },
    {
        "match": "(PSD PNL)",
        "properties": {
            "fill": "#f75504"
        }
    },
    {
        "match": "(PNL|PARTIDUL NATIONAL LIBERAL)",
        "properties": {
            "fill": "#F7D600"
        }
    },
    {
        "match": "(PSD|PARTIDUL SOCIAL DEMOCRAT)",
        "properties": {
            "fill": "#EC1C24"
        }
    },
    {
        "match": "(AUR|ALIANTA PENTRU UNIREA ROMANILOR)",
        "properties": {
            "fill": "#A16800"
        }
    },
    {
        "match": "(UDMR|MAGHIAR)",
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
window.results = {};
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
    if (party == undefined || party == null) return "#878787";
    for (let colors of window.partide) {
        if (party.clear().match(new RegExp(colors.match, 'i'))) {
            return colors.properties.fill;
        }
    }
    if (customCandidates.hasOwnProperty(party)) return customCandidates[party];
    customCandidates[party] = customColors[lastColor++ % customColors.length];
    return customCandidates[party];
}
window.countries = {
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
    "ZWE": "ZIMBABZWE"
};
window.countriesCode = Object.fromEntries(Object.entries(window.countries).map(([key, value]) => [value, key]));