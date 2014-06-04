//Wire up the context menu

function onMenuClick(info, tab) {
    var rawString = info.selectionText;
    var escapedString = escapeHtml(rawString);
    var finalString = geoFilter(escapedString);
    addLocation(finalString);
}

chrome.contextMenus.create({
    "title": "Add to WikiMaps",
    "contexts": ["selection"],
    "onclick": onMenuClick
})

function geoFilter(string) {
    if (string.length < 2 || string.length > 100) {
        return "";
    }
    //filter out strings only containing the empty character
    if (!((string.match(/ /g) || []).length == string.length)) {
        return string;
    }
    return "";
}

function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};


locations = {};

//functions for storing and sretrieving the data locally

function saveDataLocally() {
    chrome.storage.local.set({
        'locationData': locations
    })
}

function retrieveLocalData() {
    try {
        chrome.storage.local.get("locationData",
            function(locationData) {
                locations = locationData["locationData"];
                if (!(locations)) {
                    locations = {};
                }
            })
    } catch (err) {
        console.log(err);
        locations = {};
    }
}


function addLocation(location) {
    if (!(location in locations)) {
        //make sure this is a string!
        geolocate(location, updateLocation);
    } else {
        return;
    }
}

function updateLocation(location, coords) {
    //async attempt to get coordinates and update list
    if (coords) {
        locations[location] = {
            x: coords.k,
            y: coords.A
        };

        //push locations out to whoever is listening-- i.e. 
        //content script and popup
        chrome.runtime.sendMessage({
            action: 'update_locations',
            updatedLocations: locations
        })
        saveDataLocally();

        //async get data but don't wait around for this to happen,
        // just push another locations update on return of getWiki.
        getWiki(location, function() {
            loc = {};
            loc[location] = locations[location];
            saveDataLocally();
            chrome.runtime.sendMessage({
                action: 'update_location',
                updatedLocation: loc
            })
        })
    }
}

function clearLocations() {
    locations = {};
}

function removeLocation(loc) {
    delete locations[loc];

}

function goToMap(locations) {
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
    retrieveLocalData();
}

function geolocate(address, callback) {
    //uses google api to geolocate addresses
    coords = "";
    geocoder.geocode({
        'address': address
    }, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            coords = results[0].geometry.location;
            callback(address, coords);
        } else {}
    });
}

function getLocationData() {
    // locationData = JSON.stringify(locations);
    //might have to do more here in the future.
    return locations
}

function getWikiImage(loc, title, callback) {
    //return a summary and image of the location from wiki
    //right now this takes two querries, maybe find a way to reduce to only 1
    // Question: do this immediately or only when the user selects "read more"
    // on the map page.

    var wikiImageQueryBase = "http://en.wikipedia.org/w/api.php?action=query&titles=QUERY_STRING&prop=pageimages&format=json&pithumbsize=400"
    wikiImageQueryBase = wikiImageQueryBase.replace("QUERY_STRING", title);

    $.get(
        wikiImageQueryBase,
        function(data) {
            var pageKey = Object.keys(data.query.pages)
            if (!(pageKey)) {
                return callback();
            }
            var imageUrl;
            if (data.query.pages[pageKey].thumbnail) {
                if (data.query.pages[pageKey].thumbnail.source) {
                    imageUrl = data.query.pages[pageKey].thumbnail.source;
                }
            }

            // now set extract of loc
            if (loc in locations) {
                l = locations[loc];
                l.imageUrl = imageUrl;
            }
            return callback()
        }
    );
}

//if there is a summary, fetches summary also source url.

function getWikiSummary(loc, url, title, callback) {
    var wikiExtractQueryBase = "http://en.wikipedia.org/w/api.php?action=query&prop=extracts|info&exintro&titles=QUERY_STRING&format=json&inprop=url&redirects";
    //should I replace spaces with underscores or %20?
    wikiExtractQueryBase = wikiExtractQueryBase.replace("QUERY_STRING", title);
    $.get(
        wikiExtractQueryBase,
        function(data) {
            var pageKey = Object.keys(data.query.pages)
            if (!(pageKey)) {
                return callback();
            }
            var extract = data.query.pages[pageKey].extract;
            var title = data.query.pages[pageKey].title;
            var source = data.query.pages[pageKey].fullurl;

            // now set extract of loc
            if (loc in locations) {
                l = locations[loc];
                l.extract = extract;
                l.wikiSource = source;
            }
            return getWikiImage(loc, title, callback);
        }
    );
}

//maybe search wiki for the first result of location, use that to get image and extract from result title.
// can also use this for images -- 
// http://en.wikipedia.org/w/api.php?action=query&titles=QUERY_STRING&prop=pageimages&format=json&pithumbsize=500

function getWiki(loc, callback) {

    //first query WIKI api for url of corrosponding article to location
    var wikiSearchQueryBase = "http://en.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=QUERY_STRING&srlimit=1"
    wikiSearchQueryBase = wikiSearchQueryBase.replace("QUERY_STRING", loc);
    var response;
    $.get(
        wikiSearchQueryBase,
        function(data) {

            var results = data.query.search;
            if (!(results)) {
                return callback();
            }
            var title = results[0].title;
            return getWikiSummary(loc, "http://en.wikipedia.org/wiki/" + title, title, callback);
        }
    );
}

//might want to add callback for addLocation since async, but should be alright...?
// http://en.wikipedia.org/wiki/Special%3aApiSandbox#action=query&prop=extracts&format=json&exlimit=10&exintro=&titles=London
// ^ wiki api link to get paragraph of info on a query
// Handle request to add location
//TODO: could change to switch statements later?

function onRequest(request, sender, sendResponse) {
    if (request.action == "add_location") {
        addLocation(request.newLocation);
        sendResponse({
            updatedLocations: locations
        });
    } else if (request.action == "remove_location") {
        removeLocation(request.removeLocation);
        saveDataLocally()
        sendResponse({
            updatedLocations: locations
        });
    } else if (request.action == "get_locations") {
        sendResponse({
            updatedLocations: locations
        });
    } else if (request.action == "display_locations") {
        goToMap(locations);
    } else if (request.action == "get_location_data") {
        locationCoordinates = getLocationData();
        sendResponse({
            locationData: locations
        })
    } else if (request.action == "clear_locations") {
        clearLocations();
        saveDataLocally();
        //shouldn't need a callback here, it's a quick op..
        sendResponse({
            locationData: locations
        })
    }
};

// Wire up listener
chrome.runtime.onMessage.addListener(onRequest);

// Wire up listener for keyboard shortcut
//TODO: Make this work. Currently broken and sad.

// chrome.commands.onCommand.addListener(function(command) {
//     console.log('Command:', command);
//     if (command == 'add_selection') {
//         //send message to context script to get selection
//         chrome.extension.sendRequest({
//                 action: 'get_selection',
//             },
//             function(response) {
//                 console.log(response);
//                 add_selection(geoFilter(response.selectedText));
//             })
//     }
// });

//start up geocoder and retrieve saved locations
initialize();
