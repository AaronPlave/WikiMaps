// console.log("loaded content_script");

// function getSelectionText() {
//     var text = "";
//     if (window.getSelection) {
//         text = window.getSelection().toString();
//     } else if (document.selection && document.selection.type != "Control") {
//         text = document.selection.createRange().text;
//     }
//     return text;
// }

// //could escape later once str is passed to background but
// //it might be safer just to do it ASAP.
// function escapeHtml(str) {
//     var div = document.createElement('div');
//     div.appendChild(document.createTextNode(str));
//     return div.innerHTML;
// };

// //Listener for new location data

// function onMessage(request, sender, sendResponse) {
//     console.log(request, sender);
// };

// chrome.extension.onRequest.addListener(
//     function(request, sender, sendResponse) {
//         console.log("asdasd");
//         sendResponse({
//             counter: 1
//         })
//     });

// // chrome.runtime.onRequest.addListener(onMessage);

// console.log("WTF")


// // //TODO: Add google geocode API key

// // // //listen for location updates
// // chrome.runtime.onMessage.addListener(onRequest);


// // function onRequest(request, sender, sendResponse) {
// // 	console.log("req")
// //     console.log(request, sender.tab, request.action);
// //     if (request.action == "get_selection") {
// //         sendResponse({
// //             selectedText: escapeHtml(getSelectionText())
// //         })
// //     }
// // }

// // function geoFilter(string) {
// //     //
// //     if (string.length < 2 || string.length > 100) {
// //         return "";
// //     }
// //     //filter out strings only containing the empty character
// //     if (!((string.match(/ /g) || []).length == string.length)) {
// //         return string;
// //     }
// //     console.log("FOUND EMPTY STRING");
// //     return "";
// // }


// // function addSelection(t) {
// //     var rawString = t;
// //     var finalString = escapeHtml(rawString);
// //     if (finalString) {
// //         //send it over to background
// //         chrome.runtime.sendMessage({
// //             'action': 'add_location',
// //             'newLocation': finalString
// //         })
// //         //callback to get locations, background will pass back new list
// //         // function(response) {
// //         //     console.log("get locations response", response)
// //         //     //TODO: maybe display these locations in a sidebar
// //         //     // displayLocations(response.locationData);
// //         // })
// //     }
// // }


// // //WORKS FOR MOUSE SELECTION
// // //TODO: implement the keyboard selection event
// // // var t = '';

// // // function gText(e) {
// // //     t = (document.all) ? document.selection.createRange().text : document.getSelection();

// // //     //TODO: how safe is toString, safe against evals?
// // //     var selected = t.toString();
// // //     var finalString = geoFilter(selected);
// // //     console.log(finalString)
// // //     highlighted = false;
// // //     if (finalString) {
// // //         highlighted = true;
// // //         var coords = getSelectionCoords();
// // //         createAddButton(finalString, coords);
// // //         // addSelection(selected)
// // //     }
// // // }

// // // popup = $('<button id="addButton" style=position: \
// // // 	absolute; margin-left: 0px; margin-top: -25px; \
// // // 	top: 291px; left: 266px;border-top: black;\
// // // 	border-style: solid;border-radius: 5px;width: 50px;\
// // // 	height: 15px;padding-bottom: 10px;margin-bottom: 10px;\
// // // 	bottom: -50px;background: aliceblue;>Add</button>');

// // // function createAddButton(text, coords) {
// // //     //creates an add button above the given coordinates
// // //     console.log("creating add button")
// // //     popup.css({
// // //         position: "absolute",
// // //         marginLeft: 0,
// // //         marginTop: 0,
// // //         top: coords.y,
// // //         left: coords.x
// // //     })
// // //     popup.appendTo('body');
// // //     $(popup).on('click', addSelection(text));
// // // }


// // // document.onmouseup = gText;
// // // if (!document.all) document.captureEvents(Event.MOUSEUP);

// // // function getSelectionCoords() {
// // //     //from http://stackoverflow.com/questions/6846230/javascript-text-selection-page-coordinates
// // //     var sel = document.selection,
// // //         range;
// // //     var x = 0,
// // //         y = 0;
// // //     if (sel) {
// // //         if (sel.type != "Control") {
// // //             range = sel.createRange();
// // //             range.collapse(true);
// // //             x = range.boundingLeft;
// // //             y = range.boundingTop;
// // //         }
// // //     } else if (window.getSelection) {
// // //         sel = window.getSelection();
// // //         if (sel.rangeCount) {
// // //             range = sel.getRangeAt(0).cloneRange();
// // //             if (range.getClientRects) {
// // //                 range.collapse(true);
// // //                 var rect = range.getClientRects()[0];
// // //                 x = rect.left;
// // //                 y = rect.top;
// // //             }
// // //         }
// // //     }
// // //     return {
// // //         x: x,
// // //         y: y
// // //     };
// // // }
// if (window == top) {
// 	console.log("Asdasdasdasd")
//     chrome.extension.onRequest.addListener(
//         function(request, sender, sendResponse) {
//             console.log("asdasdasdasdasd")
//             if (request.type == "fuckShitUp") {
//                 console.log("hey")
//                 sendResponse({
//                     s: "s"
//                 });
//             }
//         });
// }