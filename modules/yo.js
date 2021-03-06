module.exports = {
	sendYo: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.yo !== undefined) {
			var yoName = config.apis.yo.name;
			var yoKey = config.apis.yo.key;
		}

		if (yoName !== undefined && yoKey !== undefined) {
			var targetUser = args[0];

			if (targetUser.charAt(0) === '@') {
				var alias = targetUser.substring(1).toLowerCase();

				if (save.profiles[client] !== undefined && save.profiles[client][alias] !== undefined)
					if (save.profiles[client][alias].yo !== undefined)
						targetUser = save.profiles[client][alias].yo;
			}

			if (targetUser.charAt(0) === '@')
				rpc.emit('call', client, 'privmsg', [target, prefix + 'The nickname \'' + targetUser.substring(1) + '\' is invalid']);

			else {
				var link = args[1];
				var validLink = true;
				if (link !== undefined) {
					var regexp = /(http|https):\/\/.*\..*/;
					var validLink = regexp.test(link);
				}

				if (!validLink)
					link = undefined;

				var yoUrl = 'http://api.justyo.co/yo/';

				request.post(yoUrl, {
					form: {
						api_token: yoKey,
						username: targetUser,
						link: link
					}
				}, function (error, response, body) {
					if (!error && response.statusCode === 200)
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Sent a Yo to ' + targetUser.toUpperCase() + ' (Make sure they\'ve sent a Yo to ' + yoName.toUpperCase() + ' before)']);

					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'The Yo to ' + targetUser.toUpperCase() + ' is invalid (Wait a minute and try again)']);
				});
			}
		}
	}
};
