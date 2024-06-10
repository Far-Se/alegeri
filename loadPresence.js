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


                        return {
                            fillColor: fillColor,
                            weight: 0.3,
                            color: "#000000",
                            fillOpacity: feature.properties.data.percentage
                        };
                    },
                    onEachFeature: onEachFeaturePresence,
                });
                geoJSON.addTo(map);

                document.querySelector('#loading').style.display = "none";
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
