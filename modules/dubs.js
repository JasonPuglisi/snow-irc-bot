module.exports = {
	getDubs: function(client, network, channel, command, trigger, nickname, target, arguments, prefix) {
		var size = arguments[0];

		if (isNaN(size) || size < 1) size = 2;
		size = Math.min(size, 10);

		var max = Math.pow(10, size) - 2;
		var random = Math.round(Math.random() * max + 1);

		rpc.emit('call', client, 'privmsg', [target, prefix + ('000000000' + random).slice(0 - size)]);
	}
};
