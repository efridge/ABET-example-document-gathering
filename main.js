const fs = require('fs');
const { parse } = require("csv-parse");
const { authorize, getFileMetadata, downloadFile } = require("./google.js");

// Stores the rows of data from the CSV
const data = [];
const currentLO = "";

// Read in the data from the CSV
// NOTE: This expects the CSV to be in the same directory as this script and named summary.csv
fs.createReadStream("./summary.csv")
  // Parse the CSV
  .pipe(parse({ delimiter: ",", from_line: 1 }))
  // For each row of data we read in
  .on("data", function (row) {
    // Get the name of the LO and PO this row belongs to
    const LO = row[0].substring(0,4);
    const PO = row[0].substring(4,8);

    currentFolder = 
    // Write a new element to the data array. Add the folder name and the valid links.
    data.push({
      LO,
      PO,
      // Makes an array of items from the row that match this regex
      // Strips off the Google URL, leaving only the ID
      files: row
        .filter((d) => d.match(/^https:\/\/drive.google.com/))
        .map((d) => d.replace("https://drive.google.com/open?id=", "")),
    });
  })
  .on("error", function (error) {
    console.log(error.message);
  })
  .on("end", function () {
    // Create the downloads dir if not existing
    createDirectory("downloads");

    authorize()
      .then((authClient) => {
        // For each LO/PI pairing in the array
        data.forEach((pair) => {
          // Path we will save the file to
          const path = "downloads/" + pair.LO + "/" + pair.PO;

          // Create the folders for LO and PO as needed
          createDirectory("downloads/" + pair.LO);
          createDirectory(path);

          // For each link in the file list
          pair.files.forEach(async (link) => {
            // Get the file metadata
            const metadata = await getFileMetadata(authClient, link);
            // Download the file to that location
            await downloadFile(authClient, link, `${path}/${metadata.name}`);
          });
        });
      })
      .catch(console.error);
  });

function createDirectory(folderName) {
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  } catch (err) {
    console.error(err);
  }
}
