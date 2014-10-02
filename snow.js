/* DEPENDENCIES AND SETTINGS */

global.configFile = 'config.json';
global.config = require('./' + configFile);

global.myFile = 'my.json';
global.myData = require('./' + myFile);

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
	// Set process arguments
	var file = process.argv[1];
	var command = process.argv[2];
	var arguments = process.argv.slice(3);

	// Check command
	switch(command) {
		// No command
		case undefined:
			// List clients and resume execution
			console.log('Resuming execution. Active clients: ' + clients.join(' '));
		break;

		// List command
		case 'list':
			// List clients and exit
			console.log('Active clients: ' + clients.join(' '));

			// Exit script
			process.exit();
		break;

		// Start command
		case 'start':
			// Set targets
			var targets = arguments;

			// List target clients
			console.log('Starting clients: ' + (targets.join(' ') || '*'));

			// Start target clients
			createClients(clients, targets);

			// Exit script
			setTimeout(function() {
				process.exit();
			}, 3000);
		break;

		// Stop command
		case 'stop':
			// Set targets
			var targets = arguments;

			// List target clients
			console.log('Stopping clients: ' + (targets.join(' ') || '*'));

			// Stop target clients
			destroyClients(clients, targets);

			// Exit script
			setTimeout(function() {
				process.exit();
			}, 3000);
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

	// Join all channels on network after pause
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

		// Set message, command, and arguments
		var message = message.split(' ');
		var command = message[0];
		var arguments = message.slice(1);

		// Find command indexes
		var commandIndexes = findCommand(network, channel, command);

		// If command is valid
		if (commandIndexes[0] !== -1) {
			// Set command and trigger
			var command = config.commands[commandIndexes[0]];
			var trigger = command.triggers[commandIndexes[1]];

			// Set minimum arguments
			var args = trigger.args || command.args;

			// If arguments meet minimum requirement
			if (arguments.length >= args) {
				// Run command
				runCommand(client, network, channel, command, trigger, nickname, target, arguments);
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
function createClients(clients, targets) {
	// For each network
	for (var i in config.networks) {
		// Set network
		var network = config.networks[i];

		// Set name
		var name = network.name;

		// If name is not in clients
		if (clients.indexOf(name) === -1) {
			// If no targets or name is in targets
			if (targets.length === 0 || targets.indexOf(name) !== -1) {
				// Set enabled (network enabled, default enabled)
				var enabled = network.settings.enabled;
				if (enabled === undefined) {
					enabled = config.settings.enabled;
				}

				// If enabled
				if (enabled) {
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

					// Set secure (network secure, disabled)
					var secure = network.connection.secure;
					if (secure === undefined) {
						secure = false;
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
				}
			}
		}
	}
}

// Stop target clients
function destroyClients(clients, targets) {
	// For each client
	for (var i in clients) {
		// Set client
		var client = clients[i];

		// If no targets or client is in target
		if (targets.length === 0 || targets.indexOf(client) !== -1) {
			// Destroy client
			rpc.emit('destroyClient', client);
		}
	}
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
}

// Run command
function runCommand(client, network, channel, command, trigger, nickname, target, arguments) {
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
		global[commandFunction](client, network, channel, command, trigger, nickname, target, arguments, prefix);
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

				// If case sensitivity disabled
				if (!cases) {
					// Remove case sensitivity from symbol, name, and target
					symbol = symbol.toLowerCase();
					name = name.toLowerCase();
					target = target.toLowerCase();
				}

				// If command is not in blacklist
				if (blacklist.indexOf(name) === -1) {
					// Add symbol to name
					name = symbol + name;

					// If trigger is target
					if (name === target) {
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
