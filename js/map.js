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

    //listener for read more click
    $('#myModal').on('show.bs.modal', function(e) {
        onReadMoreClick();
    })

    //listen for clicks to map
    google.maps.event.addListener(
        map,
        'click',
        function() {
            if (lastInfowindow) {
                lastInfowindow.close();
            }
        }
    );

    //listener for document resize
    window.onresize = function(event) {
        setTbodyHeight();
    }

    $("#addLocationDiv")[0].addEventListener("submit", function(evt) {
        evt.preventDefault();
        onAddLocationSubmit();
    });

    //initalize tablecloth
    locList = $("#locationTable");
    locList.tablecloth({
        theme: "default",
        bordered: true,
        condensed: true,
        striped: true,
        sortable: true,
        clean: true,
        cleanElements: "th td",
    });

    //get data and display
    getLocationData();
}

google.maps.event.addDomListener(window, 'load', initialize);

//make request to extension for locations OR just grab coords from request?

function getLocationData() {
    chrome.runtime.sendMessage({
            'action': 'get_location_data'
        },
        //callback to get locations, background will pass back new list

        function(response) {
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

//wire up listener for locations in rows

function removeEventListeners(elementName) {
    var elements = $(elementName);
    //removing old event listeners
    for (var i = 0; i < elements.length; i++) {
        var rr = elements[i]
        var rClone = rr.cloneNode(true);
        rr.parentNode.replaceChild(rClone, rr);
    }
}

function setRowListeners() {
    //maybe set a hover listener to make
    //all other locs opaque when any row
    //is being hovered over

    removeEventListeners(".rowLocation");
    //make sure to grab them again since they've now changed
    var rowLocations = $(".rowLocation");
    rowLocations.on('click', function() {
        onRowClick(this.id)
    })
    //on click of a location 
}


function onReadMoreClick() {
    modal = $("#readMoreModal");

    modalTitle = $(".modal-title")[0];
    modalBody = $(".modal-body")[0];

    var titleString = openLocation.title;

    var contentString = '<div id="content" class="well">Coordinates: ' +
        openLocation.location.x + ", " + openLocation.location.y + '<a id="viewInGmaps" target="_blank" href="http://maps.google.com/maps?q=' +
        openLocation.location.x + "," + openLocation.location.y + '">' + 'View in Google Maps' + '</a></div>' +
        '<div class="well">'
    if (openLocation.location.imageUrl) {
        contentString += '<img class="img-thumbnail" src="' + openLocation.location.imageUrl + '">';
    }
    if (openLocation.location.extract) {
        contentString += "<div id='wikiSource'>Wikipedia Link: <a target='blank' href=" +
            openLocation.location.wikiSource + ">" + openLocation.location.wikiSource +
            "</a><hr></hr></div>";
        contentString += '<div id="locDescription"' + openLocation.location.extract;
    } else {
        contentString += '<div id="locDescription"> Unable to find Wikipedia data for this location'
    }

    contentString += '<div/></div>';

    modalTitle.innerHTML = titleString;
    modalBody.innerHTML = contentString;
}


function onRowClick(loc) {
    if (loc in markers) {
        m = markers[loc];
        map.panTo(m.getPosition());
        map.setZoom(9)
        google.maps.event.trigger(m, 'click')
    }
};

function setRemoveButtonListeners() {
    removeEventListeners(".deleteLoc");
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



function onAddLocationSubmit() {
    raw = $("#addLocationInput")[0].value
    loc = escapeHtml(raw);
    chrome.runtime.sendMessage({
            'action': 'add_location',
            'newLocation': loc
        },
        //callback to refresh locations, background will pass back new list

        function(responseLocations) {
            displayLocations(responseLocations.updatedLocations);
        }
    )
    $("#addLocationInput")[0].value = "";
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};

// moves to position on map, maybe changes the color, 
// maybe pops up more info, maybe calc distances btwn 
// every location and the selected one 

function removeMarker(marker) {
    if (markers[marker]) {
        markers[marker].setMap(null);
        delete markers[marker]
    }
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
    if (l) {
        l.parentElement.remove();
    }
}

function updateTable() {
    $("#locationTable").trigger("update");
}

function removeLocation(location) {
    removeTableLocation(location);
    removeMarker(location);
    updateTable();

}

function clearLocations() {
    clearMarkers();
    clearTable();
}

function updateLocation(location) {
    //updates a location
    removeTableLocation(Object.keys(location)[0]);
    removeMarker(Object.keys(location)[0]);

    addMarkersToMap(location);
    addLocationsToTable(location);
}

function displayLocations(locationData) {
    //filter out any duplicate locations
    for (loc in locationData) {
        if (loc in markers) {
            delete locationData[loc];
        }
    }
    addMarkersToMap(locationData);
    addLocationsToTable(locationData);
    setTbodyHeight();
    updateTable();
}

var markers = {};

// TODO: get original wiki link and display in a read more in infowindows


function setTbodyHeight() {
    $("tbody").height($(document).height() * .70);
}

function addMarkersToMap(locations) {

    var bounds = new google.maps.LatLngBounds()

    for (loc in locations) {
        var contentString = '<div class="gInfowindow"><h3 id="content">' + loc +
            '</h3>' + '<button class="btn btn-primary btn-sm" data-toggle="modal" data-target="#myModal" id="readMoreModal">' + 'Summary' + '</button>' + '</div>'

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
            '<tr id="locTr">' +
            '<td class="rowLocation" id="' + loc + '">' + loc + '</td>' +
            "<td class='removeButton'><button class='deleteLoc' id='" + loc +
            "'>X</button></td>" + '</tr>'
        locList.append(contentString);
    }

    //Update the table
    locList.trigger("update");

    //set listeners
    setRowListeners();
    setRemoveButtonListeners();
}


//removes a location from the list and sends a message to the background to remove from real list

function removeLocationFromBackend(location) {
    chrome.runtime.sendMessage({
            'action': 'remove_location',
            'removeLocation': location
        },
        //callback to refresh locations, background will pass back new list

        function(responseLocations) {
            removeLocation(location);
        }
    )
}

//Listener for new location data

function onRequest(request, sender, sendResponse) {
    if (request.action == "update_locations") {
        displayLocations(request.updatedLocations);
    } else if (request.action == "remove_location") {
        removeLocation(request.removeLocation);
    } else if (request.action == "clear_locations") {
        clearLocations();
    } else if (request.action == "update_location") {
        updateLocation(request.updatedLocation);
    }
}

chrome.runtime.onMessage.addListener(onRequest);
