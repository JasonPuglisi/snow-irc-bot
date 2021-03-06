/* DEPENDENCIES AND SETTINGS */

global.configFile = 'config.json';
global.config = require('./' + configFile);

global.saveFile = 'save.json';
global.save = require('./' + saveFile);

// Require dependencies
for (var i in config.dependencies) {
	global[i] = require(config.dependencies[i]);
}

// Read modules
fs.readdir('./modules/', function(err, files) {
	// For each module
	for (var i in files) {
		// Set file
		var file = files[i];

		// Set file name
		var name = file.substring(0, file.indexOf('.'));

		// Require module
		global[name] = require('./modules/' + file);

		// For each function
		for (var j in global[name]) {
			// Set function
			global[j] = global[name][j];
		}
	}
});

// Set irc-factory settings
var axon = factory.axon;
var api = new factory.Api();
var options = {
	events: 31920,
	rpc: 31930,
	automaticSetup: true,
	fork: true
};

var interfaces = api.connect(options);
var events = interfaces.events;
global.rpc = interfaces.rpc;

// Set global variables
var waitingRegistered = [];
var waitingChannels = [];
global.tempNick = '';

/* EVENT LISTENERS */

// Set irc-factory message event listener
events.on('message', function(msg) {
	// Set event
	var event = msg.event;

	// Declare event name and client
	var name;
	var client;

	// If event is array
	if (event instanceof Array) {
		// Set event name and client
		name = event[1];
		client = event[0];
	}

	// Else (event is not array)
	else {
		// Set event name
		name = event;
	}

	// Check event name
	switch(name) {
		// Synchronize event
		case 'synchronize':
			// Set clients
			var clients = msg.keys;

			// Process synchronize event
			processSynchronize(clients);
		break;

		// Registered event
		case 'registered':
			// Set nickname
			var nickname = msg.message.nickname;

			// Process registered event
			processRegistered(client, nickname);
		break;

		// Privmsg event
		case 'privmsg':
			// Set target, nickname, and message
			var target = msg.message.target;
			var nickname = msg.message.nickname;
			var message = msg.message.message;

			// Process privmsg event
			processPrivmsg(client, target, nickname, message);
		break;
	}
});

/* EVENT FUNCTIONS */

// Process synchronize event
function processSynchronize(clients) {
	// Set process args
	var file = process.argv[1];
	var command = process.argv[2];
	var args = process.argv.slice(3);

	// Check command
	switch(command) {
		// No command
		case undefined:
			// If there are active clients
			if (clients.length > 0) {
				// Log clients and resume execution
				console.log('Resuming execution (Clients: ' + clients.join(', ') + ')');
			}

			// Else (there are no active clients)
			else {
				// Log no active clients
				console.log('[!] No active clients');

				// Exit script with error
				process.exit(1);
			}
		break;

		// List command
		case 'list':
			// If there are active clients
			if (clients.length > 0) {
				// Log clients
				console.log('Clients: ' + clients.join(', '));
			}

			// Else (there are no active clients)
			else {
				// Log no active clients
				console.log('[!] No active clients');
			}

			// Exit script
			process.exit();
		break;

		// Start command
		case 'start':
			// Set targets
			var targets = args;

			// Start target clients
			createClients(clients, targets, function() {
				// Exit script when ready
				exitReady();
			});
		break;

		// Stop command
		case 'stop':
			// Set targets
			var targets = args;

			// Stop target clients
			destroyClients(clients, targets, function() {
				// Exit script
				process.exit();
			});
		break;

		// Restart command
		case 'restart':
			// Set targets
			var targets = args;

			// Stop target clients
			destroyClients(clients, targets, function() {
				// Start target clients and ignore client list
				createClients([], targets, function() {
					// Exit script when ready
					exitReady();
				});
			});
		break;

		// Create command
		case 'create':
			// Set name, address, and optional password
			var name = args[0];
			var address = args[1];
			var password = args[3];

			// Create network
			createNetwork(name, address, password, function() {
				// Exit script
				process.exit();
			});
		break;

		// Destroy command
		case 'destroy':
			// Set name
			var name = args[0];

			// Destroy network
			destroyNetwork(name, function() {
				// Exit script
				process.exit();
			});
		break;

		// Admin command
		case 'admin':
			// Set action, network, and nick
			var action = args[0];
			var network = args[1];
			var nick = args[2];

			// Set admin options
			setAdmin(action, network, nick, function() {
				// Exit script
				process.exit();
			});
		break;

		// Help command
		case 'help':
			// Set page
			var page = args[0];

			// Display help
			getHelp(page, function() {
				// Exit script
				process.exit();
			});
		break;

		// Other command
		default:
			// Log invalid command
			console.log('[!] Invalid command');

			// Exit script
			process.exit();
		break;
	}
}

// Process registered event
function processRegistered(client, nickname) {
	// Find network index
	var networkIndex = findNetwork(client);

	// Set network
	var network = config.networks[networkIndex];

	// Set NickServ password (network nickserv)
	var nickserv = network.identity.nickserv;

	// If NickServ password exists
	if (nickserv !== undefined) {
		// Send identification to NickServ
		rpc.emit('call', client, 'privmsg', ['nickserv', 'identify ' + nickserv]);
	}

	// Set default host mask (network mask, default mask, true)
	var mask = network.identity.mask;
	if (mask === undefined) {
		mask = config.identity.mask;
		if (mask === undefined) {
			mask = true;
		}
	}

	// If default host mask disabled
	if (!mask) {
		rpc.emit('call', client, 'mode', [nickname, '-x']);
	}

	// Remove client from registered waitlist
	waitingRegistered.splice(waitingRegistered.indexOf(client), 1);

	// Join all channels on network
	joinChannels(client, network);
}

// Process privmsg event
function processPrivmsg(client, target, nickname, message) {
	// Find and set network
	var network = config.networks[findNetwork(client)];

	// Declare channel
	var channel;

	// If target is channel
	if (isChannel(target)) {
		// Set channel index
		channel = network.channels[findChannel(network, target.toLowerCase())];
	}

	// If channel is undefined
	if (channel === undefined) {
		// Create fake channel
		channel = {'settings':{}};
	}

	// Set message, command, and args
	var message = message.split(' ');
	var command = message[0];
	var args = message.slice(1);

	// Find command indexes
	var commandIndexes = findCommand(network, channel, target, command);

	// If command is valid
	if (commandIndexes[0] !== -1) {
		// Set command and trigger
		var command = config.commands[commandIndexes[0]];
		var trigger = command.triggers[commandIndexes[1]];

		// Set minimum args (trigger minArgs, command minArgs)
		var minArgs = trigger.minArgs || command.minArgs;

		// If args meet minimum requirement
		if (args.length >= minArgs) {
			// Run command
			runCommand(client, network, channel, command, trigger, nickname, target, args);
		}
	}
}

/* CLIENT FUNCTIONS */

// Start target clients
function createClients(clients, targets, callback) {
	// If no targets
	if (targets.length === 0) {
		// If there are any networks
		if (config.networks.length > 0) {
			// For each network
			for (var i in config.networks) {
				// Add network to targets
				targets.push(config.networks[i].name);
			}
		}

		// Else (there are no networks)
		else {
			// Log no networks
			console.log('[!] Network list empty');
		}
	}

	// For each target
	for (var i in targets) {
		// Find network
		var networkIndex = findNetwork(targets[i]);

		// If network exists
		if (networkIndex !== -1) {
			// Set network
			var network = config.networks[networkIndex];

			// Set name
			var name = network.name;

			// If name is not in clients
			if (clients.indexOf(name) === -1) {
				// Set enabled (network enabled, default enabled)
				var enabled = network.settings.enabled;
				if (enabled === undefined) {
					enabled = config.settings.enabled;
				}

				// If enabled
				if (enabled) {
					// Log client creation
					console.log('Starting ' + targets[i]);

					// Set nick (network nick, default nick)
					var nick = network.identity.nick || config.identity.nick;

					// Set user (network user, default user, network nick, default nick)
					var user = network.identity.user || config.identity.user || nick;

					// Set realname (network realname, default realname, network nick, default nick)
					var realname = network.identity.real || config.identity.real || nick;

					// Set server (network server)
					var server = network.connection.server;

					// Set port (network port, 6667)
					var port = network.connection.port || 6667;

					// Set secure (network secure, enabled on 6697, disabled)
					var secure = network.connection.secure;
					if (secure === undefined) {
						// If port is 6697
						if (port === 6697) {
							secure = true;
						}

						// Else (port is not 6697)
						else {
							secure = false;
						}
					}

					// Set password (network password)
					var password = network.connection.password;

					// Create client
					rpc.emit('createClient', name, {
						nick: nick,
						user: user,
						realname: realname,
						server: server,
						port: port,
						secure: secure,
						password: password
					});

					// Add client to registered and channels waitlists
					waitingRegistered.push(name);
					waitingChannels.push(name);
				}

				// Else (not enabled)
				else {
					// Log disabled
					console.log('[!] ' + targets[i] + ' is disabled');
				}
			}

			// Else (name is in clients)
			else {
				// Log running client
				console.log('[!] ' + targets[i] + ' is already running');
			}
		}

		// Else (network does not exist)
		else {
			// Log invalid network
			console.log('[!] ' + targets[i] + ' does not exist');
		}
	}

	// Send callback
	callback();
}

// Stop target clients
function destroyClients(clients, targets, callback) {
	// If no targets
	if (targets.length === 0) {
		// If there are any clients
		if (clients.length > 0) {
			// For each network
			for (var i in clients) {
				// Add network to targets
				targets.push(clients[i]);
			}
		}

		// Else (there are no clients)
		else {
			// Log no clients
			console.log('[!] No active clients');
		}
	}

	// For each target
	for (var i in targets) {
		// Set target
		var target = targets[i];

		// If target is in clients
		if (clients.indexOf(target) !== -1) {
			// Log client destroy
			console.log('Stopping ' + target);

			// Destroy client
			rpc.emit('destroyClient', target);
		}

		// Else (target not in clients)
		else {
			// Log client not running
			console.log('[!] ' + target + ' is not running');
		}
	}

	// Send callback
	callback();
}

// Create network and save to config
function createNetwork(name, address, password, callback) {
	// If name and address are specified
	if (name && address) {
		// If network doesn't exist already
		if (findNetwork(name) === -1) {
			// Create basic network
			var network = {
				'name': name,
				'identity': {},
				'settings': {},
				'connection': {
					'server': address
				},
				'channels': [],
				'management': {
					'admins': []
				}
			};

			// Set colon index
			var colonIndex = address.indexOf(':');

			// If the address has a port in it
			if (colonIndex !== -1) {
				// Update server and port
				network.connection.server = address.substring(0, colonIndex);
				network.connection.port = address.substring(colonIndex + 1);

				// If port non numeric or negative
				if (isNaN(network.connection.port) || network.connection.port < 0) {
					// Remove custom port
					delete network.connection.port;
				}

				// Else (port is numeric and positive)
				else {
					// Update port as integer
					network.connection.port = parseInt(network.connection.port);
				}
			}

			// If password is defined
			if (password !== undefined) {
				network.connection.password = password;
			}

			// Add network to config
			config.networks.push(network);

			// Save config
			fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

			// Log network created
			console.log(name + ' created');
		}

		// Else (network exists already)
		else {
			console.log('[!] ' + name + ' already exists');
		}
	}

	// Else (name or network not specified)
	else {
		console.log('[!] Name or address not specified');
	}

	callback();
}

// Destroy network and remove from config
function destroyNetwork(name, callback) {
	// If name is specified
	if (name) {
		// Find network index
		var networkIndex = findNetwork(name);

		// If network exists
		if (networkIndex !== -1) {
			// Make sure client isn't running
			destroyClients([], [name], function() {
				// Remove network
				config.networks.splice(networkIndex, 1);

				// Save config
				fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

				// Log network destroyed
				console.log(name + ' destroyed');
			});
		}

		// Else (network does not exist)
		else {
			console.log('[!] ' + name + ' does not exist');
		}
	}

	// Else (name not specified)
	else {
		console.log('[!] Name not specified');
	}

	callback();
}

// Set admin options and save to config
function setAdmin(action, network, nick, callback) {
	// If action, network, and nick are specified
	if (action && network && nick) {
		// Find network index
		var networkIndex = findNetwork(network);

		// If network exists
		if (networkIndex !== -1) {
			// Set admin list
			var admins = config.networks[networkIndex].management.admins;

			// Set admin index
			var adminIndex = admins.indexOf(nick.toLowerCase());

			// Check action
			switch (action) {
				// Add action
				case 'add':
					// If admin does not exist
					if (adminIndex === -1) {
						// Add admin
						admins.push(nick.toLowerCase());

						// Save config
						fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

						// Log addition
						console.log(nick + ' added to admins for ' + network);
					}

					// Else (admin exists)
					else {
						console.log('[!] ' + nick + ' is already an admin for ' + network);
					}
				break;

				// Remove action
				case 'remove':
					// If admin exists
					if (adminIndex !== -1) {
						// Remove admin
						admins.splice(adminIndex, 1);

						// Save config
						fs.writeFileSync(configFile, JSON.stringify(config, null, 2));

						// Log removal
						console.log(nick + ' removed from admins for ' + network);
					}

					// Else (admin does not exist)
					else {
						console.log('[!] ' + nick + ' is not an admin for ' + network);
					}
				break;

				// Invalid action
				default:
					console.log('[!] Invalid action');
				break;
			}
		}

		// Else (network does not exist)
		else {
			console.log('[!] ' + network + ' does not exist');
		}
	}

	// Else (network or nick not specified)
	else {
		console.log('[!] Action, network, or nick not specified');
	}

	callback();
}

// Join all channels on network
function joinChannels(client, network) {
	// For each channel
	for (var i in network.channels) {
		// Set channel
		var channel = network.channels[i];

		// Set enabled (channel enabled, network enabled, default enabled)
		var enabled = channel.settings.enabled;
		if (enabled === undefined) {
			enabled = network.settings.enabled;
			if (enabled === undefined) {
				enabled = config.settings.enabled;
			}
		}

		// Join channel if required
		if (enabled) {
			rpc.emit('call', client, 'join', [channel.name]);
		}
	}

	// Remove client from channels waitlist
	waitingChannels.splice(waitingChannels.indexOf(client), 1);

	// Log ready
	console.log(client + ' ready');
}

// Run command
function runCommand(client, network, channel, command, trigger, nickname, target, args) {
	// If target is not channel
	if (!isChannel(target)) {
		// Set target to nickname of sender
		target = nickname;
	}

	// Set admin required (trigger admin, command admin, channel admin, network admin, default admin, false)
	var admin = trigger.settings.admin;
	if (admin === undefined) {
		admin = command.settings.admin;
		if (admin === undefined) {
			admin = channel.settings.admin;
			if (admin === undefined) {
				admin = network.settings.admin;
				if (admin === undefined) {
					admin = config.settings.admin;
					if (admin === undefined) {
						admin = false;
					}
				}
			}
		}
	}

	// Set admins
	var admins = network.management.admins;

	// If admin not required or nickname is admin
	if (!admin || admins.indexOf(nickname.toLowerCase()) !== -1) {
		// Set blank prefix
		var prefix = '';

		// If channel exists
		if (channel !== undefined) {
			// Update prefix (trigger prefix, command prefix, channel prefix, network prefix, default prefix)
			prefix = trigger.settings.prefix || command.settings.prefix || channel.settings.prefix || network.settings.prefix || config.settings.prefix;
		}

		// Else (channel does not exist)
		else {
			// Update prefix (trigger prefix, command prefix, network prefix, default prefix)
			prefix = trigger.settings.prefix || command.settings.prefix || network.settings.prefix || config.settings.prefix;
		}

		// Parse nickname variable in prefix
		prefix = prefix.replace(/%NAME%/g, nickname);

		// Set command function
		var commandFunction = trigger.function || command.function;

		// Call command function
		global[commandFunction](client, network, channel, command, trigger, nickname, target, args, prefix);
	}
}

/* UTILITY FUNCTIONS */

// Find network index
function findNetwork(target) {
	// For each network
	for (var i in config.networks) {
		// Set network
		var network = config.networks[i];

		// Set name
		var name = network.name;

		// If name is target
		if (name === target) {
			// Return index
			return i;
		}
	}

	// Return no match
	return -1;
}

// Find channel index
function findChannel(network, target) {
	// For each channel
	for (var i in network.channels) {
		// Set channel
		var channel = network.channels[i];

		// Set name
		var name = channel.name;

		// If name is target
		if (name === target) {
			// Return index
			return i;
		}
	}

	// Return no match
	return -1;
}

// Find command index
function findCommand(network, channel, target, key) {
	// Set blacklist
	var blacklist = channel.settings.blacklist || network.settings.blacklist || config.settings.blacklist;

	// For each command
	for (var i in config.commands) {
		// Set command
		var command = config.commands[i];

		// For each trigger
		for (var j in command.triggers) {
			// Set trigger
			var trigger = command.triggers[j];

			// Set trigger name
			var name = trigger.name;

			// Set enabled (trigger enabled, command enabled, true)
			var enabled = trigger.settings.enabled;
			if (enabled === undefined) {
				enabled = command.settings.enabled;
				if (enabled === undefined) {
					enabled = true;
				}
			}

			// If enabled
			if (enabled) {
				// Set public command (trigger publicCmd, command publicCmd, channel publicCmd, network publicCmd, default publicCmd, true)
				var publicCmd = trigger.settings.publicCmd;
				if (publicCmd === undefined) {
					publicCmd = command.settings.publicCmd;
					if (publicCmd === undefined) {
						publicCmd = channel.settings.publicCmd;
						if (publicCmd === undefined) {
							publicCmd = network.settings.publicCmd;
							if (publicCmd === undefined) {
								publicCmd = config.settings.publicCmd;
								if (publicCmd === undefined) {
									publicCmd = true;
								}
							}
						}
					}
				}

				// Set private command (trigger privateCmd, command privateCmd, channel privateCmd, network privateCmd, default privateCmd, inverse public command)
				var privateCmd = trigger.settings.privateCmd;
				if (privateCmd === undefined) {
					privateCmd = command.settings.privateCmd;
					if (privateCmd === undefined) {
						privateCmd = channel.settings.privateCmd;
						if (privateCmd === undefined) {
							privateCmd = network.settings.privateCmd;
							if (privateCmd === undefined) {
								privateCmd = config.settings.privateCmd;
								if (privateCmd === undefined) {
									privateCmd = !publicCmd;
								}
							}
						}
					}
				}

				// If target is channel and command is public or target is not channel and command is private
				if ((isChannel(target) && publicCmd) || (!isChannel(target) && privateCmd)) {
					// Set symbol (trigger symbol, command symbol, channel symbol, network symbol, default symbol)
					var symbol = trigger.settings.symbol;
					if (symbol === undefined) {
						symbol = command.settings.symbol;
						if (symbol === undefined) {
							symbol = channel.settings.symbol;
							if (symbol === undefined) {
								symbol = network.settings.symbol;
								if (symbol === undefined) {
									symbol = config.settings.symbol;
								}
							}
						}
					}

					// Set case sensitivity (trigger cases, command cases, channel cases, network cases, default cases)
					var cases = trigger.settings.cases;
					if (cases === undefined) {
						cases = command.settings.cases;
						if (cases === undefined) {
							cases = channel.settings.cases;
							if (cases === undefined) {
								cases = network.settings.cases;
								if (cases === undefined) {
									cases = config.settings.cases;
								}
							}
						}
					}

					// If command is not in blacklist
					if (blacklist.indexOf(name) === -1 || (!cases && blacklist.indexOf(name.toLowerCase()) === -1)) {
						// Add symbol to name
						name = symbol + name;

						// If trigger is key
						if (name === key || (!cases && name.toLowerCase() === key.toLowerCase())) {
							// Return match indexes
							return [i, j];
						}
					}
				}
			}
		}
	}

	// Return no match
	return [-1];
}

// Show help page
function getHelp(page, callback) {
	// Set output message
	var message = [];

	// Set file
	var file = process.argv[1];
	file = file.substring(file.lastIndexOf('/') + 1);

	// Check page
	switch(page) {
		// List page
		case 'list':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' list',
				'- Description:',
				'  Lists all clients running in background'
			];
		break;

		// Start page
		case 'start':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' start [clients]',
				'- Description:',
				'  Starts clients specified in space-separated [clients] list',
				'  Starts all clients if none specified'
			];
		break;

		// Stop page
		case 'stop':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' stop [clients]',
				'- Description:',
				'  Stops clients specified in space-separated [clients] list',
				'  Stops all clients if none specified'
			];
		break;

		// Restart page
		case 'restart':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' restart [clients]',
				'- Description:',
				'  Restarts clients specified in space-separated [clients] list',
				'  Restarts all clients if none specified'
			];
		break;

		// Create page
		case 'create':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' create <name> <server[:<port>]> [password]',
				'- Description:',
				'  Creates network <name> with server <server>, port <port>, and password [password]',
				'  Sets port to 6667 if none specified',
				'  Sets connection to secure if port 6697',
				'  Ignores server password if none specified'
			];
		break;

		// Destroy page
		case 'destroy':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' destroy <name>',
				'- Description:',
				'  Stops and destroys network <name>'
			];
		break;

		// Admin page
		case 'admin':
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' admin <action> <network> <nick>',
				'- Description:',
				'  Sets nick <nick> on admin list of network <network> based on action <action>',
				'  Action can be \'add\' or \'remove\''
			];
		break;

		// Help page
		case 'help':
		// No page
		case undefined:
		// Invalid page
		default:
			// Update message
			message = [
				'- Usage:',
				'  node ' + file + ' help [page]',
				'- Available help pages:',
				'  list, start, stop, restart, create, destroy, admin',
				'- To resume client execution:',
				'  node ' + file
			];
		break;
	}

	// Log output
	console.log(message.join('\n'));

	// Send callback
	callback();
}

// Exit script when ready
function exitReady(force) {
	// If forced
	if (force) {
		// Exit process with error
		process.exit(1);
	}

	// Else (not forced) if registered and channel waitlists are empty
	else if (waitingRegistered.length === 0 && waitingChannels.length === 0) {
		// Exit process
		process.exit();
	}

	// Else (registered and channel waitlists are not empty)
	else {
		// Attempt to quit again in 250ms
		setTimeout(function() {
			exitReady(force);
		}, 250);
	}
}

// Determine if input is a channel
global.isChannel = function isChannel(input) {
	return input.indexOf('#') === 0;
};
