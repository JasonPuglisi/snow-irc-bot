module.exports = {
	plugIn: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (config.apis.plug !== undefined) {
			var plugEmail = config.apis.plug.email;
			var plugPassword = config.apis.plug.password;
		}

		if (plugEmail !== undefined && plugPassword !== undefined) {
			var cmd = args[0];
			var args = args.slice(1);

			switch(cmd) {
				case 'join':
					if (save.plug === undefined)
						save.plug = {};

					if (args.length === 0) {
						if (save.profiles[client] !== undefined && save.profiles[client][nickname.toLowerCase()] !== undefined)
							save.plug.room = save.profiles[client][nickname.toLowerCase()].plug;
					}

					else
						save.plug.room = args[0];

					if (save.plug.room !== undefined) {
						if (global.plugBot === undefined) {
							global.plugBot = new plugapi({
								email: plugEmail,
								password: plugPassword
							});
						}

						else {
							plugBot.close();

							plugBot.removeAllListeners();
						}

						plugBot.connect(save.plug.room);

						save.plug.connected = true;
						save.plug.joinAnnounced = false;
						save.plug.advanceSuppressed = false;

						plugBot.on('roomJoin', function(room) {
							save.plug.roomName = room;

							if (!save.plug.joinAnnounced) {
								rpc.emit('call', client, 'privmsg', [target, prefix + 'Plugged into [plug.dj/' + save.plug.room + '] \'' + save.plug.roomName + '\'']);

								save.plug.joinAnnounced = true;
							}
						});

						plugBot.on('error', function() {
							plugBot.connect(save.plug.room);
						});

						plugBot.on('advance', function(data) {
							if (data.media !== undefined) {
								if (save.plug.advanceSuppressed) {
									if (save.plug.announce !== false)
										rpc.emit('call', client, 'privmsg', [target, '[plug.dj/' + save.plug.room + '] Now playing \'' + data.media.title + '\' by ' + data.media.author]);
								}
								else
									save.plug.advanceSuppressed = true;

								if (save.plug.woot !== false)
									plugBot.woot();
							}
						});
					}

					fs.writeFileSync(saveFile, JSON.stringify(save));
					break;
				case 'part':
					if (global.plugBot !== undefined && save.plug.connected) {
						plugBot.close();

						rpc.emit('call', client, 'privmsg', [target, prefix + 'Unplugged from room']);

						save.plug.connected = false;

						fs.writeFileSync(saveFile, JSON.stringify(save));
					}
					break;
				case 'announce':
					if (args.length === 0) {
						if (global.plugBot !== undefined && plugBot.getMedia())
							rpc.emit('call', client, 'privmsg', [target, '[plug.dj/' + save.plug.room + '] Currently playing \'' + plugBot.getMedia().title + '\' by ' + plugBot.getMedia().author]);
						else
							rpc.emit('call', client, 'privmsg', [target, '[plug.dj] Not currently playing anything']);
					}

					else {
						var announceState = args[0];

						switch(announceState) {
							case 'on':
								save.plug.announce = true;

								rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Announcing turned on']);
								break;
							case 'off':
								save.plug.announce = false;

								rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Announcing turned off']);
								break;
						}

						fs.writeFileSync(saveFile, JSON.stringify(save));
					}
					break;
				case 'woot':
					if (args.length === 0) {
						if (global.plugBot !== undefined && plugBot.getMedia())
							plugBot.woot();
					}

					else {
						var wootState = args[0];

						switch(wootState) {
							case 'on':
								save.plug.woot = true;

								rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Wooting turned on']);
								break;
							case 'off':
								save.plug.woot = false;

								rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Wooting turned off']);
								break;
						}

						fs.writeFileSync(saveFile, JSON.stringify(save));
					}
					break;
			}
		}
	}
};
