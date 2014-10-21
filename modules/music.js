module.exports = {
	getLastfmPlaying: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.lastfm !== undefined)
			var lastfmKey = config.apis.lastfm.key;

		if (lastfmKey !== undefined) {
			if (args.length === 0) {
				if (profileData[client] !== undefined && profileData[client][nickname.toLowerCase()] !== undefined)
					var input = profileData[client][nickname.toLowerCase()].lastfm;
			}

			else
				var input = args[0];

			if (input !== undefined) {
				var user = iconv.decode(new Buffer(input), 'ISO-8859-1');
				var playingUrl = 'http://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks&user=' + user + '&api_key=' + lastfmKey + '&limit=1&format=json';

				request(playingUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						if (data.recenttracks !== undefined) {
							if (data.recenttracks.track && data.recenttracks.track[0] && data.recenttracks.track[0]['@attr']) {
								var track = data.recenttracks.track[0].name;
								var artist = data.recenttracks.track[0].artist['#text'];
								var url = data.recenttracks.track[0].url;

								rpc.emit('call', client, 'privmsg', [target, prefix + user + ' is playing \'' + track + '\' by ' + artist]);
							}

							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'The user \'' + user + '\' is not playing anything']);
						}


						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The user \'' + user + '\' does not exist']);
					}
				});
			}
		}
	}
};
