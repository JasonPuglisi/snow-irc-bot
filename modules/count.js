module.exports = {
	count: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		var name = args[0].substring(0, 100);
		var option = args[1];
		var amount = args[2];

		if (!amount || isNaN(amount) || amount < 0 || amount > 100000)
			amount = 1;
		else
			amount = Math.round(amount);

		if (save.counts === undefined)
			save.counts = {};
		if (save.counts[client] === undefined)
			save.counts[client] = {};
		if (save.counts[client][name.toLowerCase()] === undefined)
			save.counts[client][name.toLowerCase()] = 0;

		if (option === '+')
			save.counts[client][name.toLowerCase()] = Math.min(save.counts[client][name.toLowerCase()] + amount, 1000000);

		else if (option === '-')
			save.counts[client][name.toLowerCase()] = Math.max(save.counts[client][name.toLowerCase()] - amount, 0);

		else if (option === '=')
			save.counts[client][name.toLowerCase()] = amount;

		else
			option = '=';

		rpc.emit('call', client, 'privmsg', [target, prefix + '[' + option + '] ' + name + ' count: ' + save.counts[client][name.toLowerCase()]]);

		fs.writeFileSync(saveFile, JSON.stringify(save));
	}
};
