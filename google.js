const fsp = require("fs").promises;
const fs = require("fs");
const path = require("path");
const process = require("process");
const { authenticate } = require("@google-cloud/local-auth");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive.readonly"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fsp.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file compatible with GoogleAuth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveToken(client) {
  const content = await fsp.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fsp.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
exports.authorize = async function authorize() {
  // The authorize method will check to see if user credentials are saved.
  // If not, it will open the browser to request them.
  // The user's credentials will then be saved in a credentials.json file.
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveToken(client);
    console.log("authenticated");
  }
  return client;
};

/**
 * Lists the names and IDs of up to 10 files.
 * @param {OAuth2Client} authClient An authorized OAuth2 client.
 */
exports.listFiles = async function listFiles(authClient) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const res = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name)",
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log("No files found.");
    return;
  }

  console.log("Files:");
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
};

/**
 * Gets file metadata
 * @param {*} authClient The client to connect with 
 * @param {*} realFileId The file ID we are querying
 * @returns An object with file metadata
 */
exports.getFileMetadata = async function getFileMetadata(
  authClient,
  realFileId
) {
  const drive = google.drive({ version: "v3", auth: authClient });
  const res = await drive.files.get({
    fileId: realFileId,
  });
  return res.data;
};

/**
 * Downloads a file
 * @param {*} authClient The client to connect with 
 * @param {*} realFileId The file ID we are querying
 * @param {*} pathToSave The path to the file we're saving
 */
exports.downloadFile = async function downloadFile(
  authClient,
  realFileId,
  pathToSave
) {
  const service = google.drive({ version: "v3", auth: authClient });

  try {
    await service.files.get(
      {
        fileId: realFileId,
        alt: "media",
      },
      { responseType: "stream" },
      (err, res) => {
        if (err) {
          console.error(err);
        } else {
          res.data
            .on("end", function () {
              console.log("Downloaded: " + pathToSave);
            })
            .on("error", function (err) {
              console.log("Error during download", err);
            })
            .pipe(fs.createWriteStream(pathToSave));
        }
      }
    );
  } catch (err) {
    console.log(err);
  }
};
