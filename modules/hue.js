module.exports = {
	controlHue: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var hueAccessToken;
		var hueBridgeId;

		if (config.apis.hue !== undefined) {
			hueAccessToken = config.apis.hue.accessToken;
			hueBridgeId = config.apis.hue.bridgeId;
		}

		if (hueAccessToken !== undefined && hueBridgeId !== undefined) {
			if (args.length === 0) {
				var hueUrl = 'https://www.meethue.com/api/getbridge?token=' + hueAccessToken + '&bridgeid=' + hueBridgeId;

				request(hueUrl, function (error, response, body) {
					if (!error && response.statusCode === 200) {
						var data = JSON.parse(body);

						var lightCount = Object.keys(data.lights).length;
						var lightCountActive = 0;

						for (var i in data.lights)
							if (data.lights[i].state.on)
								lightCountActive ++;

						var lightCountActiveReadable = lightCountActive;

						if (lightCountActive === 0)
							lightCountActiveReadable = 'none';

						else if (lightCountActive === lightCount)
							lightCountActiveReadable = 'all';

						var lightGrammar = 'are';

						if (lightCountActive === 1)
							lightGrammar = 'is';

						rpc.emit('call', client, 'privmsg', [target, prefix + 'Hue is currently controlling ' + lightCount + ' lights, ' + lightCountActiveReadable + ' of which ' + lightGrammar + ' lit.']);
					}

					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Could not get status of Hue lights at this time.']);
				});
			}

			else {
				var cmd = args[0];
				var args = args.slice(1);

				var argsLevel;
				var argsProfile;
				var argsParty;

				switch (cmd) {
					case 'level':
					case 'brightness':
						argsLevel = args[0];
						args = args.slice(1);
						break;
					case 'profile':
					case 'scene':
						argsProfile = args[0];
						args = [];
						break;
					case 'party':
					case 'disco':
						argsParty = args[0];
						args = [];
						break;
				}

				var argsFiltered = [];

				for (var i in args) {
					var lightNumber = args[i];

					if (!isNaN(lightNumber))
						argsFiltered.push(lightNumber);
				}

				args = argsFiltered;

				var commandGroup = true;
				var commandLights = [];
				var commandLightsSpan;

				if (args.length !== 0) {
					commandGroup = false;

					for (var i in args) {
						var lightNumber = args[i];

						if (commandLights.indexOf(lightNumber) === -1)
							commandLights.push(Math.min(Math.max(Math.floor(lightNumber), 1), 100));
					}

					if (commandLights.length !== 1) {
						commandLights = commandLights.sort();

						var commandLightsSpanContinuous = true;

						for (var i = commandLights[0]; i < commandLights[commandLights.length - 1]; i++)
							if (commandLights.indexOf(i) === -1)
								commandLightsSpanContinuous = false;

						if (commandLightsSpanContinuous)
							commandLightsSpan = 'Lights ' + commandLights[0] + '-' + commandLights[commandLights.length - 1];

						else {
							if (commandLights.length !== 2) {
								commandLightsSpan = commandLights.join(', ');
								commandLightsSpan = 'Lights ' + commandLightsSpan.substring(0, commandLightsSpan.lastIndexOf(', ')) + ', and ' + commandLightsSpan.substring(commandLightsSpan.lastIndexOf(', ') + 2);
							}
							else
								commandLightsSpan = 'Lights ' + commandLights[0] + ' and ' + commandLights[1];
						}
					}

					else
						commandLightsSpan = 'Light ' + commandLights[0];
				}

				var hueUrl = 'https://www.meethue.com/api/sendmessage?token=' + hueAccessToken;

				var commandSlug;
				var commandMethod;
				var commandBody;

				var actionMessage;

				switch(cmd) {
					case 'on':
						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"on": true}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights turned on.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"on": true}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' turned on.';
						}
						break;
					case 'off':
						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"on": false}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights turned off.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"on": false}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' turned off.';
						}
						break;
					case 'cycle':
					case 'loop':
						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"effect": "colorloop"}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights turned to ' + cmd + ' mode.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"effect": "colorloop"}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' turned to ' + cmd + ' mode.';
						}
						break;
					case 'level':
					case 'brightness':
						var level = argsLevel;
						var bri;

						if (isNaN(level))
							level = 100;
						else
							level = Math.round(level);

						level = Math.min(Math.max(level, 1), 100);
						bri = Math.ceil(level / 100 * 254);

						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"bri": ' + bri + '}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights adjusted to ' + level + '% brightness.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"bri": ' + bri + '}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' adjusted to ' + level + '% brightness.';
						}
						break;
					case 'blink':
						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"alert": "select"}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights blinked.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"alert": "select"}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' blinked.';
						}
						break;
					case 'pulse':
						if (commandGroup) {
							commandSlug = 'groups/0/action';
							commandMethod = 'PUT';
							commandBody = '{"alert": "lselect"}';

							sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

							actionMessage = 'All lights blinking for 15 seconds.';
						}

						else {
							for (var i in commandLights) {
								commandSlug = 'lights/' + commandLights[i] + '/state';
								commandMethod = 'PUT';
								commandBody = '{"alert": "lselect"}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
							}

							actionMessage = commandLightsSpan + ' blinking for 15 seconds.';
						}
						break;
					case 'profile':
					case 'scene':
						var hueUrlStatus = 'https://www.meethue.com/api/getbridge?token=' + hueAccessToken + '&bridgeid=' + hueBridgeId;

						request(hueUrlStatus, function (error, response, body) {
							if (!error && response.statusCode === 200) {
								var profile = argsProfile;
								var scene;

								var data = JSON.parse(body);
								var scenes = data.scenes;

								for (var i in scenes)
									if (scenes[i].name.toLowerCase() === profile.toLowerCase() + ' on 0') {
										profile = scenes[i].name.substring(0, scenes[i].name.lastIndexOf(' on 0'));
										scene = i;
									}

								if (scene !== undefined) {
									commandSlug = 'groups/0/action';
									commandMethod = 'PUT';
									commandBody = '{"scene": "' + scene + '"}';

									sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);

									actionMessage = 'Light ' + cmd + ' set to ' + profile + '.';

									rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
								}

								else {
									actionMessage = 'Light ' + cmd + ' could not be found at this time.';

									rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
								}
							}

							else {
								actionMessage = 'Could not change ' + cmd + ' of Hue lights at this time.';

								rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
							}
						});
						break;
					case 'party':
					case 'disco':
						var hueUrlStatus = 'https://www.meethue.com/api/getbridge?token=' + hueAccessToken + '&bridgeid=' + hueBridgeId;

						request(hueUrlStatus, function (error, response, body) {
							if (!error && response.statusCode === 200) {
								var data = JSON.parse(body);
								var lights = data.lights;

								commandSlug = 'groups/0/action';
								commandMethod = 'PUT';
								commandBody = '{"on": true}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
									if (!error && response.statusCode === 200) {
										var lightCycle = 0;
										var hue;

										var lightsSet = 0;

										for (var i in lights) {
											switch (lightCycle % 3) {
												case 0:
													hue = 0;
													break;
												case 1:
													hue = 25500;
													break;
												case 2:
													hue = 46920;
													break;
											}

											commandSlug = 'lights/' + i + '/state';
											commandMethod = 'PUT';
											commandBody = '{"bri": 254, "sat": 254, "hue": ' + hue + '}';

											sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
												if (!error && response.statusCode === 200) {
													lightsSet++;

													if (lightsSet === Object.keys(lights).length) {
														commandSlug = 'groups/0/action';
														commandMethod = 'PUT';
														commandBody = '{"effect": "colorloop"}';

														sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
															if (!error && response.statusCode === 200) {
																global.huePartyActive = true;

																hueParty(hueUrl, hueBridgeId, lights);
																
																actionMessage = 'Hue party started.';

																rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
															}
														});
													}
												}
											});

											lightCycle++;
										}
									}
								});
							}

							else {
								actionMessage = 'Could not activate Hue party mode at this time.';

								rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
							}
						});
						break;
					case 'reset':
						global.huePartyActive = false;

						commandSlug = 'groups/0/action';
						commandMethod = 'PUT';
						commandBody = '{"alert": "none"}';

						sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
							if (!error && response.statusCode === 200) {
								commandSlug = 'groups/0/action';
								commandMethod = 'PUT';
								commandBody = '{"effect": "none"}';

								sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
									if (!error && response.statusCode === 200) {
										commandSlug = 'groups/0/action';
										commandMethod = 'PUT';
										commandBody = '{"bri": 254, "hue": 0, "sat": 0}';

										sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, function(error, response, body) {
											if (!error && response.statusCode === 200) {
												commandSlug = 'groups/0/action';
												commandMethod = 'PUT';
												commandBody = '{"on": true}';

												sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
											}
										});
									}
								});
							}
						});

						
						actionMessage = 'All lights reset.';

						break;
				}

				switch(cmd) {
					case 'on':
					case 'off':
					case 'cycle':
					case 'loop':
					case 'level':
					case 'brightness':
					case 'blink':
					case 'pulse':
					case 'reset':
						rpc.emit('call', client, 'privmsg', [target, prefix + actionMessage]);
						break;
				}
			}
		}
	},
	sendHue: function(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody, callback) {
		var requestBody = 'clipmessage={bridgeId: "' + hueBridgeId + '", clipCommand: {url: "/api/0/' + commandSlug + '", method: "' + commandMethod + '", body: ' + commandBody + '}}';

		request.post(hueUrl, {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: requestBody
		}, function(error, response, body) {
			if (typeof callback === 'function')
				callback(error, response, body);
		});
	},
	hueParty: function(hueUrl, hueBridgeId, lights) {
		if (global.huePartyActive === true) {
			for (var i in lights) {
				var commandSlug = 'lights/' + i + '/state';
				var commandMethod = 'PUT';
				var commandBody = '{"alert": "lselect"}';

				sendHue(hueUrl, hueBridgeId, commandSlug, commandMethod, commandBody);
			}
				
			setTimeout(function() {
				hueParty(hueUrl, hueBridgeId, lights);
			}, 16000);
		}
	}
};
