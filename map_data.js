window._w= {};

window._w.alegeri = {
    "Prezidentiale Tur 1 2019": "prezidentiale10112019",
    "Prezidentiale Tur 2 2019": "prezidentiale24112019",
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
    "Parlamentare 2024": "parlamentare01122024",
    "Prezidentiale Tur 1 2024": "prezidentiale_24112024",
    "Prezidentiale Tur 1 2025": "prezidentiale04052025",
    "Prezidentiale Tur 2 2025": "prezidentiale18052025",
}
window._w.prezenta = {
    "parlamentare 2020": "parlamentare06122020",
    "locale2020": "locale27092020",
    "locale2024": "locale09062024v2",
    "europarlamentare2024": "europarlamentare09062024",
    "parlamentare2024": "parlamentare01122024",
    "prezidentiale Tur 1 2024": "prezidentiale24112024",
    "Prezidentiale Tur 1 2025": "prezidentiale04052025",
    "Prezidentiale Tur 2 2025": "prezidentiale18052025",
}
window._w.isPagePresence ??= false;

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
    { match: /(USR|UNIUNEA SALVA.I ROM.NIA|Lasconi)/i, fill: "#00b2ff" },
    { match: /\b(PSD PNL)\b/i, fill: "#ff5100" },
    { match: /\b(PNL|PARTIDUL NATIONAL LIBERAL|KLAUS|CIUCA)\b/i, fill: "#ffe500" },
    { match: /\b(PSD|PARTIDUL SOCIAL DEMOCRAT|DANCILA|CIOLACU)\b/i, fill: "#ff001e" },
    { match: /\b(AUR|ALIANTA PENTRU UNIREA ROMANILOR|SIMION)\b/i, fill: "#F29718" },
    // { match: /\b(AUR|ALIANTA PENTRU UNIREA ROMANILOR|SIMION)\b/i, fill: "#A16800" },
    { match: /\b(CALIN GEORGESCU)\b/i, fill: "#AC4959" },
    { match: /\b(UDMR|MAGHIAR|KELEMEN)/i, fill: "#1ED760" },
    { match: /(ALIAN.A MAGHIAR.A)/i, fill: "#2e821b" },
    { match: /\b(PMP|MISCAREA POPULARA)\b/i, fill: "#6542B1" },
    { match: /(PRO ROMANIA|^PRO)\b/i, fill: "#e16bff" },
    { match: /\b(INDEPENDENT)\b/i, fill: "#394d4d" }, 
    { match: /\b(PROIECTUL EUROPEAN)\b/i, fill: "#C62979" },
    { match: /\b(S\.O\.S)\b/i, fill: "#F8B7C0" },
    { match: /\b(CMM|ALIANTA PENTRU )\b/i, fill: "#154066" },
    { match: /\b(ALDE|ALIANTA LIBERALILOR)\b/i, fill: "#534d82" },
    { match: /\b(ALIAN.A SOCIAL LIBERALA)\b/i, fill: "#333331" },
    { match: /\b(ALIAN.A PENTRU UNIREA ROMANILOR)\b/i, fill: "#C5A655" },
    { match: /\b(GEORGE-CRIN)\b/i, fill: "#ff5100" },
    { match: /\b(DANIEL DAN)\b/i, fill: "#00b2ff" },
    { match: /\b(PONTA)\b/i, fill: "#e16bff" },
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
    if (!party) return "#878787";
    party = party.clear();
    return window._w.partide.find(colors => party.match(colors.match))?.fill || 
        (customCandidates[party] || (customCandidates[party] = customColors[lastColor++ % customColors.length]));
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

const mapTiles = [
    { name: 'cartoDB Light', url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png' },
    { name: 'cartoDB Dark', url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' },
    { name: 'cartoDB Voyager', url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png' },
    { name: 'OSM Terrain', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png' },
    { name: 'ESRI', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}' },
    { name: 'OpenTopoMap', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png' }
];
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

function mixColor(percentage) {
    percentage = Math.max(0, Math.min(100, percentage));

    const color0 = { r: 255, g: 255, b: 255 };   // #ffcc00
    const color50 = { r: 255, g: 0, b: 0 }; // #66ccff
    const color100 = { r: 128, g: 0, b: 0 };   // #0000ff

    let start, end, factor;

    if (percentage < 50) {
        start = color0;
        end = color50;
        factor = percentage / 50;
    } else {
        start = color50;
        end = color100;
        factor = (percentage - 50) / 50;
    }

    const r = start.r + factor * (end.r - start.r);
    const g = start.g + factor * (end.g - start.g);
    const b = start.b + factor * (end.b - start.b);

    const red = Math.round(r);
    const green = Math.round(g);
    const blue = Math.round(b);

    const toHex = component => component.toString(16).padStart(2, '0');
    const hex = `#${toHex(red)}${toHex(green)}${toHex(blue)}`;

    return hex;
}


function generateColorSpectrum(baseColorInput, numSteps, variation = {}) {
    const variationDefaults = {
        hue: 0,
        saturation: 0,
        lightness: 10 // Default to varying lightness if nothing else specified
    };
    const activeVariation = { ...variationDefaults, ...variation };

    // Helper to parse various color formats to an HSL object {h, s, l}
    function parseColorToHSL(colorStr) {
        let r, g, b, a;
        let h, s, l;

        if (typeof colorStr !== 'string') {
            throw new Error("Input color must be a string.");
        }

        // Basic Hex: #RGB, #RRGGBB
        if (colorStr.startsWith('#')) {
            let hex = colorStr.slice(1);
            if (hex.length === 3) {
                hex = hex.split('').map(char => char + char).join('');
            }
            if (hex.length !== 6) throw new Error("Invalid hex color format.");
            r = parseInt(hex.slice(0, 2), 16);
            g = parseInt(hex.slice(2, 4), 16);
            b = parseInt(hex.slice(4, 6), 16);
        }
        // RGB: rgb(r,g,b) or rgba(r,g,b,a)
        else if (colorStr.toLowerCase().startsWith('rgb')) {
            const match = colorStr.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/i);
            if (!match) throw new Error("Invalid RGB(A) color format.");
            [ , r, g, b, a] = match.map(Number); // a can be NaN if not present
        }
        // HSL: hsl(h,s%,l%) or hsla(h,s%,l%,a)
        else if (colorStr.toLowerCase().startsWith('hsl')) {
            const match = colorStr.match(/hsla?\((\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%(?:\s*,\s*([\d.]+))?\)/i);
            if (!match) throw new Error("Invalid HSL(A) color format.");
            let [ , h_in, s_in, l_in ] = match.map(Number);
            return { h: h_in, s: s_in, l: l_in }; // HSL already, return directly
        } else {
            // Very basic named color to hex (extend as needed or use a library)
            const namedColors = {
                red: "#FF0000", green: "#00FF00", blue: "#0000FF",
                yellow: "#FFFF00", cyan: "#00FFFF", magenta: "#FF00FF",
                black: "#000000", white: "#FFFFFF", gray: "#808080"
            };
            if (namedColors[colorStr.toLowerCase()]) {
                return parseColorToHSL(namedColors[colorStr.toLowerCase()]);
            }
            throw new Error("Unsupported color format. Use hex, rgb(a), or hsl(a).");
        }

        // Convert RGB to HSL
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        l = (max + min) / 2;

        if (max === min) {
            h = s = 0; // achromatic
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    // Helper: HSL to Hex
    function hslToHex(h, s, l) {
        s /= 100;
        l /= 100;
        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
    }


    const baseHSL = parseColorToHSL(baseColorInput);
    const spectrum = [];

    for (let i = -numSteps; i <= numSteps; i++) {
        let currentH = baseHSL.h + i * activeVariation.hue;
        let currentS = baseHSL.s + i * activeVariation.saturation;
        let currentL = baseHSL.l + i * activeVariation.lightness;

        // Normalize Hue (0-360, wraps around)
        currentH = (currentH % 360 + 360) % 360;

        // Clamp Saturation and Lightness (0-100)
        currentS = Math.max(0, Math.min(100, currentS));
        currentL = Math.max(0, Math.min(100, currentL));

        spectrum.push(hslToHex(currentH, currentS, currentL));
    }

    return spectrum;
}

function generateColorSpectrum2(centerColor, distance) {
    function hexToHSL(hex) {
      let r = 0, g = 0, b = 0;
      if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {
        r = parseInt(hex[1] + hex[2], 16);
        g = parseInt(hex[3] + hex[4], 16);
        b = parseInt(hex[5] + hex[6], 16);
      }
  
      r /= 255;
      g /= 255;
      b /= 255;
  
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l = (max + min) / 2;
  
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }
        h *= 60;
      }
  
      return [Math.round(h), Math.round(s * 100), Math.round(l * 100)];
    }
  
    function hslToHex(h, s, l) {
      s /= 100;
      l /= 100;
  
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs((h / 60) % 2 - 1));
      const m = l - c / 2;
      let r = 0, g = 0, b = 0;
  
      if (0 <= h && h < 60) [r, g, b] = [c, x, 0];
      else if (60 <= h && h < 120) [r, g, b] = [x, c, 0];
      else if (120 <= h && h < 180) [r, g, b] = [0, c, x];
      else if (180 <= h && h < 240) [r, g, b] = [0, x, c];
      else if (240 <= h && h < 300) [r, g, b] = [x, 0, c];
      else [r, g, b] = [c, 0, x];
  
      r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
      g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
      b = Math.round((b + m) * 255).toString(16).padStart(2, '0');
  
      return `#${r}${g}${b}`;
    }
  
    const [h, s, l] = hexToHSL(centerColor);
    const spectrum = [];
  
    for (let i = distance; i > 0; i--) {
      const newL = Math.max(0, l - (i * (l / (distance + 1))));
      spectrum.push(hslToHex(h, s, newL));
    }
  
    spectrum.push(centerColor);
  
    for (let i = 1; i <= distance; i++) {
      const newL = Math.min(100, l + (i * ((100 - l) / (distance + 1))));
      spectrum.push(hslToHex(h, s, newL));
    }
  
    return spectrum;
  }
  