const fs = require('fs');
const readline = require('readline');

// Function to filter and store lines close to specified latitude-longitude combinations
async function findMinMaxLatLng(filePath) {
    let min = Infinity;
    let max = -Infinity;
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity // To recognize '\r\n' as a single newline
    });

    for await (const line of rl) {
        const lat = line.split(',')[5];
        //console.log(lat);
        if (lat < min) {
            min = lat;
        }
        if (lat > max) {
            max = lat;
        }
    }

    return [min, max];
}

// Function to filter and store lines close to specified latitude-longitude combinations
async function getLatBetween(filePath, min, max) {
    const filteredLines = [];
    const rl = readline.createInterface({
        input: fs.createReadStream(filePath),
        crlfDelay: Infinity // To recognize '\r\n' as a single newline
    });
    console.log("min: ", min, "max: ", max);
    for await (const line of rl) {
        const lat = line.split(',')[5];
        //console.log(lat);
        if (lat >= min && lat <= max) {
            filteredLines.push(line);
        }
    }
    return filteredLines;
}


// Usage example
const csvFilePath = 'US_Accidents_March23.csv';

async function main(inLatitudeLongitudeCombinations) {
    //let minMax = await findMinMaxLatLng(csvFilePath);
    let min = 24.5548;
    let max = 49.002201;
    let seg = (max - min)/120;
    console.log(min, max);
    console.log(seg);
    for (let i = 0; i < 120; i++) {
        let filteredLines = await getLatBetween(csvFilePath, min + (seg * i), min + (seg * (i + 1)))
         .then(filteredLines => {
            //console.log(filteredLines);
            let csvData = filteredLines.join('\n');
            //console.log("csvData: ", csvData);
            fs.writeFile("dataset" + i, csvData, (err) => {
 
                // In case of a error throw err.
                if (err) throw err;
            });
        });
    }
    
}

main();
