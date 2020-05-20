# Twitch OAuth Helper

**Currently only supports `OAuth Authorization Code Flow`**

## Usage

```javascript
const getTwitchSession = require("./index");
const twitchSession = await getTwitchSession({clientId: "...", clientSecret: "..." redirectUri: "http://localhost"});
```

- On initial call will help obtain `accessToken` and `refreshToken`s by providing a link to gain authorization code and wait for user input.
  - This can be skipped by building your own `twitch-session.json` with [twitchtokengenerator.com](https://twitchtokengenerator.com/)
- When called it will check and automatically refresh a token based on expiration time.

### Returns

```json
{
  "clientId": "...",
  "accessToken": "...",
  "refreshToken": "...",
  "expires": "2020-05-11T01:00:00.000Z"
}
```

### Parameters

`getTwitchSession(settings, forceRefresh)`

| parameter    | key          | description                                                                                    |
| ------------ | ------------ | ---------------------------------------------------------------------------------------------- |
| settings     | clientId     | Twitch App Client ID                                                                           |
| settings     | clientSecret | Twitch App Secret                                                                              |
| settings     | redirectUri  | (Optional) Where initial authorization request should redirect too                             |
| settings     | scope        | (Optional) space-separated list of [scopes](https://dev.twitch.tv/docs/authentication/#scopes) |
| forceRefresh |              | (Optional) Forces the `accessToken` to be refreshed                                            |
