module.exports = {
	controlHue: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.hue !== undefined) {
			var hueAccessToken = config.apis.hue.accessToken;
			var hueBridgeId = config.apis.hue.bridgeId;
		}

		if (hueAccessToken !== undefined && hueBridgeId !== undefined) {
			if (args.length === 0) {
				var statusUrl = 'https://www.meethue.com/api/getbridge?token=' + hueAccessToken + '&bridgeid=' + hueBridgeId;

				request(statusUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						var lightCount = Object.keys(data.lights).length;
						var activeLightCount = 0;

						for (var i in data.lights)
							if (data.lights[i].state.on)
								activeLightCount ++;

						var activeLightCountNatural = activeLightCount;

						if (activeLightCount === 0)
							activeLightCountNatural = 'none';

						else if (activeLightCount === lightCount)
							activeLightCountNatural = 'all';

						var lightGrammar = 'are';

						if (activeLightCount === 1)
							lightGrammar = 'is';

						rpc.emit('call', client, 'privmsg', [target, prefix + 'Hue is currently controlling ' + lightCount + ' lights, ' + activeLightCountNatural + ' of which ' + lightGrammar + ' lit.']);
					}
				});
			}

			else {
				var cmd = args[0];

				var hueUrl = 'https://www.meethue.com/api/sendmessage?token=' + hueAccessToken;

				var contentType = 'application/x-www-form-urlencoded';

				var commandUrlSlug;
				var commandMethod;
				var commandBody;

				var actionMessage;

				switch(cmd) {
					case 'on':
						commandUrlSlug = 'groups/0/action';
						commandMethod = 'PUT';
						commandBody = '{"on": true}';

						actionMessage = 'All lights turned on.';
						break;
					case 'off':
						commandUrlSlug = 'groups/0/action';
						commandMethod = 'PUT';
						commandBody = '{"on": false}';

						actionMessage = 'All lights turned off.';
						break;
					case 'cycle':
					case 'party':
					case 'disco':
						commandUrlSlug = 'groups/0/action';
						commandMethod = 'PUT';
						commandBody = '{"effect": "colorloop"}';

						actionMessage = 'All lights turned to ' + cmd + ' mode.';
						break;
					case 'brightness':
					case 'bright':
					case 'level':
						var level = args[1];

						if (isNaN(level))
							level = 100;
						else
							level = Math.round(level);

						level = Math.min(Math.max(level, 1), 100);

						commandUrlSlug = 'groups/0/action';
						commandMethod = 'PUT';
						commandBody = '{"bri": ' + Math.ceil(level / 100 * 254) + '}';

						actionMessage = 'All lights adjusted to ' + level + '% brightness.';
						break;
				}

				var requestBody = 'clipmessage={bridgeId: "' + hueBridgeId + '", clipCommand: {url: "/api/0/' + commandUrlSlug + '", method: "' + commandMethod + '", body: ' + commandBody + '}}';

				request.post({
					url: hueUrl,
					headers: {
						'Content-Type': contentType
					},
					body: requestBody
				}, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
					}
				});
			}
		}
	}
};
