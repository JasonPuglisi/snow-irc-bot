module.exports = {
	announce: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var chan = args[0];
		var cmd = args[1];

		if (chan.indexOf('#') === 0)
			switch(cmd) {
				case 'on':
					break;
				case 'off':
					break;
				case 'set':
					if (args.length > 3) {
						var set = args[2];
						var cmd = args[3];
						var args = args.slice(4);
						announceSet(chan, set, cmd, args, client, target, prefix);
					}
					break;
				case 'msg':
					break;
				case 'list':
					break;
				default:
					announceInvalid(cmd, client, target, prefix);
					break;
			}
		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'The input \'' + chan + '\' is not a channel']);

	},
	announceOn: function() {

	},
	announceOff: function() {

	},
	announceSet: function(chan, set, cmd, args, client, target, prefix) {
		announceInit(chan, client);

		switch(cmd) {
			case 'add':
				if (save.announcements[client][chan][set] === undefined) {
					save.announcements[client][chan][set] = {'msg':{},'alias':false,'default':false,'interval':false,'date':{'start':false,'end':false},'time':{'start':false,'end':false}};

					if (Object.keys(save.announcements[client][chan]).length === 1)
						save.announcements[client][chan][set].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'Created the set \'' + set + '\'']);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' already exists']);
				break;
			case 'remove':
				if (save.announcements[client][chan][set] !== undefined) {
					delete save.announcements[client][chan][set];
					for (var i in save.announcements[client][chan])
						if (save.announcements[client][chan][i].alias === set)
							delete save.announcements[client][chan][i];

					if (Object.keys(save.announcements[client][chan]).length === 1)
						save.announcements[client][chan][Object.keys(save.announcements[client][chan])[0]].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'Destroyed the set \'' + set + '\'']);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' does not exist']);
				break;
			case 'alias':
				if (args.length > 0) {
					var alias = args[0];
					if (save.announcements[client][chan][set] === undefined) {
						if (save.announcements[client][chan][alias] !== undefined) {
							save.announcements[client][chan][set] = {'alias':alias,'default':false,'interval':false,'date':{'start':false,'end':false},'time':{'start':false,'end':false}};

							rpc.emit('call', client, 'privmsg', [target, prefix + 'Created the alias \'' + set + '\' of set \'' + alias + '\'']);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The set to alias \'' + alias + '\' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' already exists']);
				}
				break;
			case 'copy':
				if (args.length > 0) {
					var copy = args[0];
					if (save.announcements[client][chan][set] === undefined) {
						if (save.announcements[client][chan][copy] !== undefined) {
							if (save.announcements[client][chan][copy].alias === false) {
								save.announcements[client][chan][set] = JSON.parse(JSON.stringify(save.announcements[client][chan][copy]));
								save.announcements[client][chan][set].default = false;

								rpc.emit('call', client, 'privmsg', [target, prefix + 'Created the copy \'' + set + '\' of set \'' + copy + '\'']);

								fs.writeFileSync(saveFile, JSON.stringify(save));
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'The set to copy \'' + copy + '\' is an alias']);
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The set to copy \'' + copy + '\' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' already exists']);
				}
				break;
			case 'rename':
				if (args.length > 0) {
					var name = args[0];
					if (save.announcements[client][chan][name] === undefined) {
						if (save.announcements[client][chan][set] !== undefined) {
							save.announcements[client][chan][name] = JSON.parse(JSON.stringify(save.announcements[client][chan][set]));
							delete save.announcements[client][chan][set];

							rpc.emit('call', client, 'privmsg', [target, prefix + 'Renamed the set \'' + set + '\' to \'' + name + '\'']);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The set to rename \'' + set + '\' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + name + '\' already exists']);
				}
				break;
			case 'default':
				if (save.announcements[client][chan][set] !== undefined) {
					for (var i in save.announcements[client][chan])
						if (save.announcements[client][chan][i].default)
							save.announcements[client][chan][i].default = false;

					save.announcements[client][chan][set].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' is now default']);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'The set \'' + set + '\' does not exist']);
				break;
			case 'update':
				break;
			default:
				announceInvalid(cmd, client, target, prefix);
				break;
		}
	},
	announceMsg: function() {

	},
	announceList: function() {

	},
	announceInvalid: function(cmd, client, target, prefix) {
		rpc.emit('call', client, 'privmsg', [target, prefix + 'The command \'' + cmd + '\' is not valid (Commands: https://github.com/JasonPuglisi/snow-irc-bot/blob/master/announcer_reference.md)']);
	},
	announceInit: function(chan, client) {
		if (save.announcements === undefined)
			save.announcements = {};
		if (save.announcements[client] === undefined)
			save.announcements[client] = {};
		if (save.announcements[client][chan] === undefined)
			save.announcements[client][chan] = {};
	}
};
