module.exports = {
	getSteamGaming: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.steam !== undefined)
			var steamKey = config.apis.steam.key;

		if (steamKey !== undefined) {
			if (args.length === 0) {
				if (save.profiles[client] !== undefined && save.profiles[client][nickname.toLowerCase()] !== undefined) {
					var profileSteam = save.profiles[client][nickname.toLowerCase()].steam;
					var input = profileSteam;
				}
			}

			else
				var input = args[0];

			if (input !== undefined) {
				var user = iconv.decode(new Buffer(input), 'ISO-8859-1');
				var steamIdUrl = 'http://steamcommunity.com/id/' + user + '/?xml=1';

				request(steamIdUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						parseXml.parseString(body, function (error, result) {
							if (!result.response || !result.response.error) {
								var steamId = result.profile.steamID64[0];
								var gamingUrl = 'http://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=' + steamKey + '&steamids=' + steamId;

								request(gamingUrl, function (error, response, body) {
									if (!error && response.statusCode === 200) {
										var data = JSON.parse(body);

										var userString;
										if (profileSteam === undefined)
											userString = data.response.players[0].personaname + ' is ';

										else
											userString = 'You\'re ';

										if (data.response.players[0].gameextrainfo)
											rpc.emit('call', client, 'privmsg', [target, prefix + userString + 'gaming in ' + data.response.players[0].gameextrainfo]);

										else
											rpc.emit('call', client, 'privmsg', [target, prefix + userString + 'not gaming in anything']);
									}
								});
							}

							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'The user \'' + user + '\' does not exist']);
						});
					}
				});
			}
		}
	}
};
