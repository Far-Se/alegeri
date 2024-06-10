function loadPresence(alegeri) {
    alegeri = alegeri.replace(/(\d)[a-z]+/gi, '$1');
    document.querySelector('#loading').style.display = "flex";
    document.querySelector('#rezultate').style.display = "none";
    const emptyData = {
        total_votanti: 0,
        total_voturi: 0,
        lista_permanenta: 0,
        lista_suplimentara: 0,
        LS: 0,
        percentage: 0
    };
    console.log(alegeri);
    fetch(`data/alegeri/prezenta_${alegeri}.json`)
        .then(response => response.json())
        .then(data => {
            getCommunes().then(async (communes) => {
                if (geoJSON) geoJSON.removeFrom(map);
                if (conturGeoJSON) conturGeoJSON.removeFrom(map);
                geoJSON = await L.geoJSON(communes, {
                    style: function (feature) {
                        let county = feature.properties.county.clear();
                        let name = feature.properties.name.clear();
                        let countyCode = window.countiesCodes[county];

                        if (data.hasOwnProperty(countyCode)) {
                            if (data[countyCode].hasOwnProperty(name)) {
                                feature.properties.data = { ...data[countyCode][name] };
                                feature.properties.data.percentage = (data[countyCode][name].total_voturi / data[countyCode][name].total_votanti).toFixed(2);
                            } else feature.properties.data = { ...emptyData };
                        } else feature.properties.data = { ...emptyData };

                        let fillColor = '#ff0000';
                        if (isNaN(feature.properties.data.percentage)) {
                            feature.properties.data.percentage = 0;
                            fillColor = '#dddddd';
                            console.log(feature.properties.data);
                        }
                        if (feature.properties.data.total_votanti === 0) {
                            feature.properties.data.percentage = 1;
                            fillColor = '#878787';
                            console.log(county, name, countyCode);
                            console.log(feature.properties.county, feature.properties.name, countyCode);
                        }
                        let weight = 0.3;
                        if (fillColor == "#878787" && county == "SR") {
                            feature.properties.data.percentage = 0;
                            weight = 0;

                        }


                        return {
                            fillColor: fillColor,
                            weight: weight,
                            color: "#000000",
                            fillOpacity: feature.properties.data.percentage
                        };
                    },
                    onEachFeature: onEachFeaturePresence,
                });
                geoJSON.addTo(map);
                const geoJSONLayer = L.geoJSON(window.conturJudete, {
                    style: (e) => {
                        return {
                            fillColor: "#ff0000",
                            fillOpacity: 1, 
                            weight: 0.9,
                            color: "#000000"

                        }
                    }
                });
                geoJSONLayer.addTo(map);

                document.querySelector('#loading').style.display = "none";
            });
        })
        .catch(error => {
            console.error('Error:', error);
            document.querySelector('#loading').style.display = "none";
            document.querySelector('#table').innerHTML = 'Nu exista date!';
        });
}
function onEachFeaturePresence(feature, layer) {
    if(feature.properties.data.percentage == 0)return;
    popupContent = `
<h1>${feature.properties.county}: ${feature.properties.name}</h1>
<h3>
Numar Votanti: ${feature.properties.data.total_votanti.toLocaleString()}<br>
Total voturi: ${feature.properties.data.total_voturi.toLocaleString()}<br>
<small>LS: ${feature.properties.data.lista_suplimentara} LP: ${feature.properties.data.lista_permanenta} UM: ${feature.properties.data.urna_mobila} LC:${feature.properties.data.lista_C}</small><br>
Procent: ${(feature.properties.data.percentage * 100).toFixed(2)}%<br>
</h3>`;
    var popup = L.popup({
        maxWidth: 700,
        maxHeight: 800
    })
        .setContent(popupContent);
    layer.bindPopup(popup);
}