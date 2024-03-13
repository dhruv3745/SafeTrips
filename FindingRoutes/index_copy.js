const fs = require('fs');
const readline = require('readline');

// Function to calculate the distance between two points (latitude and longitude)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const earthRadius = 6371; // Radius of the Earth in kilometers
    //console.log("lat1:", lat1, "lat2:", lat2);
    //console.log("lon1:", lon1, "lon2:", lon2);
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = earthRadius * c;
    return Math.abs(distance); // Distance in kilometers
}

// Function to filter and store lines close to specified latitude-longitude combinations
async function filterAndStoreLines(filePath, latLongCombinations, maxDistance) {
    const filteredLines = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity // To recognize '\r\n' as a single newline
    });

    for await (const line of rl) {
        const [lat, lon] = line.split(',').slice(5, 7).map(Number); // Assuming latitude and longitude are the first two columns
        for (const [targetLat, targetLon] of latLongCombinations) {
            const distance = calculateDistance(lat, lon, targetLat, targetLon);
            //console.log(distance);
            if (distance <= maxDistance) {
                filteredLines.push(line);
                break; // Move to the next line
            }
        }
    }

    return filteredLines;
}


// Usage example
const csvFilePath = 'US_Accidents_March23.csv';

// Function to read latitude-longitude combinations from a text file
function readLatLongCombinationsFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    // Remove leading and trailing square brackets and split by '],['
    const combinationString = content.substring(2, content.length - 2);
    const combinations = combinationString.split('],[');
    // Parse each combination and convert to a number
    return combinations.map(combination => {
        const [lat, lng] = combination.split(',').map(Number);
        return [lat, lng];
    });
}

async function main(inLatitudeLongitudeCombinations) {
    // Usage example
    const latLongCombinationsFilePath = 'data.txt'; // Path to the file containing latitude-longitude combinations

    // Read latitude-longitude combinations from the file
    const latitudeLongitudeCombinations = inLatitudeLongitudeCombinations;
    console.log('Latitude-Longitude Combinations:');
    console.log(latitudeLongitudeCombinations);

    const maxDistance = .01; // Maximum distance in kilometers (10 meters) .01

    return await filterAndStoreLines(csvFilePath, latitudeLongitudeCombinations, maxDistance);

    const filteredLines = await filterAndStoreLines(csvFilePath, latitudeLongitudeCombinations, maxDistance)
        .then(filteredLines => {
            console.log('Filtered lines stored successfully:');
            console.log(filteredLines);

            // Convert the filteredLines array into a single CSV string
            //const csvData = filteredLines.join('\n');
            //console.log("csvData: ", csvData);

            const firstElements = filteredLines.map(line => {
                const parts = line.split(',');
                return parts[0]; // Take the first element
            });

            console.log("first elements: ", firstElements);
            
            return firstElements;
        })
        .catch(error => {
            console.error('Error filtering and storing lines:', error);
        });
}

module.exports = { main };
