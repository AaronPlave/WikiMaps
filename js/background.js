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

        //async get data but don't wait around for this to happen,
        // just push another locations update on return of getWiki.
        getWiki(location, function() {
            chrome.runtime.sendMessage({
                action: 'update_locations',
                updatedLocations: locations
            })
        })

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
            console.log(results);
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
    // locationData = JSON.stringify(locations);
    //might have to do more here in the future.
    return locations
}


function getWikiImage(loc, title,callback) {
    //return a summary and image of the location from wiki
    //right now this takes two querries, maybe find a way to reduce to only 1
    // Question: do this immediately or only when the user selects "read more"
    // on the map page.

    var wikiImageQueryBase = "http://en.wikipedia.org/w/api.php?action=query&titles=QUERY_STRING&prop=pageimages&format=json&pithumbsize=400"
    wikiImageQueryBase = wikiImageQueryBase.replace("QUERY_STRING", loc);


    console.log(loc);
    console.log(title);
    $.get(
        wikiImageQueryBase,
        function(data) {
            console.log(data.query.search)
            var pageKey = Object.keys(data.query.pages)
            if (!(pageKey)) {
                console.log("NO IMAGE PAGE RESULTS");
                return callback();
            }
            // console.log(pageKey)
            // console.log(response.responseJSON.query.pages[pageKey])
            var imageUrl;
            if (data.query.pages[pageKey].thumbnail.source) {
                imageUrl = data.query.pages[pageKey].thumbnail.source;
            }
            console.log(imageUrl);

            // now set extract of loc
            if (loc in locations) {
                l = locations[loc];
                l.imageUrl = imageUrl;
            }
            return callback()
        }
    );
}



function getWikiSummary(loc, url, callback) {
    console.log(url);
    var wikiExtractQueryBase = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&titles=QUERY_STRING&format=json&inprop=url";
    wikiExtractQueryBase = wikiExtractQueryBase.replace("QUERY_STRING", loc);
    $.get(
        wikiExtractQueryBase,
        function(data) {
            console.log(data.query.search)
            var pageKey = Object.keys(data.query.pages)
            if (!(pageKey)) {
                console.log("NO SEARCH RESULTS");
                return callback();
            }
            // console.log(pageKey)
            // console.log(response.responseJSON.query.pages[pageKey])
            var extract = data.query.pages[pageKey].extract;
            var title = data.query.pages[pageKey].title;
            console.log(extract);

            // now set extract of loc
            if (loc in locations) {
                l = locations[loc];
                l.extract = extract;
            }
            return getWikiImage(loc, title, callback);
        }
    );
}


//maaaaybe do this. Search wiki for the first result of location, use that to get image and extract from result title.


// can also use this for images -- 
// http://en.wikipedia.org/w/api.php?action=query&titles=QUERY_STRING&prop=pageimages&format=json&pithumbsize=500

function getWiki(loc, callback) {

    //first query WIKI api for url of corrosponding article to location
    var wikiSearchQueryBase = "http://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=QUERY_STRING&srlimit=1"
    wikiSearchQueryBase = wikiSearchQueryBase.replace("QUERY_STRING", loc);
    // console.log(wikiQueryBase, loc)
    var response;
    $.get(
        wikiSearchQueryBase,
        function(data) {

            console.log(data.query.search)
            var results = data.query.search;
            if (!(results)) {
                console.log("NO SEARCH RESULTS");
                return callback();
            }
            // console.log(pageKey)
            // console.log(response.responseJSON.query.pages[pageKey])
            var title = results[0].title;
            console.log(title);
            return getWikiSummary(loc, "http://en.wikipedia.org/wiki/" + title, callback);
        }
    );




}

//REMEMBER to escape locations on the front end

//might want to add callback for addLocation since async, but should be alright...?

// http://en.wikipedia.org/wiki/Special%3aApiSandbox#action=query&prop=extracts&format=json&exlimit=10&exintro=&titles=London
// ^ wiki api link to get paragraph of info on a query


// Handle request to add location
//TODO: could change to switch statements later?
//TODO: add callbacks for adding locations so that you get updated
// coordinates? Worth the wait for the popup though..? 
function onRequest(request, sender, sendResponse) {
    console.log(request, sender.tab, request.action);
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
            locationData: locations
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