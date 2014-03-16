var map;

unimposed = [{
    "featureType": "administrative",
    "elementType": "all",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "poi",
    "elementType": "all",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "road",
    "elementType": "all",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "transit",
    "elementType": "all",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "landscape",
    "elementType": "all",
    "stylers": [{
        "hue": "#727D82"
    }, {
        "lightness": -30
    }, {
        "saturation": -80
    }]
}, {
    "featureType": "water",
    "elementType": "all",
    "stylers": [{
        "visibility": "simplified"
    }, {
        "hue": "#F3F4F4"
    }, {
        "lightness": 80
    }, {
        "saturation": -80
    }]
}]

blueWater = [{
    "featureType": "water",
    "stylers": [{
        "color": "#46bcec"
    }, {
        "visibility": "on"
    }]
}, {
    "featureType": "landscape",
    "stylers": [{
        "color": "#f2f2f2"
    }]
}, {
    "featureType": "road",
    "stylers": [{
        "saturation": -100
    }, {
        "lightness": 45
    }]
}, {
    "featureType": "road.highway",
    "stylers": [{
        "visibility": "simplified"
    }]
}, {
    "featureType": "road.arterial",
    "elementType": "labels.icon",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "administrative",
    "elementType": "labels.text.fill",
    "stylers": [{
        "color": "#444444"
    }]
}, {
    "featureType": "transit",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "poi",
    "stylers": [{
        "visibility": "off"
    }]
}]

function initialize() {
    //TODO: Center at current location
    var mapOptions = {
        zoom: 5,
        minZoom: 2,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: blueWater,
        center: new google.maps.LatLng(-34.397, 150.644)
    };
    map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);
    // google.maps.event.addListener(map, 'center_changed', function() {
    //     checkBounds();
    // });
    // boundary fix

    // var allowedBounds = new google.maps.LatLngBounds(
    //     new google.maps.LatLng(80, -160), // top left corner of map
    //     new google.maps.LatLng(-80, 160) // bottom right corner
    // );

    // function checkBounds() {
    //     if (!allowedBounds.contains(map.getCenter())) {
    //         var C = map.getCenter();
    //         var X = C.lng();
    //         var Y = C.lat();

    //         var AmaxX = allowedBounds.getNorthEast().lng();
    //         var AmaxY = allowedBounds.getNorthEast().lat();
    //         var AminX = allowedBounds.getSouthWest().lng();
    //         var AminY = allowedBounds.getSouthWest().lat();

    //         if (X < AminX) {
    //             X = AminX;
    //         }
    //         if (X > AmaxX) {
    //             X = AmaxX;
    //         }
    //         if (Y < AminY) {
    //             Y = AminY;
    //         }
    //         if (Y > AmaxY) {
    //             Y = AmaxY;
    //         }

    //         map.setCenter(new google.maps.LatLng(Y, X));
    //     }
    // }

}

google.maps.event.addDomListener(window, 'load', initialize);

//make request to extension for locations OR just grab coords from request?
function getLocationData() {
    console.log("getting locations");
    chrome.runtime.sendMessage({
            'action': 'get_location_data'
        },
        //callback to get locations, background will pass back new list
        function(response) {
            console.log("get locations response", response)
            displayLocations(response.locationData);
        }
    )
}

// TODOs: Limit map boundaries, implement click on item
// in table to zoom to marker on map, get clustering, display labels by default,
// get more information about the labels, get distances from points
// maybe have a country info column if can get data.
// implement sharing, maybe just export a list of places and have people import it
// Maybe have a load-2+-pts-to-GMaps

// TODO: implement method to remove locations onClick
function removeLocation() {};


//wire up listener for locations in rows
function setRowListeners() {
    //maybe set a hover listener to make
    //all other locs opaque when any row
    //is being hovered over
    console.log("setting")
    rowLocations = $(".rowLocation");
    console.log(rowLocations)
    rowLocations.on('click', function() {
        onRowClick(this.id)
    })

    //on click of a location 
}

function onRowClick(loc) {
    console.log(loc, 1)
    if (loc in markers) {
        m = markers[loc];
        map.panTo(m.getPosition());
        map.setZoom(9)
    }
};


// moves to position on map, maybe changes the color, 
// maybe pops up more info, maybe calc distances btwn 
// every location and the selected one 

//MAYBE add location?
//MAYBE sets of locations?


function displayLocations(locationData) {
    //expecting a json object with structure:
    //{locations:[{location:{x:float,y:float},...]}
    obj = JSON.parse(locationData);
    addMarkersToMap(obj);
    addLocationsToTable(obj);
}

var markers = {};

function addMarkersToMap(locations) {

    var bounds = new google.maps.LatLngBounds()

    //TODO: implement data checking to ensure that things are
    // properly formatted/exist for each obj tried

    for (loc in locations) {
        console.log(locations[loc]);
        //TODO: Add clustering of markers
        //TODO!! Could pull some wikipedia or google data 
        //for each location on the map. For now just display and label
        var contentString = '<div id="content">' + loc +
            '</div>'+'<img src="'+locations[loc].imageUrl+'">'+
            '<div id="locDescription"'+locations[loc].extract+'"/>';
        var infowindow = new google.maps.InfoWindow({
            content: contentString
        });
        var coords = new google.maps.LatLng(locations[loc].x, locations[loc].y);
        var marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: loc,
        });
        //TODO: set initial zoom
        google.maps.event.addListener(marker, 'click',
            function(infowindow, marker) {
                return function() {
                    infowindow.open(map, marker);
                };
            }(infowindow, marker)
        );
        markers[loc] = marker;

        bounds.extend(coords);
        map.fitBounds(bounds);
    }
}

function addLocationsToTable(locations) {
    locList = $("#locationTable");
    for (loc in locations) {
        var contentString =
            '<tr>' +
            '<td class="rowLocation" id="' + loc + '"">' + loc + '</td>' +
            '<td>' + locations[loc].x + ' ' + locations[loc].y + '</td>' +
            '</tr>'
        locList.append(contentString);
    }

    locList.tablecloth({
        theme: "default",
        bordered: true,
        condensed: true,
        striped: true,
        sortable: true,
        clean: true,
        cleanElements: "th td",
    });
    setRowListeners();
}


//get data and display
getLocationData();