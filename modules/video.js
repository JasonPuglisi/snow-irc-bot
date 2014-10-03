module.exports = {
	getVideo: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.google !== undefined)
			var googleKey = config.apis.google.key;

		if (googleKey !== undefined) {
			if (args.length === 0) {
				if (profileData[client] !== undefined && profileData[client][nickname.toLowerCase()] !== undefined)
					var input = profileData[client][nickname.toLowerCase()].video;
			}

			else
				var input = args.join(' ');

			if (input !== undefined) {
				var video = iconv.decode(new Buffer(input), 'ISO-8859-1');
				var youtubeUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + video.replace(' ', '+') + '&key=' + googleKey;

				request(youtubeUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						if (data.items[0] !== undefined) {
							var videoId = data.items[0].id.videoId;
							var videoTitle = data.items[0].snippet.title;
							rpc.emit('call', client, 'privmsg', [target, prefix + videoTitle + ' • http://youtu.be/' + videoId]);
						}

						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The video \'' + video + '\' could not be found']);
					}
				});
			}
		}
	}
};
