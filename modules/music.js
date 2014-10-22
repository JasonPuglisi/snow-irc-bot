module.exports = {
	getLastfmListening: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.lastfm !== undefined)
			var lastfmKey = config.apis.lastfm.key;

		if (lastfmKey !== undefined) {
			if (args.length === 0) {
				if (profileData[client] !== undefined && profileData[client][nickname.toLowerCase()] !== undefined) {
					var profileLastfm = profileData[client][nickname.toLowerCase()].lastfm;
					var input = profileLastfm;
				}
			}

			else
				var input = args[0];

			if (input !== undefined) {
				var user = iconv.decode(new Buffer(input), 'ISO-8859-1');
				var listeningUrl = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + user + '&api_key=' + lastfmKey + '&limit=1&format=json';

				request(listeningUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						var userString = user;
						if (data.recenttracks !== undefined) {
							if (data.recenttracks['@attr'] && data.recenttracks['@attr'].user) {
								if (profileLastfm === undefined)
									userString = data.recenttracks['@attr'].user + ' is ';
								else
									userString = 'You\'re ';
							}

							if (data.recenttracks.track && data.recenttracks.track[0] && data.recenttracks.track[0]['@attr']) {

								var track = data.recenttracks.track[0].name;
								var artist = data.recenttracks.track[0].artist['#text'];
								var url = data.recenttracks.track[0].url;

								rpc.emit('call', client, 'privmsg', [target, prefix + userString + 'listening to \'' + track + '\' by ' + artist]);
							}

							else
								rpc.emit('call', client, 'privmsg', [target, prefix + userString + 'not listening to anything']);
						}


						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The user \'' + user + '\' does not exist']);
					}
				});
			}
		}
	}
};
