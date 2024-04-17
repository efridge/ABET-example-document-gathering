# ABET Example Document Gathering

This script reads a CSV file with a list of URLs for ABET examples. It then downloads the 

## Installation

Using the node package manager [npm](https://www.npmjs.com/), run `npm i` in the terminal to install the required dependencies.

## Usage
To use this script, make sure you have placed the `summary.csv` file in the root of the app. This is the raw data that the app needs to read in order to perform the file downloads.

Note that this app requires your own Google credentials to be input in order for it to make calls to the Google Drive API. It will check to see if user credentials are present in a `credentials.json` file at the root of the app. If you do not have these credentials, you will need to download them from the Google Developer website. You will also need to set up an API key for this app integration. [More info can be found here](https://developers.google.com/drive/api/quickstart/js)

Once you have installed the `credentials.json` file, you can run the following command in the terminal: `node main.js`

This will display an OAuth login screen asking permission to sign in. Once you grant it permission, the app will download a token.json file to the root of the app folder. It will then proceed to process the data file, downloading all documents and filing them into a `downloads` directory according to the ABET LO/PI.