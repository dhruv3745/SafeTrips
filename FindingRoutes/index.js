const main = require("./index_copy.js");
var http = require('http');
var fs = require('fs');

const PORT=8080;

const { request } = require('express');
const express = require('express');
const app = express();
const port = 4444;
const mapAPIKey = 'AIzaSyDfigUNEOtDjnB3JUnbeBKnajHBXUQE0B8';
const axios = require('axios');
const polylineDecoder = "@googlemaps/polyline-codec";



async function fetchRouteData() {
  try {
    const mapsAPI = `https://maps.googleapis.com/maps/api/directions/json?destination=Palatine&origin=Wheeling&key=${mapAPIKey}`;
    const response = await axios.get(mapsAPI);
    const routeSteps = response.data.routes[0].legs[0].steps;
    const polyline = [];
    for (step of routeSteps) {
        let stepPolyline = step.polyline.points;
        for (coord of decode(stepPolyline, 5)){
            polyline.push(coord);
        }
    }
    console.log(polyline);
    return polyline;
  } catch (error) {
    console.error('Error fetching data:', error.message);
  }
}

function decode (encodedPath, precision){
    const factor = Math.pow(10, precision);

  const len = encodedPath.length;

  // For speed we preallocate to an upper bound on the final length, then
  // truncate the array before returning.
  const path = new Array(Math.floor(encodedPath.length / 2));
  let index = 0;
  let lat = 0;
  let lng = 0;
  let pointIndex = 0;

  // This code has been profiled and optimized, so don't modify it without
  // measuring its performance.
  for (; index < len; ++pointIndex) {
    // Fully unrolling the following loops speeds things up about 5%.
    let result = 1;
    let shift = 0;
    let b = 0;
    do {
      // Invariant: "result" is current partial result plus (1 << shift).
      // The following line effectively clears this bit by decrementing "b".
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f); // See note above.
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    result = 1;
    shift = 0;
    do {
      b = encodedPath.charCodeAt(index++) - 63 - 1;
      result += b << shift;
      shift += 5;
    } while (b >= 0x1f);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    path[pointIndex] = [lat / factor, lng / factor];
  }
  // truncate array
  path.length = pointIndex;

//   console.log(path);
  return path;

}



app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});


app.get('/', (req, res) => {
    console.log("connection accessed");
    res.send('Connection established :)');
});

app.get('/api/createRoute/:startLocation/:endLocation', async(req, res) => {
    const startLocationValue = req.params.startLocation;
    const endLocationValue = req.params.endLocation;
    const routeData = await fetchRouteData();
    const toSend = await main.main(routeData)
      .then(toSend => {
        console.log("toSend: ", toSend);
        const firstElements = toSend.map(line => {
          const parts = line.split(',');
          return "\'" + parts[0] + "\'"; // Take the first element
        });
        console.log("first: ", firstElements);
        fs.readFile('./index.html', function (err, html) {

          if (err) throw err;    

          let htmlString = html.toString();
          console.log(htmlString);
          htmlString = htmlString.replace("//REPLACE_THIS", "\"ID\": \[" + firstElements + "\]");
          console.log(htmlString);
          
      
          http.createServer(function(request, response) {  
              response.writeHeader(200, {"Content-Type": "text/html"});  
              response.write(htmlString);  
              response.end();  
          }).listen(PORT);
        });
        res.send(toSend);})
      .catch(error => {
          console.error('Error filtering and storing lines:', error);
      });
});



