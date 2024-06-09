var map = L.map('map', {
    zoomSnap: 0.1,
    zoomDelta: 0.1,
    zoomControl: false
}).setView([51.505, -0.09], 13);

var accessToken = 'pk.eyJ1IjoiZmFyc2UiLCJhIjoiY2x4NzZ3NGN5MTJrcDJrc2FzbWIyaHpsZSJ9.weTg8EhmBF8uPyH3IFbl0Q';

L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=' + accessToken, {
    id: 'mapbox/streets-v11',
    tileSize: 512,
    zoomOffset: -1,
    attribution: '© <a href="https://www.mapbox.com/">Mapbox</a>'
}).addTo(map);