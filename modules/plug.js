module.exports = {
	plugIn: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var plugEmail;
		var plugPassword;

		if (config.apis.plug !== undefined) {
			plugEmail = config.apis.plug.email;
			plugPassword = config.apis.plug.password;
		}

		if (plugEmail !== undefined && plugPassword !== undefined) {
			var cmd = args[0];
			args = args.slice(1);

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
								rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj/' + save.plug.room + '] Plugged into \'' + save.plug.roomName + '\'']);

								save.plug.joinAnnounced = true;
							}
						});

						plugBot.on('error', function() {
							plugBot.connect(save.plug.room);
						});

						plugBot.on('advance', function(data) {
							if (data.media !== undefined) {
								if (save.plug.advanceSuppressed) {
									if (save.plug.announce !== false) {
										var song = plugBot.getMedia().title.replace('&amp;', '&');
										var artist = plugBot.getMedia().author.replace('&amp;', '&');

										rpc.emit('call', client, 'privmsg', [target, '[plug.dj/' + save.plug.room + '] Now playing \'' + song + '\' by ' + artist]);
									}
								}
								else
									save.plug.advanceSuppressed = true;

								if (save.plug.woot !== false)
									plugBot.woot();
							}
							else
								save.plug.advanceSuppressed = true;
						});

            plugBot.on('chat', function(data) {
              if (save.plug.relay !== false)
                rpc.emit('call', client, 'privmsg', [target, '[plug.dj/' + save.plug.room + '] ' + data.raw.un + ': ' + data.raw.message]); 
            });
					}

					fs.writeFileSync(saveFile, JSON.stringify(save));
					break;
				case 'part':
					if (global.plugBot !== undefined && save.plug.connected) {
						plugBot.close();

						rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Unplugged from room']);

						save.plug.connected = false;

						fs.writeFileSync(saveFile, JSON.stringify(save));
					}
					break;
				case 'announce':
					if (args.length === 0) {
						if (global.plugBot !== undefined && plugBot.getMedia()) {
							var song = plugBot.getMedia().title.replace('&amp;', '&');
							var artist = plugBot.getMedia().author.replace('&amp;', '&');

							rpc.emit('call', client, 'privmsg', [target, '[plug.dj/' + save.plug.room + '] Currently playing \'' + song + '\' by ' + artist]);
						}
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
				case 'relay':
          var relayState = args[0];

          switch(relayState) {
            case 'on':
              save.plug.relay = true;

              rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Chat relaying turned on']);
              break;
            case 'off':
              save.plug.relay = false;

              rpc.emit('call', client, 'privmsg', [target, prefix + '[plug.dj] Chat relaying turned off']);
              break;
          }

          fs.writeFileSync(saveFile, JSON.stringify(save));
					break;
        case 'queue':
          plugBot.joinBooth();
          break;
        case 'dequeue':
          plugBot.leaveBooth();
          break;
			}
		}
	}
};
