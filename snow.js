/* DEPENDENCIES AND SETTINGS */

global.configFile = 'config.json';
global.config = require('./' + configFile);

global.profileFile = 'profiles.json';
global.profileData = require('./' + profileFile);

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

// Set JSMegaHAL settings
global.megahal = new jsmegahal(4);

megahal.addMass(fs.readFileSync('brain.txt', 'utf8'));

// Set global variables
var waitingRegistered = [];
var waitingChannels = [];

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
				console.log('Resuming execution: ' + clients.join(' '));
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
			// Log clients
			console.log('Clients: ' + clients.join(' '));

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

	// If target is channel
	if (target.charAt(0) === '#') {
		// Set channel
		var channel = network.channels[findChannel(network, target.toLowerCase())];

		// Set message, command, and args
		var message = message.split(' ');
		var command = message[0];
		var args = message.slice(1);

		// Find command indexes
		var commandIndexes = findCommand(network, channel, command);

		// If command is valid
		if (commandIndexes[0] !== -1) {
			// Set command and trigger
			var command = config.commands[commandIndexes[0]];
			var trigger = command.triggers[commandIndexes[1]];

			// Set minimum args
			var minArgs = trigger.args || command.args;

			// If args meet minimum requirement
			if (args.length >= minArgs) {
				// Run command
				runCommand(client, network, channel, command, trigger, nickname, target, args);
			}
		} else {
			// Set message functions (channel functions, network functions, default functions)
			var functions = channel.settings.functions || network.settings.functions || config.settings.functions;

			// For each message function
			for (var i in functions) {
				// Set function
				var messageFunction = functions[i];

				// Call message function
				global[messageFunction](client, network, channel, nickname, target, message);
			}
		}
	}
}

/* CLIENT FUNCTIONS */

// Start target clients
function createClients(clients, targets, callback) {
	// If no targets
	if (targets.length === 0) {
		// For each network
		for (var i in config.networks) {
			// Add network to targets
			targets.push(config.networks[i].name);
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
					var realname = network.identity.realname || config.identity.realname || nick;

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
		// For each network
		for (var i in config.networks) {
			// Add network to targets
			targets.push(config.networks[i].name);
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
}

// Run command
function runCommand(client, network, channel, command, trigger, nickname, target, args) {
	// Set admin required (trigger admin, command admin, channel admin, network admin, default admin)
	var admin = trigger.settings.admin;
	if (admin === undefined) {
		admin = command.settings.admin;
		if (admin === undefined) {
			admin = channel.settings.admin;
			if (admin === undefined) {
				admin = network.settings.admin;
				if (admin === undefined) {
					admin = config.settings.admin;
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
function findCommand(network, channel, target) {
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
				// Set symbol (trigger symbol, command symbol, channel symbol, network symbol, default symbol)
				var symbol = trigger.settings.symbol || command.settings.symbol || channel.settings.symbol || network.settings.symbol || config.settings.symbol;
				if (trigger.settings.symbol === '') {
					symbol = '';
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

					// If trigger is target
					if (name === target || (!cases && name.toLowerCase() === target.toLowerCase())) {
						// Return match indexes
						return [i, j];
					}
				}
			}
		}
	}

	// Return no match
	return [-1];
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
