module.exports = {
	sendMessage: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'privmsg', [args[0], args.slice(1).join(' ')]);
	},

	sendNotice: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'notice', [args[0], args.slice(1).join(' ')]);
	},

	joinChannel: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (isChannel(args[0]))
			rpc.emit('call', client, 'join', [args[0], args[1]]);
	},

	partChannel: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		if (isChannel(args[0]))
			rpc.emit('call', client, 'part', [args[0], args.slice(1).join(' ')]);
	},

	setMode: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'mode', [args[0], args.slice(1).join(' ')]);
	},

	setTopic: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'topic', [args[0], args.slice(1).join(' ')]);
	},

	doAction: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'me', [args[0], args.slice(1).join(' ')]);
	},

	setNick: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		rpc.emit('call', client, 'raw', ['NICK', args[0]]);

		if (args[1] !== undefined)
			rpc.emit('call', client, 'privmsg', ['nickserv', 'identify ' + args[1]]);

		tempNick = args[0];
	}
};
