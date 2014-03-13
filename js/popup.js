//in the popup there will be a list of locations, remove buttons for all of 
//them, and a button to display on a map
console.log("loaded popup.js");

//make request for content
getLocations();

// listen for on click for display map and clear locations
$("#display_map").on("click", (function() {
    displayLocations();
}));

$("#clear_locations").on("click", (function() {
    clearLocations();
}));

//clears all locations via sending clear message to background and 
//receiving a new list (which should be empty) and displaying it.
//if the list is not empty then there is a problem (obviously).
function clearLocations() {
    chrome.runtime.sendMessage({
            'action': 'clear_locations'
        },
        //callback to refresh locations, background will pass back new list
        function(responseLocations) {
            refreshLocations(responseLocations.updatedLocations);
        }
    )
}


//removes a location from the list and sends a message to the background to remove from real list
function removeLocation(location) {
    chrome.runtime.sendMessage({
            'action': 'remove_location',
            'removeLocation': location
        },
        //callback to refresh locations, background will pass back new list
        function(responseLocations) {
            refreshLocations(responseLocations);
        }
    )
}

//updates the list of locations in the popup
function refreshLocations(locations) {
    console.log(locations);
    html = "<table>"
    for (ll in locations) {
        console.log(ll)
        html += "<tr><td class='locTD'>" + ll + "</td><td ><span class='deleteLoc'></span></td></tr>";
    }
    html += "</table>";
    console.log(html);
    $("#locationList")[0].innerHTML = html;
}

//pulls current list of locations from background
function getLocations() {
    console.log("getting locations");
    chrome.runtime.sendMessage({
            'action': 'get_locations'
        },
        //callback to get locations, background will pass back new list
        function(response) {
            console.log("get locations response")
            refreshLocations(response.updatedLocations);
        }
    )
}

//send message to background to navigate to map page
function displayLocations() {
    console.log("displaying locations")
    chrome.runtime.sendMessage({
        'action': 'display_locations'
    });
}

//Listener for new location data
function onRequest(request, sender, sendResponse) {
    console.log(request, sender.tab, request.action);
    if (request.action == "update_locations") {
        refreshLocations(request.updatedLocations);
    }
}

chrome.runtime.onMessage.addListener(onRequest);