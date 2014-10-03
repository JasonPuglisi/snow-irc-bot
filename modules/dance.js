module.exports = {
	doDance: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var danceCount = 0;

		var limit = args[0];
		var speed = args[1] || 1;

		if (isNaN(limit) || limit < 1) limit = 1;
		limit = Math.min(limit, 50);

		if (isNaN(speed) || speed < 1) speed = 1;
		speed = Math.min(speed, 5);

		for (var i = 1; i <= limit; i++)
			setTimeout(function() {
				danceCount++;

				if (limit === danceCount)
					rpc.emit('call', client, 'privmsg', [target, '\\o/']);

				else if (danceCount % 2 === 1)
					rpc.emit('call', client, 'privmsg', [target, '/o/']);

				else
					rpc.emit('call', client, 'privmsg', [target, '\\o\\']);
			}, (1500 / speed) * i);
	}
};
