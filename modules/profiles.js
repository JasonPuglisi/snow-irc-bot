module.exports = {
	setMy: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var option = args[0];
		var value = args.slice(1).join(' ');

		if (option.length <= 25 && option !== ' ') {
			if (save.profiles === undefined)
				save.profiles = {};
			if (save.profiles[client] === undefined)
				save.profiles[client] = {};
			if (save.profiles[client][nickname.toLowerCase()] === undefined)
				save.profiles[client][nickname.toLowerCase()] = {};

			if (option === '*') {
				var keys = Object.keys(save.profiles[client][nickname.toLowerCase()]);

				if (keys.length > 0)
					rpc.emit('call', client, 'privmsg', [target, prefix + 'You have the following data saved: ' + keys.sort().join(', ')]);

				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'You have no data saved']);
			}

			else if (value === '') {
				if (save.profiles[client][nickname.toLowerCase()][option.toLowerCase()] !== undefined)
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' is \'' + save.profiles[client][nickname.toLowerCase()][option.toLowerCase()] + '\'']);

				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' is not saved']);
			}

			else {
				if (value === '-') {
					delete save.profiles[client][nickname.toLowerCase()][option.toLowerCase()];
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' has been removed']);
				}

				else {
					if (value.length <= 100) {
						save.profiles[client][nickname.toLowerCase()][option.toLowerCase()] = value;
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' has been updated to \'' + value + '\'']);
					}

					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' input is too long']);
				}

				fs.writeFileSync(saveFile, JSON.stringify(save));
			}
		}

		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'Your option \'' + option.toLowerCase() + '\' is too long']);
	},

	setMyOther: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		nickname = args[0];
		args = args.slice(1);
		prefix += '[' + nickname + '] ';

		setMy(client, network, channel, command, trigger, nickname, target, args, prefix);
	},

	viewProfile: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var user = args[0];
		var page = args[1];

		if (page === undefined || isNaN(page))
			page = 0;

		if (save.profiles[client] !== undefined && save.profiles[client][user.toLowerCase()] !== undefined) {
			var data = save.profiles[client][user.toLowerCase()];

			if (Object.keys(data).length > 0) {
				var lines = [];

				for (var i in data)
					lines.push(i + ': ' + data[i]);

				lines.sort();

				for (var i in lines)
					rpc.emit('call', client, 'privmsg', [target, '-*- ' + lines[i]]);
			}

			else
				rpc.emit('call', client, 'privmsg', [target, prefix + 'The nickname \'' + user + '\' has no data saved']);
		}

		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'The nickname \'' + user + '\' has no data saved']);
	}
};
