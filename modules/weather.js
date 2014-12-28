module.exports = {
	getWeather: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.google !== undefined && config.apis.forecast !== undefined) {
			var googleKey = config.apis.google.key;
			var forecastKey = config.apis.forecast.key;
		}

		if (googleKey !== undefined && forecastKey !== undefined) {

			var input;

			if (args.length === 0) {
				if (save.profiles[client] !== undefined && save.profiles[client][nickname.toLowerCase()] !== undefined)
					input = save.profiles[client][nickname.toLowerCase()].location;
			}

			else
				input = args.join(' ');

			if (input !== undefined) {
				var location = iconv.decode(new Buffer(input), 'ISO-8859-1');
				var geocodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location.replace(' ', '+') + '&sensor=false&key=' + googleKey;

				request(geocodingUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						if (data.status === 'OK') {
							var address = data.results[0].formatted_address;

							var lat = data.results[0].geometry.location.lat;
							var lng = data.results[0].geometry.location.lng;
							var forecastUrl = 'https://api.forecast.io/forecast/' + forecastKey + '/' + lat + ',' + lng + '?units=auto';

							request(forecastUrl, function (error, response, body) {
								if (!error && response.statusCode === 200) {
									data = JSON.parse(body);

									var summary = data.currently.summary;
									var temperature = data.currently.temperature;
									var humidity = data.currently.humidity * 100;
									var units = data.flags.units;

									var time = data.currently.time;
									var offset = data.offset;
									var timeValue = moment.unix(time).utc().add(offset, 'hours');
									var timeString = timeValue.format('h:mm A on dddd, MMMM Do');

									var altTemperature;
									var symbol;
									var altSymbol;

									switch (units) {
										case 'us':
											altTemperature = toCelsius(temperature);
											symbol = 'F';
											altSymbol = 'C'; 
										break;
										default:
											altTemperature = toFahrenheit(temperature);
											symbol = 'C';
											altSymbol = 'F';
										break;
									}

									var output = summary + ' (' + Math.round(temperature) + '°' + symbol + '/' + Math.round(altTemperature) + '°' + altSymbol + ') with ' + Math.round(humidity) + '% humidity in ' + address + ' at ' + timeString;
									rpc.emit('call', client, 'privmsg', [target, prefix + output]);
								}
							});
						}

						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The location \'' + location + '\' could not be found']);
					}
				});
			}
		}
	},

	toFahrenheit: function(celsius) {
		return celsius * 9 / 5 + 32;
	},

	toCelsius: function(fahrenheit) {
		return (fahrenheit - 32) * 5 / 9;
	}
};
