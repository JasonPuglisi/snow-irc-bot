module.exports = {
	setMy: function(client, network, channel, command, trigger, nickname, target, arguments, prefix) {
		var option = arguments[0];
		var value = arguments.slice(1).join(' ');

		if (option.length <= 25 && option !== ' ') {
			if (profileData[client] === undefined)
				profileData[client] = {};
			if (profileData[client][nickname.toLowerCase()] === undefined)
				profileData[client][nickname.toLowerCase()] = {};

			if (option === '*') {
				var keys = Object.keys(profileData[client][nickname.toLowerCase()]);

				if (keys.length > 0)
					rpc.emit('call', client, 'privmsg', [target, prefix + 'You have the following data saved: ' + keys.sort().join(', ')]);

				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'You have no data saved']);
			}

			else if (value === '') {
				if (profileData[client][nickname.toLowerCase()][option.toLowerCase()] !== undefined)
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' is \'' + profileData[client][nickname.toLowerCase()][option.toLowerCase()] + '\'']);

				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' is not saved']);
			}

			else {
				if (value === '-') {
					delete profileData[client][nickname.toLowerCase()][option.toLowerCase()];
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' has been removed']);
				}

				else {
					if (value.length <= 100) {
						profileData[client][nickname.toLowerCase()][option.toLowerCase()] = value;
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' has been updated to \'' + value + '\'']);
					}

					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Your ' + option.toLowerCase() + ' input is too long']);
				}

				fs.writeFileSync(myFile, JSON.stringify(profileData));
			}
		}

		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'Your option \'' + option.toLowerCase() + '\' is too long']);
	},

	setMyOther: function(client, network, channel, command, trigger, nickname, target, arguments, prefix) {
		nickname = arguments[0];
		arguments = arguments.slice(1);
		prefix += '[' + nickname + '] ';

		setMy(client, network, channel, command, trigger, nickname, target, arguments, prefix);
	},

	viewProfile: function(client, network, channel, command, trigger, nickname, target, arguments, prefix) {
		var user = arguments[0];
		var page = arguments[1];

		if (page === undefined || isNaN(page))
			page = 0;

		if (profileData[client] !== undefined && profileData[client][user.toLowerCase()] !== undefined) {
			var data = profileData[client][user.toLowerCase()];

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
