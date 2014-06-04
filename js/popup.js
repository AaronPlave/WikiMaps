//make request for content
getLocations();

function setOnClickListeners(locations) {
    // listen for on click for display map and clear locations
    $("#display_map").on("click", (function() {
        displayLocations();
    }));

    $("#clear_locations").on("click", (function() {
        clearLocations();
    }));

    locationElements = $(".deleteLoc");

    locationElements.on('click', function() {
        if (this.id in locations) {
            removeLocation(this.id);
        }
    })
}

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
            refreshLocations(responseLocations.updatedLocations);
        }
    )
}

//updates the list of locations in the popup

function refreshLocations(locations) {
    locList = $("#locationTable");
    locList[0].innerHTML = "";

    var contentString = "<thead><tr><th>Location</th><th>Remove" +
        "</th></tr></thead><tbody id='tbody'"
    locList.append(contentString);

    for (loc in locations) {
        var newString =
            '<tr>' +
            '<td>' + loc + '</td>' +
            "</td><td class='removeButton'><button class='deleteLoc' id='" + loc + "'>X</button></td></tr>" +
            '</tr>'

        locList.append(newString);
    }
    locList.append("</tbody>");

    locList.tablecloth({
        theme: "default",
        bordered: true,
        condensed: true,
        striped: true,
        sortable: true,
        clean: true,
        cleanElements: "th td",
    });

    setOnClickListeners(locations);
}

//pulls current list of locations from background

function getLocations() {
    chrome.runtime.sendMessage({
            'action': 'get_locations'
        },
        //callback to get locations, background will pass back new list

        function(response) {
            refreshLocations(response.updatedLocations);
        }
    )
}

//send message to background to navigate to map page

function displayLocations() {
    chrome.runtime.sendMessage({
        'action': 'display_locations'
    });
}

//Listener for new location data

function onRequest(request, sender, sendResponse) {
    if (request.action == "update_locations") {
        refreshLocations(request.updatedLocations);
    }
}

chrome.runtime.onMessage.addListener(onRequest);
