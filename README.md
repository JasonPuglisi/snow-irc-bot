# Snow IRC Bot

A modular multi-network JavaScript IRC bot built with Node.js.

## Quick Start

1. Run ``git clone https://github.com/JasonPuglisi/snow-irc-bot.git && cd snow-irc-bot && npm install`` to download the latest files and install all necessary dependencies.

2. Run ``node snow.js create <name> <server[:<port>]> [password]`` to create a network with the specified name, server, port (optional), and password (optional).

3. Run ``node snow.js admin add <network> <nick>`` to add your nick as an admin for the network you just created. Make sure your nick is secured so nobody can use it maliciously to take over your bot.

4. Run ``node snow.js start`` to create the IRC client for your network. It will be added as a background process.

5. Run ``node snow.js`` to resume execution of your bot. Whenever this process is running, the bot will execute its functions and commands. You must leave this process running for your bot to function.

6. In IRC, send ``!join #<channel>`` to SnowBot to have your bot join the specified channel. Make sure you're in the channel first so you have operator permissions.
