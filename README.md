# Snow IRC Bot

Modular multi-network IRC bot with custom commands and persistent user data.

## Usage

This bot can be configured via command line, but you're free to edit
[`config.json`](config.json) as well.

### Getting Started

Run `npm install` to install the dependencies.

Use Run `node snow.js create <name> <server[:<port>]> [password]` to create a
network with the specified name, server, port (optional), and password
(optional). Add yourself as the bot's administrator by running `node snow.js
admin add <network> <nick>` with the network name you just created and your IRC
nickname.

Start the bot with `node snow.js start`. This will spawn a background process,
but **you must be running the main process for it to work**, so start the main
process with `node snow.js` and leave it running (or use a process manager to
keep it in the background). When you're done, kill the main process and run
`node snow.js stop` to kill all of the background processes.

In IRC, the bot will have a default name of SnowBot. Send a message with
`!join #<channel>` to have the bot join a channel. You can configure additional
settings such as saved channels and bot identification in
[`config.json`](config.json).

### Web Services

Many functions of the bot require an API key or account. The following values
can be added to [`config.json`](config.json):

- [Dark Sky API](https://darksky.net/dev/): `"forecast": { "key":
  "insert_key" }` - Used for weather commands
- [YouTube API](https://www.youtube.com/yt/dev/api-resources.html): `"google":
  { "key":"insert_key" }` Used for video searching
- [Philips Hue API](https://www.developers.meethue.com/): `"hue": {
  "accessToken": "insert_access_token", "bridgeId": "insert_bridge_id" },` -
  Used for controlling Philips Hue lights
- [Last.fm API](http://www.last.fm/api): `"lastfm": { "key": "insert_key" }` -
  Used for fetching now playing song information
- [Microsoft Translator API](https://www.microsoft.com/en-us/translator/
  translatorapi.aspx): `"microsoft": { "id": "insert_id", "secret":
  "insert_secret" }` - Used for translating text
- [Plug.dj API](http://support.plug.dj/hc/en-us/categories/200123567-API):
  `"plug": { "email": "insert_account_email", "password":
  "insert_account_password" }` - Used for connecting to and interacting with
  Plug.dj
- [Steam Web API](https://developer.valvesoftware.com/wiki/Steam_Web_API):
  `"steam": { "key": "insert_key" }` - Used for fetching now playing game
  information
- [Yo API](http://docs.justyo.co/): `"yo": { "name": "insert_name", "key":
  "insert_key" }` - Used for sending Yos

## Overview

Supports connections to an unlimited number of IRC servers. Is able to save
persistent user data in various scopes that can be accessed later.

Focuses on extensibility. You can add commands of your own by following the
format of existing ones. See the section below for details.

Comes with a number of administrative commands that can make a bot change its
nickname, speak in a channel, and more. Also includes a variety of utility and
vanity commands, which are listed in [`config.json`](config.json).

## Extending

This bot is built with extensibility in mind, and you can modules for your own
use by following the same format as the existing modules (in
[`modules`](modules)) and adding command references to
[`config.json`](config.json).

Keep in mind that [`modules`](modules) and [`config.json`](config.json) are
checked into the source repository. You may need to discard your changes before
pulling updated versions of any files, and restore them after. If you believe
your module would benefit other users of the project, you are encouraged to
submit a pull request, in which case your changes would remain in the remote
files.
