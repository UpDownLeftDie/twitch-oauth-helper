const config = require("./config.test.json");
const getTwitchSession = require("./index");

async function test() {
  console.log(await getTwitchSession(config));
}

test();
