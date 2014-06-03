var map;
var lastInfowindow;
var openLocation;

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

    $('#myModal').on('show.bs.modal', function(e) {
        onReadMoreClick();
    })


    google.maps.event.addListener(
        map,
        'click',
        function() {
            if (lastInfowindow) {
                lastInfowindow.close();
            }
        }
    );


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


"http://maps.google.com/maps?q=1683 Mass Ave, Cambridge, MA"

function onReadMoreClick() {
    console.log("OPENING");
    modal = $("#readMoreModal");

    modalTitle = $(".modal-title")[0];
    modalBody = $(".modal-body")[0];

    var titleString = openLocation.title;

    var contentString = '<div id="content" class="well">Coordinates: ' +
        openLocation.location.x + ", " + openLocation.location.y + '<a id="viewInGmaps" target="_blank" href="http://maps.google.com/maps?q='+
        openLocation.location.x + "," + openLocation.location.y +'">' + 'View in Google Maps' +'</a></div>' + 
        '<div class="well">' + '<img src="' + openLocation.location.imageUrl + '">' +
        '<div id="locDescription"' + openLocation.location.extract + '<div/></div>';
    modalTitle.innerHTML = titleString;
    modalBody.innerHTML = contentString;
    console.log(openLocation);
}


function onRowClick(loc) {
    console.log(loc, 1)
    if (loc in markers) {
        m = markers[loc];
        map.panTo(m.getPosition());
        map.setZoom(9)
        google.maps.event.trigger(m, 'click')
    }
};

function setRemoveButtonListeners() {
    removeButton = $(".deleteLoc");
    removeButton.on('click', function() {
        onRemoveButtonClick(this.id)
    })
}

function onRemoveButtonClick(loc) {
    if (loc in markers) {
        removeLocationFromBackend(loc);
    }
}


// moves to position on map, maybe changes the color, 
// maybe pops up more info, maybe calc distances btwn 
// every location and the selected one 

//MAYBE add location?
//MAYBE sets of locations?


function removeMarker(marker) {
    console.log(marker, markers, markers[marker])
    console.log("del marker", marker);
    markers[marker].setMap(null);
    delete markers[marker]
}

function clearMarkers() {
    for (m in markers) {
        removeMarker(m)
    }
    markers = {};
}


function clearTable() {
    $("#locTbody")[0].innerHTML = "";
}

function removeTableLocation(location) {
    // remove all elements in table not in locationData
    l = document.getElementById(location);
    console.log("removing in table", location)
    console.log(l)
    if (l) {
        l.parentElement.remove();
    }
}


function removeLocation(location) {
    removeTableLocation(location);
    removeMarker(location);

}

function clearLocations() {
    clearMarkers();
    clearTable();
}

function updateLocation(location) {
    //updates a location
    console.log("UPDATING", location)

    removeTableLocation(Object.keys(location)[0]);
    removeMarker(Object.keys(location)[0]);

    addMarkersToMap(location);
    addLocationsToTable(location);
}

function displayLocations(locationData) {
    console.log("DISPLAYING LOCS")
    //expecting a json object with structure:

    //filter out any duplicate locations
    for (loc in locationData) {
        if (loc in markers) {
            delete locationData[loc];
        }
    }
    addMarkersToMap(locationData);
    addLocationsToTable(locationData);
}

var markers = {};

// TODO: get original wiki link and display in a read more in infowindows


function addMarkersToMap(locations) {

    var bounds = new google.maps.LatLngBounds()

    //TODO: implement data checking to ensure that things are
    // properly formatted/exist for each obj tried
    console.log("add", markers)
    for (loc in locations) {
        console.log(locations[loc]);
        //TODO: Add clustering of markers


        //OLD WAY
        // var contentString = '<div class="infoWindowDiv"><div id="content">' + loc +
        //     '</div>' + '<img src="' + locations[loc].imageUrl + '">' +
        //     '<div id="locDescription"' + locations[loc].extract + '<div/></div>';

        //NEW REDUCED INFO WAY
        var contentString = '<div><div id="content">' + loc +
            '</div>' + '<button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#myModal" id="readMoreModal">' + 'Read more' + '</button>' + '</div>'

        var infowindow = new google.maps.InfoWindow({
            content: contentString,
            maxWidth: 700,
        });
        var coords = new google.maps.LatLng(locations[loc].x, locations[loc].y);
        var marker = new google.maps.Marker({
            position: coords,
            map: map,
            title: loc
        });

        //this is going to be hacky but whatever.
        marker.location = locations[loc];

        google.maps.event.addListener(marker, 'click',
            function(infowindow, marker) {
                return function() {
                    if (lastInfowindow) {
                        lastInfowindow.close();
                    }
                    infowindow.open(map, marker);
                    lastInfowindow = infowindow;
                    openLocation = marker;
                    console.log(marker.title);
                };
            }(infowindow, marker)
        );
        markers[loc] = marker;

        bounds.extend(coords);
        map.fitBounds(bounds);
    }
}

function addLocationsToTable(locations) {
    console.log("LOCTABLE", locations)
    locList = $("#locationTable");
    for (loc in locations) {
        console.log("!!",'id=' + loc);
        var contentString =
            '<tr id="locTr">' +
            '<td class="rowLocation" id="' + loc + '">' + loc + '</td>' +
            "<td class='removeButton'><button class='deleteLoc' id='" + loc + "'>X</button></td>" +

        //this was to add coords
        // '<td>' + locations[loc].x + ' ' + locations[loc].y + '</td>' +
        //instead, add the remove buttons
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
    setRemoveButtonListeners();
}


//get data and display
getLocationData();


//removes a location from the list and sends a message to the background to remove from real list

function removeLocationFromBackend(location) {
    chrome.runtime.sendMessage({
            'action': 'remove_location',
            'removeLocation': location
        },
        //callback to refresh locations, background will pass back new list

        function(responseLocations) {
            console.log(responseLocations);
            removeLocation(location);
            displayLocations(responseLocations.updatedLocations);
        }
    )
}

//Listener for new location data

function onRequest(request, sender, sendResponse) {
    console.log(request, sender.tab, request.action);
    if (request.action == "update_locations") {
        console.log("UPDATING MAP")
        displayLocations(request.updatedLocations);
    } else if (request.action == "remove_location") {
        console.log("remove", request.removeLocation)
        removeLocation(request.removeLocation);
    } else if (request.action == "clear_locations") {
        clearLocations();
    } else if (request.action == "update_location") {
        updateLocation(request.updatedLocation);
    }
}

chrome.runtime.onMessage.addListener(onRequest);
