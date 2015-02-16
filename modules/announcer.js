module.exports = {
	announce: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var chan = args[0];
		var cmd = args[1];
		var args = args.slice(2);

		if (chan.indexOf('#') === 0) {
			announceInit(chan, client);
		
			switch(cmd) {
				case 'on':
					break;
				case 'off':
					break;
				case 'set':
					if (args.length > 1) {
						var set = args[0];
						var cmd = args[1];
						var args = args.slice(2);
						announceSet(chan, set, cmd, args, client, target, prefix);
					}
					break;
				case 'msg':
					if (args.length > 2) {
						var set = args[0];
						var cmd = args[1];
						var args = args.slice(2);
						announceMsg(chan, set, cmd, args, client, target, prefix);
					}
					break;
				case 'list':
					if (args.length > 0) {
						var cmd = args[0];
						var args = args.slice(1);
						announceList(chan, cmd, args, client, target, prefix);
					}
					break;
				default:
					announceInvalid(cmd, client, target, prefix);
					break;
			}
		}
		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'Input ' + chan + ' is not a channel']);

	},
	announceOn: function() {

	},
	announceOff: function() {

	},
	announceSet: function(chan, set, cmd, args, client, target, prefix) {
		switch(cmd) {
			case 'add':
				if (save.announcements[client][chan][set] === undefined) {
					save.announcements[client][chan][set] = {'msg':[],'alias':false,'default':false,'interval':false,'date':{'start':false,'end':false},'time':{'start':false,'end':false}};

					if (Object.keys(save.announcements[client][chan]).length === 1)
						save.announcements[client][chan][set].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'Added set ' + set]);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' already exists']);
				break;
			case 'remove':
				if (save.announcements[client][chan][set] !== undefined) {
					delete save.announcements[client][chan][set];
					for (var i in save.announcements[client][chan])
						if (save.announcements[client][chan][i].alias === set)
							delete save.announcements[client][chan][i];

					if (Object.keys(save.announcements[client][chan]).length === 1)
						save.announcements[client][chan][Object.keys(save.announcements[client][chan])[0]].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'Removed set ' + set]);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
				break;
			case 'alias':
				if (args.length > 0) {
					var alias = args[0];
					if (save.announcements[client][chan][set] === undefined) {
						if (save.announcements[client][chan][alias] !== undefined) {
							if (save.announcements[client][chan][alias].alias === false) {
								save.announcements[client][chan][set] = {'alias':alias,'default':false,'interval':false,'date':{'start':false,'end':false},'time':{'start':false,'end':false}};

								rpc.emit('call', client, 'privmsg', [target, prefix + 'Aliased set ' + alias + ' to set ' + set]);

								fs.writeFileSync(saveFile, JSON.stringify(save));
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + alias + ' is an alias']);
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + alias + ' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' already exists']);
				}
				break;
			case 'copy':
				if (args.length > 0) {
					var copy = args[0];
					if (save.announcements[client][chan][set] === undefined) {
						if (save.announcements[client][chan][copy] !== undefined) {
							if (save.announcements[client][chan][copy].alias === false) {
								save.announcements[client][chan][set] = JSON.parse(JSON.stringify(save.announcements[client][chan][copy]));
								save.announcements[client][chan][set].default = false;

								rpc.emit('call', client, 'privmsg', [target, prefix + 'Copied set ' + copy + ' to set ' + set]);

								fs.writeFileSync(saveFile, JSON.stringify(save));
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + copy + ' is an alias']);
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + copy + ' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' already exists']);
				}
				break;
			case 'rename':
				if (args.length > 0) {
					var name = args[0];
					if (save.announcements[client][chan][name] === undefined) {
						if (save.announcements[client][chan][set] !== undefined) {
							save.announcements[client][chan][name] = JSON.parse(JSON.stringify(save.announcements[client][chan][set]));
							delete save.announcements[client][chan][set];

							rpc.emit('call', client, 'privmsg', [target, prefix + 'Renamed set ' + set + ' to set ' + name]);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + name + ' already exists']);
				}
				break;
			case 'default':
				if (save.announcements[client][chan][set] !== undefined) {
					for (var i in save.announcements[client][chan])
						if (save.announcements[client][chan][i].default)
							save.announcements[client][chan][i].default = false;

					save.announcements[client][chan][set].default = true;

					rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' is now default']);

					fs.writeFileSync(saveFile, JSON.stringify(save));
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
				break;
			case 'update':
				if (args.length > 0) {
					if (save.announcements[client][chan][set] !== undefined) {
						var cmd = args[0];
						var args = args.slice(1);

						switch(cmd) {
							case 'interval':
								if (args.length > 0) {
									var time = args[0];
									if (!isNaN(time) && time > 0 && time < 3601) {
										save.announcements[client][chan][set].interval = time;

										rpc.emit('call', client, 'privmsg', [target, prefix + 'Interval of set ' + set + ' updated to ' + time]);

										fs.writeFileSync(saveFile, JSON.stringify(save));
									}
									else
										rpc.emit('call', client, 'privmsg', [target, prefix + 'Interval ' + time + ' not in range 1-3600']);
								}
								else {
									save.announcements[client][chan][set].interval = false;

									rpc.emit('call', client, 'privmsg', [target, prefix + 'Interval of set ' + set + ' reverted to default']);

									fs.writeFileSync(saveFile, JSON.stringify(save));
								}
								break;
							case 'date':
								if (args.length > 0) {
									var cmd = args[0];
									var args = args.slice(1);

									if (args.length > 0) {
										var date = args[0];

										switch(cmd) {
											case 'start':
												if (isValidDate(date)) {
													save.announcements[client][chan][set].date.start = date;

													rpc.emit('call', client, 'privmsg', [target, prefix + 'Start date of set ' + set + ' updated to ' + date]);

													fs.writeFileSync(saveFile, JSON.stringify(save));
												}
												else
													rpc.emit('call', client, 'privmsg', [target, prefix + 'Date ' + date + ' not in format YYYY-MM-DD']);
												break;
											case 'end':
												if (isValidDate(date)) {
													save.announcements[client][chan][set].date.end = date;

													rpc.emit('call', client, 'privmsg', [target, prefix + 'End date of set ' + set + ' update to ' + date]);

													fs.writeFileSync(saveFile, JSON.stringify(save));
												}
												else
													rpc.emit('call', client, 'privmsg', [target, prefix + 'Date ' + date + ' not in format YYYY-MM-DD']);
												break;
											default:
												announceInvalid(cmd, client, target, prefix);
												break;
										}
									}
									else {
										switch(cmd) {
											case 'start':
												save.announcements[client][chan][set].date.start = false;

												rpc.emit('call', client, 'privmsg', [target, prefix + 'Start date of set ' + set + ' reverted to default']);

												fs.writeFileSync(saveFile, JSON.stringify(save));
												break;
											case 'end':
												save.announcements[client][chan][set].date.start = false;

												rpc.emit('call', client, 'privmsg', [target, prefix + 'End date of set ' + set + ' reverted to default']);

												fs.writeFileSync(saveFile, JSON.stringify(save));
												break;
											default:
												announceInvalid(cmd, client, target, prefix);
												break;
										}
									}
								}
								break;
							case 'time':
								if (args.length > 0) {
									var cmd = args[0];
									var args = args.slice(1);

									if (args.length > 0) {
										var time = args[0];

										switch(cmd) {
											case 'start':
												if (isValidTime(time)) {
													save.announcements[client][chan][set].time.start = time;

													rpc.emit('call', client, 'privmsg', [target, prefix + 'Start time of set ' + set + ' updated to ' + time]);

													fs.writeFileSync(saveFile, JSON.stringify(save));
												}
												else
													rpc.emit('call', client, 'privmsg', [target, prefix + 'Time ' + time + ' not in format HH:MM']);
												break;
											case 'end':
												if (isValidTime(time)) {
													save.announcements[client][chan][set].time.end = time;

													rpc.emit('call', client, 'privmsg', [target, prefix + 'End time of set ' + set + ' updated to ' + time]);

													fs.writeFileSync(saveFile, JSON.stringify(save));
												}
												else
													rpc.emit('call', client, 'privmsg', [target, prefix + 'Time ' + time + ' not in format HH:MM']);
												break;
											default:
												announceInvalid(cmd, client, target, prefix);
												break;
										}
									}
									else {
										switch(cmd) {
											case 'start':
												save.announcements[client][chan][set].time.start = false;

												rpc.emit('call', client, 'privmsg', [target, prefix + 'Start time of set ' + set + ' reverted to default']);

												fs.writeFileSync(saveFile, JSON.stringify(save));
												break;
											case 'end':
												save.announcements[client][chan][set].time.start = false;

												rpc.emit('call', client, 'privmsg', [target, prefix + 'End time of set ' + set + ' reverted to default']);

												fs.writeFileSync(saveFile, JSON.stringify(save));
												break;
											default:
												announceInvalid(cmd, client, target, prefix);
												break;
										}
									}
								}
								break;
							default:
								announceInvalid(cmd, client, target, prefix);
								break;
						}
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
				}
				break;
			default:
				announceInvalid(cmd, client, target, prefix);
				break;
		}
	},
	announceMsg: function(chan, set, cmd, args, client, target, prefix) {
		if (save.announcements[client][chan][set] !== undefined) {
			if (save.announcements[client][chan][set].alias === false) {
				switch(cmd) {
					case 'add':
						var msg = args.join(' ');

						save.announcements[client][chan][set].msg.push({'text':msg,'alias':false});

						rpc.emit('call', client, 'privmsg', [target, prefix + 'Added message to spot ' + save.announcements[client][chan][set].msg.length]);

						fs.writeFileSync(saveFile, JSON.stringify(save));
						break;
					case 'remove':
						var spot = args[0];
						if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
							save.announcements[client][chan][set].msg.splice(spot - 1, 1);
							for (var i in save.announcements[client][chan][set].msg)
								if (save.announcements[client][chan][set].msg[i].alias === spot)
									save.announcements[client][chan][set].msg.splice(i, 1);

							rpc.emit('call', client, 'privmsg', [target, prefix + 'Removed message from spot ' + spot]);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						break;
					case 'alias':
						var spot = args[0];
						if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
							if (save.announcements[client][chan][set].msg[spot - 1].alias === false) {
								save.announcements[client][chan][set].msg.push({'alias':spot});

								rpc.emit('call', client, 'privmsg', [target, prefix + 'Aliased spot ' + save.announcements[client][chan][set].msg.length + ' to spot ' + spot]);

								fs.writeFileSync(saveFile, JSON.stringify(save));
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' is an alias']);
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						break;
					case 'edit':
						if (args.length > 1) {
							var spot = args[0];
							var msg = args.slice(1).join(' ');

							if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
								if (save.announcements[client][chan][set].msg[spot - 1].alias === false) {
									save.announcements[client][chan][set].msg[spot - 1].text = msg;

									rpc.emit('call', client, 'privmsg', [target, prefix + 'Edited message in spot ' + spot]);

									fs.writeFileSync(saveFile, JSON.stringify(save));
								}
								else
									rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' is an alias']);
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						}
						break;
					case 'move':
						if (args.length > 1) {
							var spot = args[0];
							var dest = args[1];

							if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
								if (dest > 0 && dest <= save.announcements[client][chan][set].msg.length) {
									save.announcements[client][chan][set].msg.splice(dest - 1, 0, save.announcements[client][chan][set].msg.splice(spot - 1, 1)[0]);

									rpc.emit('call', client, 'privmsg', [target, prefix + 'Moved message in spot ' + spot + ' to spot ' + dest]);

									fs.writeFileSync(saveFile, JSON.stringify(save));
								}
								else
									rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + dest + ' does not exist']);
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						}
						break;
					case 'swap':
						if (args.length > 1) {
							var spot = args[0];
							var dest = args[1];

							if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
								if (dest > 0 && dest <= save.announcements[client][chan][set].msg.length) {
									save.announcements[client][chan][set].msg[dest - 1] = save.announcements[client][chan][set].msg.splice(spot - 1, 1, save.announcements[client][chan][set].msg[dest - 1])[0];

									rpc.emit('call', client, 'privmsg', [target, prefix + 'Swapped messages in spots ' + spot + ' and ' + dest]);

									fs.writeFileSync(saveFile, JSON.stringify(save));
								}
								else
									rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + dest + ' does not exist']);
							}
							else
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						}
						break;
					case 'first':
						var spot = args[0];

						if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
							save.announcements[client][chan][set].msg.splice(0, 0, save.announcements[client][chan][set].msg.splice(spot - 1, 1)[0]);


							rpc.emit('call', client, 'privmsg', [target, prefix + 'Moved message in spot ' + spot + ' to first']);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						break;
					case 'last':
						var spot = args[0];

						if (spot > 0 && spot <= save.announcements[client][chan][set].msg.length) {
							save.announcements[client][chan][set].msg.push(save.announcements[client][chan][set].msg.splice(spot - 1, 1)[0]);

							rpc.emit('call', client, 'privmsg', [target, prefix + 'Moved message in spot ' + spot + ' to last']);

							fs.writeFileSync(saveFile, JSON.stringify(save));
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Spot ' + spot + ' does not exist']);
						break;
					default:
						announceInvalid(cmd, client, target, prefix);
						break;
				}
			}
			else
				rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' is an alias']);
		}
		else
			rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
	},
	announceList: function(chan, cmd, args, client, target, prefix) {
		switch(cmd) {
			case 'set':
				var sets = [];

				for (var i in save.announcements[client][chan]) {
					var set = i;
					if (save.announcements[client][chan][i].default)
						set += ' [Default]';
					if (save.announcements[client][chan][i].alias !== false)
						set += ' [Alias: ' + save.announcements[client][chan][i].alias + ']';
					if (save.announcements[client][chan][i].interval !== false)
						set += ' [Interval: ' + save.announcements[client][chan][i].interval + ']';
					if (save.announcements[client][chan][i].date.start !== false)
						set += ' [Start date: ' + save.announcements[client][chan][i].date.start + ']';
					if (save.announcements[client][chan][i].date.end !== false)
						set += ' [End date: ' + save.announcements[client][chan][i].date.end + ']';
					if (save.announcements[client][chan][i].time.start !== false)
						set += ' [Start time: ' + save.announcements[client][chan][i].time.start + ']';
					if (save.announcements[client][chan][i].time.end !== false)
						set += ' [End time: ' + save.announcements[client][chan][i].time.end + ']';

					sets.push(set);
				}

				if (sets.length > 0) {
					sets = sets.sort();
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Sets in channel ' + chan + ':']);
					for (var i in sets)
						rpc.emit('call', client, 'privmsg', [target, prefix + '- ' + sets[i]]);
				}
				else
					rpc.emit('call', client, 'privmsg', [target, prefix + 'Sets in channel ' + chan + ' do not exist']);
				break;
			case 'msg':
				if (args.length > 0) {
					var set = args[0];
					if (save.announcements[client][chan][set] !== undefined) {
						var msgs = [];

						for (var i in save.announcements[client][chan][set].msg) {
							if (save.announcements[client][chan][set].msg[i].alias === false)
								msgs.push('[' + i + '] ' + save.announcements[client][chan][set].msg[i].text);
							else
								msgs.push('[' + i + ' - Alias: ' + save.announcements[client][chan][set].msg[i].alias + ']');
						}

						if (msgs.length > 0) {	
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Messages in channel ' + chan + ':']);
							for (var i in msgs)
								rpc.emit('call', client, 'privmsg', [target, prefix + '- ' + msgs[i]]);
						}
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'Messages in channel ' + chan + ' do not exist']);
					}
					else
						rpc.emit('call', client, 'privmsg', [target, prefix + 'Set ' + set + ' does not exist']);
				}
				break;
			default:
				announceInvalid(cmd, client, target, prefix);
				break;
		}
	},
	announceInvalid: function(cmd, client, target, prefix) {
		rpc.emit('call', client, 'privmsg', [target, prefix + 'Command ' + cmd + ' does not exist (Commands: https://github.com/JasonPuglisi/snow-irc-bot/blob/master/announcer_reference.md)']);
	},
	announceInit: function(chan, client) {
		if (save.announcements === undefined)
			save.announcements = {};
		if (save.announcements[client] === undefined)
			save.announcements[client] = {};
		if (save.announcements[client][chan] === undefined)
			save.announcements[client][chan] = {};
	},
	isValidDate: function(date) {
		return date.length === 10 && date.charAt(4) === '-' && date.charAt(7) === '-' && moment(date, 'YYYY-MM-DD').isValid();
	},
	isValidTime: function(time) {
		return time.length === 5 && time.charAt(2) === ':' && moment(time, 'HH:mm').isValid();
	}
};
