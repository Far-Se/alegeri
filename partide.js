window.partide = [
    {
		"match": "(USR[- ]|SALVATI ROMANIA)",
		"properties": {
			"fill": "#00A6FF"
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
			"fill": "#00984A"
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
			"fill": "#454646"
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
function getPartyColor(party) 
{
    if(party == undefined || party == null)return "#878787";
    for (let colors of window.partide) {
        if (party.clear().match(new RegExp(colors.match, 'i'))) {
            return colors.properties.fill;
            
        }
    }return "#878787";
}
