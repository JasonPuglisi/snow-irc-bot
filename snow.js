/* DEPENDENCIES AND SETTINGS */

// File Configuration
var configFile = 'snow.json';
var config = require('./' + configFile);

// Dependencies
for (var i in config.dependencies)
	global[i] = require(config.dependencies[i]);

// Settings
for (var i in config.settings)
	global[i] = config.settings[i];

// APIs
for (var i in config.apis)
	for (var j in config.apis[i])
		global[i + j.charAt(0).toUpperCase() + j.substring(1)] = config.apis[i][j];

// HTML Entities Configuration
var entities = new htmlEntities.XmlEntities();

// IRC Configuration
var defaultChannel = channels[0];

var client = new irc.Client(server, name, {
	userName: name,
	realName: name,
	port: 6697,
	secure: true,
	selfSigned: true
});

/* IRC LISTENERS */

// Registered Listener
client.addListener('registered', function (message) {
	// Identify with NickServ
	client.say('nickserv', 'identify ' + namePassword);

	// Join channels after pause
	setTimeout(function() {
		for (var i = 0; i < channels.length; i++)
			client.join(channels[i]);
	}, 250);

	// Start thread checker
	checkThread();
});

// Channel Message Listener
client.addListener('message#', function (nick, to, text, message) {
	// Split message into command and arguments
	var msg = text.split(' ');
	var cmd = msg[0];
	var args = msg.slice(1);

	// Set prefix for channel messages
	var prefix = nick + ': ';

	// Check if channel is default channel
	var isDefaultChannel = to === defaultChannel;

	// Check if default bot is in default channel
	var defaultBotPresent = users.indexOf(defaultBot) !== -1 && to === defaultChannel;

	// Get information for each possible command
	for (var i in commands) {
		// Set command information
		var command = commands[i];
		var commandName = command.name;
		var commandFunction = command.function;
		var commandMinArgs = command.minArgs;

		// Get information for each possible command match
		for (var j in command.commands) {
			// Set command match information
			var commandMatch = command.commands[j];
			var commandMatchName = commandMatch.command;
			var commandMatchSymbol = commandMatch.symbol;
			var commandMatchExclusive = commandMatch.exclusive;

			// Add symbol to command match name
			if (commandMatchSymbol)
				commandMatchName = symbol + commandMatchName;

			// Check if command is a match to input
			var commandMatched = cmd === commandMatchName;

			// Validate matched command
			if (commandMatched) {
				// Check if there are enough args
				var enoughArgs = args.length >= commandMinArgs;

				// Check if exclusivity is met
				var exclusivityMet = commandMatchExclusive || !defaultBotPresent;

				// Check if command is valid
				var commandValid = enoughArgs && exclusivityMet;

				// Execute valid command
				if (commandValid)
					global[commandFunction](nick, to, text, message, msg, cmd, args, prefix);
			}
		}
	}

	// Check if main admin is in default channel
	var mainAdminPresent = users.indexOf(admins[0]) !== -1;

	// Log channel message to console
	if (!mainAdminPresent) console.log('[' + to + '] ' + nick + ': ' + text);

	// Set curse keywords
	var curses = ['curse', 'cursing'];

	// Assume no curse present in message
	var curse = false;

	// Check if curse is present in message
	for (var i in curses) {
		var curseFound = text.toLowerCase().indexOf(curses[i]) !== -1;
		var reverseCurseFound = text.toLowerCase().split('').reverse().join('').indexOf(curses[i]) !== -1;

		// Set curse present in message
		if (curseFound || reverseCurseFound)
			curse = true;
	}

	// Convert curse instances to bless instances
	if (curse) {
		var output = text;
		for (var i = 0; i < 2; i++) output = curseToBless(output.split('').reverse().join(''));
		client.say(to, output);
	}
});

// Private Message Listener
client.addListener('pm', function (nick, text, message) {
	// Split message into command and arguments
	var msg = text.split(' ');
	var cmd = msg[0];
	var args = msg.slice(1);

	// Check if user is admin
	var isAdmin = admins.indexOf(nick) !== -1;

	// Set private message commands
	var sayCmd = 'say';
	var actCmd = 'act';
	var joinCmd = 'join';
	var partCmd = 'part';

	// Execute private message commands
	if (isAdmin) {
		// Set channel and message
		var chan = args[0];
		var msg = args.slice(1).join(' ');

		// Check if channel is valid
		var isValidChannel = channels.indexOf(chan) !== -1;
		var isValidChannelJoin = channels.indexOf(chan) === -1 && chan.length > 1 && chan.charAt(0) === '#';

		// Set invalid channel message
		var invalidMsg = 'The channel\'' + chan + '\' is not valid';

		// Check if command is say
		var isSayCmd = cmd === sayCmd && args.length > 1;

		// Announce specified message in specified channel
		if (isSayCmd) {
			if (isValidChannel)
				client.say(chan, msg);
			else
				client.say(nick, invalidMsg);
		}

		// Check if command is act
		var isActCmd = cmd === actCmd && args.length > 1;

		// Do specified action in specified channel
		if (isActCmd) {
			if (isValidChannel)
				client.action(chan, msg);
			else
				client.say(nick, invalidMsg);
		}

		// Check if command is join
		var isJoinCmd = cmd === joinCmd && args.length > 0;

		// Join specified channel
		if (isJoinCmd) {
			if (isValidChannelJoin) {
				channels.push(chan);
				client.join(chan);
			}
			else
				client.say(nick, invalidMsg);
		}

		// Check if command is part
		var isPartCmd = cmd === partCmd && args.length > 0;

		// Part specified channel
		if (isPartCmd) {
			if (isValidChannel) {
				channels.splice(channels.indexOf(chan), 1);
				client.part(chan, 'Leaving channel');
			}
			else client.say(nick, invalidMsg);
		}
	}
});

// Names Listener
client.addListener('names', function (channel, nicks) {
	// Check if channel is default channel
	var isDefault = channel === defaultChannel;

	// Reset and update default channel users
	if (isDefault)
		users = Object.keys(nicks);
});

// Join Listener
client.addListener('join', function (channel, nick, message) {
	// Check if channel is default channel
	var isDefault = channel === defaultChannel;

	// Add user to default channel users
	if (isDefault)
		users.push(nick);
});

// Part Listener
client.addListener('part', function (channel, nick, reason, message) {
	// Check if channel is default channel
	var isDefault = channel === defaultChannel;

	// Remove user from default channel users
	if (isDefault)
		users.splice(users.indexOf(nick), 1);
});

/* COMMAND FUNCTIONS */

// Get weather for specified location in specified time period
global.getWeather = function getWeather(nick, to, text, message, msg, cmd, args, prefix) {
	// Set default scope and alternate scopes
	var scope = 'currently';
	var scopes = ['today', 'tomorrow', 'week'];

	// Check if alternate scope is requested
	var scopeRequested = args.length > 1 && scopes.indexOf(args[0].toLowerCase()) !== -1;

	// Set alternate scope and update arguments
	if (scopeRequested) {
		scope = args[0].toLowerCase();
		args = args.slice(1);
	}

	// Decode input and set location
	var location = iconv.decode(new Buffer(args.join(' ')), 'ISO-8859-1');

	// Set Google Geocoding API url and insert formatted arguments
	var geocodingUrl = 'https://maps.googleapis.com/maps/api/geocode/json?address=' + location.replace(' ', '+') + '&sensor=false&key=' + googleKey;

	// Make Google Geocoding API request
	request(geocodingUrl, function (error, response, body) {
		// Check if request is successful
		var requestSuccessful = !error && response.statusCode === 200;

		// Parse JSON response
		if (requestSuccessful) {
			var data = JSON.parse(body);

			// Check if location is valid
			var locationValid = data.status === 'OK';

			// Set location name and coordinates
			if (locationValid) {
				var address = data.results[0].formatted_address;
				var lat = data.results[0].geometry.location.lat;
				var lng = data.results[0].geometry.location.lng;

				// Set Forecast API url and insert arguments
				var forecastUrl = 'https://api.forecast.io/forecast/' + forecastKey + '/' + lat + ',' + lng + '?units=auto';

				// Make Forecast API request
				request(forecastUrl, function (error, response, body) {
					// Check if request is successful
					requestSuccessful = !error && response.statusCode === 200;

					// Parse JSON response
					if (requestSuccessful) {
						data = JSON.parse(body);

						// Set weather information
						var conditions = data.currently.summary;
						var temp = data.currently.temperature;
						var tempAlt = toCelsius(temp);
						var tempUnit = 'F';
						var tempUnitAlt = 'C';
						var humidity = data.currently.humidity * 100;
						var units = data.flags.units;

						// Prepare undetermined information
						var temp2;
						var temp2Alt;

						// Check if units are metric
						var unitsMetric = units !== 'us';

						// Update metric temperature and units
						if (unitsMetric) {
							tempAlt = toFahrenheit(temp);
							tempUnit = 'C';
							tempUnitAlt = 'F';
						}

						// Set time information
						var unixTime = data.currently.time;
						var offset = data.offset;

						// Set weather summary
						var summary =  conditions + ' (' + Math.round(temp) + '°' + tempUnit + '/' + Math.round(tempAlt) + '°' + tempUnitAlt + ') in ' + address + ' with ' + Math.round(humidity) + '% Humidity';

						// Update weather information and summary for alternate scope
						switch (scope) {

							// Update weather information and summary for today scope
							case 'today':

							// Update weather information
							conditions = data.daily.data[0].summary;
							temp = data.daily.data[0].temperatureMax;
							tempAlt = toCelsius(temp);
							temp2 = data.daily.data[0].temperatureMin;
							temp2Alt = toCelsius(temp2);
							humidity = data.daily.data[0].humidity;

							// Update metric temperatures
							if (unitsMetric) {
								tempAlt = toFahrenheit(temp);
								temp2Alt = toFahrenheit(temp2);
							}

							// Update weather summary
							summary = conditions.substring(0, conditions.length - 1) + ' (\u0002' + Math.round(temp) + '°' + tempUnit + '/' + Math.round(tempAlt) + '°' + tempUnitAlt + '\u000F ' + Math.round(temp2) + '°' + tempUnit + '/' + Math.round(temp2Alt) + '°' + tempUnitAlt + ') in ' + address;
							break;

							// Update weather information and summary for tomorrow scope
							case 'tomorrow':

							// Update weather information
							conditions = data.daily.data[1].summary;
							temp = data.daily.data[1].temperatureMax;
							tempAlt = toCelsius(temp);
							temp2 = data.daily.data[1].temperatureMin;
							temp2Alt = toCelsius(temp2);
							humidity = data.daily.data[1].humidity;

							// Update metric temperatures
							if (unitsMetric) {
								tempAlt = toFahrenheit(temp);
								temp2Alt = toFahrenheit(temp2);
							}

							// Update weather summary
							summary = conditions.substring(0, conditions.length - 1) + ' (\u0002' + Math.round(temp) + '°' + tempUnit + '/' + Math.round(tempAlt) + '°' + tempUnitAlt + '\u000F ' + Math.round(temp2) + '°' + tempUnit + '/' + Math.round(temp2Alt) + '°' + tempUnitAlt + ') in ' + address;
							break;

							// Update weather information and summary for week scope
							case 'week':

							// Update weather information
							conditions = data.daily.summary;

							// Update weather summary
							summary = conditions.substring(0, conditions.length - 1) + ' in ' + address;
							break;
						}

						// Check if scope is currently
						var scopeCurrently = scope === 'currently';

						// Update and append time information
						if (scopeCurrently) {
							// Parse time from unix time and offset
							var time = moment.unix(unixTime).utc().add('hours', offset);

							// Format time from parsed time
							var timeString = time.format('h:mm A on dddd, MMMM Do');

							// Append time information to weather summary
							summary += ' at ' + timeString;
						}

						// Announce weather summary
						client.say(to, prefix + summary);
					}
				});
			}
			// Announce invalid location
			else
				client.say(to, prefix + 'The location \'' + location + '\' could not be found');
		}
	});
}

// Get specified video from YouTube
global.getVideo = function getVideo(nick, to, text, message, msg, cmd, args, prefix) {
	// Decode input and set video
	var video = iconv.decode(new Buffer(args.join(' ')), 'ISO-8859-1');

	// Set Google YouTube API url and insert formatted arguments
	var youtubeUrl = 'https://www.googleapis.com/youtube/v3/search?part=snippet&q=' + video.replace(' ', '+') + '&key=' + googleKey;

	// Make Google YouTube API request
	request(youtubeUrl, function (error, response, body) {
		// Check if request is successful
		var requestSuccessful = !error && response.statusCode === 200;

		// Parse JSON response
		if (requestSuccessful) {
			var data = JSON.parse(body);

			// Check if video is valid
			var videoValid = data.items[0].id.videoId !== undefined;

			// Set video information
			if (videoValid) {
				var videoId = data.items[0].id.videoId;
				var videoTitle = data.items[0].snippet.title;

				// Announce video title and link
				client.say(to, prefix + videoTitle + ' • https://youtube.com/watch?v=' + videoId);
			}
			// Announce invalid video
			else
				client.say(to, prefix + 'The video \'' + video + '\' could not be found');
		}
	});
}

// Get translation to specified language for specified text
global.getTranslation = function getTranslation(nick, to, text, message, msg, cmd, args, prefix) {
	// Set target language
	var target = args[0];

	// Decode and set input of text to be translated
	var input = iconv.decode(new Buffer(args.slice(1).join(' ')), 'ISO-8859-1');

	// Set Microsoft Translator Authorization API post parameters
	var authUrl = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13/';
	var scopeUrl = 'http://api.microsofttranslator.com';
	var grantType = 'client_credentials';

	// Make Microsoft Translator Authorization API post request
	request.post(authUrl, {
		form: {
			client_id: microsoftId,
			client_secret: microsoftSecret,
			scope: scopeUrl,
			grant_type: grantType
		}
	}, function (error, response, body) {
		// Check if request is successful
		var requestSuccessful = !error && response.statusCode === 200;

		// Parse JSON response
		if (requestSuccessful) {
			var data = JSON.parse(body);

			// Set authorization access token
			var accessToken = data.access_token;

			// Set Microsoft Translator API url and insert formatter arguments
			var translateUrl = 'https://api.microsofttranslator.com/V2/Http.svc/Translate?appId=Bearer ' + encodeURIComponent(accessToken) + '&text=' + input + '&to=' + target + '&contentType=text/plain';

			// Make Microsoft Translator API request
			request(translateUrl, function (error, response, body) {
				// Check if request is successful
				requestSuccessful = !error && response.statusCode === 200;

				// Parse XML response
				if (requestSuccessful)
					parseXml.parseString(body, function (error, result) {
						// Set translated text
						var translation = result.string._;

						// Announce target language and translated text
						client.say(to, prefix + '[' + target + '] ' + translation);
					});
				// Announce invalid target language
				else
					client.say(to, prefix + 'The language code \'' + target + '\' is not valid (Languages Codes: http://msdn.microsoft.com/en-us/library/hh456380.aspx)');
			});
		}
	});
}

// Get boobs randomly from 50 hot posts on Reddit
global.getBoobs = function getBoobs(nick, to, text, message, msg, cmd, args, prefix) {
	// Set Reddit API url
	var boobsUrl = 'http://www.reddit.com/r/boobies/hot.json?limit=50';

	// Make Reddit API request
	request(boobsUrl, function(error, response, body) {
		// Check if request is successful
		var requestSuccessful = !error && response.statusCode === 200;

		// Parse JSON response
		if (requestSuccessful) {
			var data = JSON.parse(body);

			// Set number of responses returned
			var responses = data.data.children.length;

			// Set satisfactory response unfound
			var found = false;

			// Find random response
			while (!found) {
				var rand = Math.round(Math.random() * responses);

				// Set random response information
				var res;
				if (data.data.children[rand] !== undefined) res = data.data.children[rand].data;

				// Check if response url is satisfactory
				var urlSatisfactory = res !== undefined && res.domain === 'i.imgur.com';

				// Set satisfactory response found
				if (urlSatisfactory) {
					found = true;

					// Announce boobs and link
					client.say(to, prefix + 'Boobs • ' + res.url);
				}
			}
		}
	});
}

// Get butt randomly from 50 hot posts on Reddit
global.getButt = function getButt(nick, to, text, message, msg, cmd, args, prefix) {
	// Set Reddit API url
	var buttUrl = 'http://www.reddit.com/r/ass/hot.json?limit=50';

	// Make Reddit API request
	request(buttUrl, function(error, response, body) {
		// Check if request is successful
		var requestSuccessful = !error && response.statusCode === 200;

		// Parse JSON response
		if (requestSuccessful) {
			var data = JSON.parse(body);

			// Set number of responses returned
			var responses = data.data.children.length;

			// Set satisfactory response unfound
			var found = false;

			// Find random response
			while (!found) {
				var rand = Math.round(Math.random() * responses);

				// Set random response information
				var res;
				if (data.data.children[rand] !== undefined) res = data.data.children[rand].data;

				// Check if response url is satisfactory
				var urlSatisfactory = res !== undefined && res.domain === 'i.imgur.com';

				// Set satisfactory response found
				if (urlSatisfactory) {
					found = true;

					// Announce butt and link
					client.say(to, prefix + 'Butt • ' + res.url);
				}
			}
		}
	});
}

// Get dubs attempt for a number with two digits or a specified length
global.getDubs = function getDubs(nick, to, text, message, msg, cmd, args, prefix) {
	// Set size to specified number of digits
	var size = args[0];

	// Check if size input is valid and within bounds
	var sizeValid = !isNaN(size) && size > 0 && size < 11;

	// Set size to two digits
	if (!sizeValid) size = 2;

	// Calculate maximum number
	var max = Math.pow(10, size) - 2;

	// Get random number up to the max and add one to it
	var random = Math.round(Math.random() * max + 1);

	// Announce random number with as many leading zeros as necessary
	client.say(to, prefix + ('000000000' + random).slice(0 - size));
}

// 8ball command
global.getEightBall = function getEightBall(nick, to, text, message, msg, cmd, args, prefix) {
	// Set response possibilities
	var answers = [
		'It is certain', 'It is decidedly so', 'Without a doubt',
		'Yes definitely', 'You may rely on it', 'As I see it, yes',
		'Most likely', 'Outlook good', 'Yes', 'Signs point to yes',
		'Reply hazy try again', 'Ask again later', 'Better not tell you now',
		'Cannot predict now', 'Concentrate and ask again', 'Don\'t count on it',
		'My reply is no', 'My sources say no', 'Outlook not so good',
		'Very doubtful'
	];

	// Get random number up to the total number of response possibilities
	var random = Math.round(Math.random() * answers.length - 1);

	// Announce response selected from random number
	client.say(to, prefix + answers[random]);
}

/* UTILITY FUNCTIONS */

// Convert temperature value from celsius to fahrenheit
function toFahrenheit(celsius) {
	// Calculate fahrenheit value
	var fahrenheit = celsius * 9 / 5 + 32;

	// Return fahrenheit value
	return fahrenheit;
}

// Convert temperature value from fahrenheit to celsius
function toCelsius(fahrenheit) {
	// Calculate celsius value
	var celsius = (fahrenheit - 32) * 5 / 9;

	// Return celsius value
	return celsius;
}

// Convert curse instances to bless instances
function curseToBless(message) {
	// Set curse keywords
	var curses = ['cursed', 'blessed', 'curses', 'blesses', 'curse', 'bless', 'cursing', 'blessing'];

	// Assume curse present in message
	var cursePresent = true;

	// Search message while curse present in message
	while (cursePresent) {
		// Prepare undetermined information
		var key;
		var pos;
		var input;
		var output;

		// Search for each curse possibility
		for (var i = 0; i < curses.length - 1; i += 2) {
			// Set curse keyword to check for
			key = curses[i];

			// Check for curse keyword in message
			keyFound = message.toLowerCase().indexOf(key) !== -1;

			// Update curse input and bless output information
			if (keyFound) {
				pos = message.toLowerCase().indexOf(key);
				input = message.substring(pos, pos + key.length);
				output = curses[i + 1];

				// Replace lower case letters in bless output where appropriate
				for (var i = 0; i < key.length; i++) {
					// Check if current letter is upper case in input
					var isCapital = input.charAt(i) === input.charAt(i).toUpperCase();

					// Replace current lower case letter in output
					if (isCapital)
						output = output.substring(0, i) + output.charAt(i).toUpperCase() + output.substring(i + 1);
				}

				// Cut input from message and insert output
				message = message.substring(0, pos) + output + message.substring(pos + key.length);
			}
		}

		// Check if conversion matches bless command
		var blessCommand = message.toLowerCase() === '!bless';

		// Append to output drawing of Exeanon admiring Rerk
		if (blessCommand) message += ' http://i.imgur.com/v6BUGn8.jpg';

		// Assume curse not present in message
		cursePresent = false;

		// Check if curse is present in message
		for (var i = 0; i < curses.length - 1; i += 2) {
			var curseFound = message.toLowerCase().indexOf(curses[i]) !== -1;

			// Set curse present in message
			if (curseFound)
				cursePresent = true;
		}
	}

	// Return converted message
	return message;
}
