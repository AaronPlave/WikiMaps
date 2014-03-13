//Wire up the context menu
function onMenuClick(info, tab) {
    var rawString = info.selectionText;
    var escapedString = escapeHtml(rawString);
    var finalString = geoFilter(escapedString);
    console.log(finalString);
    addLocation(finalString);
}

chrome.contextMenus.create({
    "title": "Add to Map Select",
    "contexts": ["selection"],
    "onclick": onMenuClick
})

function geoFilter(string) {
    //
    if (string.length < 2 || string.length > 100) {
        return "";
    }
    //filter out strings only containing the empty character
    if (!((string.match(/ /g) || []).length == string.length)) {
        return string;
    }
    console.log("FOUND EMPTY STRING");
    return "";
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};


locations = {};

console.log("loaded background.js")

function addLocation(location) {
    console.log("adding ", location);
    if (!(location in locations)) {
        //make sure this is a string!
        geolocate(location, updateLocation);
    } else {
        return;
    }
}

function updateLocation(location, coords) {
    //async attempt to get coordinates and update list
    console.log(coords, "COORDS FROM GEO")
    if (coords) {
        locations[location] = {
            x: coords.k,
            y: coords.A
        };
        console.log(coords);
        //push locations out to whoever is listening-- i.e. 
        //content script and popup
        chrome.runtime.sendMessage({
            action: 'update_locations',
            updatedLocations: locations
        })
    }
}

function clearLocations() {
    locations = {};
}

function removeLocation(loc) {
    console.log("removing ", loc);
    delete locations[loc];

}

function goToMap(locations) {
    console.log("Going to map");
    //navigates to a map page with all the locations
    //open new tab with map page
    mapURL = "../html/map.html"
    chrome.tabs.create({
        url: mapURL
    });
}


var geocoder;

function initialize() {
    geocoder = new google.maps.Geocoder();
}

///WHEN GEOLOCATING, add a create date to each geolocation, if > 30ish days, re-do
function geolocate(address, callback) {
    //uses google api to geolocate addresses
    console.log("geocoding: ", address)
    coords = "";
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            console.log(results[0]);
            coords = results[0].geometry.location;
            console.log("HERE THEY ARE", coords);
            callback(address, coords);
        } else {
            console.log("Geocode was not successful for the following reason: " + status);
        }
    });
}

function getLocationData() {
    console.log("preparing data for all locations");
    console.log(locations);
    locationData = JSON.stringify(locations);
    //might have to do more here in the future.
    return locationData
}

//REMEMBER to escape locations on the front end

//might want to add callback for addLocation since async, but should be alright...?

// Handle request to add location
//TODO: could change to switch statements later?
//TODO: add callbacks for adding locations so that you get updated
// coordinates? Worth the wait for the popup though..? 
function onRequest(request, sender, sendResponse) {
    console.log(request, sender.tab, request.action);
    //DO I EVER USE THIS?
    if (request.action == "add_location") {
        addLocation(request.newLocation);
        // sendResponse({
        //     updatedLocations: locations
        // });
    } else if (request.action == "remove_location") {
        removeLocation(request.removeLocation);
        sendResponse({
            updatedLocations: locations
        });
    } else if (request.action == "get_locations") {
        console.log("sending updatedLocations ", locations)
        sendResponse({
            updatedLocations: locations
        });
    } else if (request.action == "display_locations") {
        goToMap(locations);
    } else if (request.action == "get_location_data") {
        console.log("sending location data to map")
        locationCoordinates = getLocationData();
        console.log(locationCoordinates);
        console.log("asdsad")
        sendResponse({
            locationData: locationData
        })
    } else if (request.action == "clear_locations") {
        console.log("clearing locations")
        clearLocations();
        //shouldn't need a callback here, it's a quick op..
        sendResponse({
            locationData: locations
        })
    }
};


// Wire up listener
chrome.runtime.onMessage.addListener(onRequest);

// Wire up listener for keyboard shortcut
//TODO: Make this work.

chrome.commands.onCommand.addListener(function(command) {
    console.log('Command:', command);
    if (command == 'add_selection') {
        //send message to context script to get selection
        chrome.extension.sendRequest({
                action: 'get_selection',
            },
            function(response) {
                console.log(response);
                add_selection(geoFilter(response.selectedText));
            })
    }
});

//start up geocoder
initialize();