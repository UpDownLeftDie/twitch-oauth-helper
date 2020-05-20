const fs = require("fs");
const util = require("util");
const fetch = require("node-fetch");

const fsWriteFile = util.promisify(fs.writeFile);
const sessionFileLocation = "./twitch-session.json";
let twitchSession = {};

async function createSessionFile() {
  try {
    const sessionFile = fs.readFileSync(sessionFileLocation, "utf8");
    session = JSON.parse(sessionFile);
  } catch (err) {
    console.log("Session file doesn't exist. Creating...");

    try {
      await fsWriteFile(sessionFileLocation, JSON.stringify({ twitch: {} }));
    } catch (err) {
      throw new Error("Failed to create twitch-session.json file");
    }
    console.log("Created new session.json file!");
  }
}

async function twitchAuthCode(settings) {
  const { clientId, clientSecret, scope, redirectUri } = settings;
  const readlineSync = require("readline-sync");
  // const redirectUri = "http://localhost";
  const scopeStr = scope ? `&scope=${scope}` : "";
  const url = `https://id.twitch.tv/oauth2/authorize?client_id=${clientId}&client_secret=${clientSecret}&response_type=code&redirect_uri=${redirectUri}${scopeStr}`;
  console.log(url);

  let authCode = readlineSync.question("Enter your authorization code: ");
  return authCode;
}

async function twitchAuthToken(settings, code) {
  const url = "https://id.twitch.tv/oauth2/token";
  const options = {
    method: "POST",
    json: true,
  };
  let params = {
    client_id: settings.clientId,
    client_secret: settings.clientSecret,
  };

  if (code) {
    console.log("Getting a new Twitch token");
    params = {
      ...params,
      code,
      grant_type: "authorization_code",
      redirect_uri: "http://localhost",
    };
  } else if (twitchSession.refreshToken) {
    console.log("Refreshing Twitch token");
    params = {
      ...params,
      grant_type: "refresh_token",
      refresh_token: twitchSession.refreshToken,
    };
  } else {
    throw new Error("Either auth code or refresh token are needed");
  }
  params = new URLSearchParams(params);
  const res = await fetch(`${url}?${params}`, options);
  if (res.ok) {
    return res.json();
  } else {
    throw new Error(res.statusText);
  }
}

async function updateSessionStorage(newSession) {
  try {
    await fsWriteFile(sessionFileLocation, JSON.stringify(newSession));
    console.log("Successfully updated session!");
  } catch (err) {
    console.log("ERR updateSessionStorage:", err);
  }
  twitchSession = newSession;
  return newSession;
}

async function refreshTwitchToken(settings) {
  let authCode = undefined;
  if (!twitchSession.refreshToken) {
    authCode = await twitchAuthCode(settings);
  }

  // Update the twitch portion of our sessions storage
  const response = await twitchAuthToken(settings, authCode);
  console.log("New Twitch Auth token gotten!", response);
  const newSession = {
    clientId: settings.clientId,
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expires: new Date(new Date().getTime() + response.expires_in * 1000),
  };
  return newSession;
}

async function getTwitchSession(settings, forceRefresh = false) {
  const { clientId } = settings;
  twitchSession = {
    clientId,
    ...twitchSession,
  };
  try {
    const sessionFile = fs.readFileSync(sessionFileLocation, "utf8");
    twitchSession = JSON.parse(sessionFile);
  } catch (err) {
    await createSessionFile();
  }

  // Loads a default session storage
  let currentSession = {
    clientId: clientId || twitchSession.clientId,
    accessToken: "",
    expires: undefined,
    ...twitchSession,
  };
  // check if twitch token is valid
  if (
    forceRefresh ||
    !currentSession.accessToken ||
    !currentSession.expires ||
    new Date(currentSession.expires) <=
      new Date(new Date().getTime() + 5 * 60000)
  ) {
    const newSession = await refreshTwitchToken(settings);
    currentSession = await updateSessionStorage(newSession);
  }

  return currentSession;
}

module.exports = getTwitchSession;
