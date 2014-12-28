module.exports = {
	readyCounts: function() {
		if (!global.countData) {
			global.countFile = 'counts.json';
			global.countData = require('../' + countFile);
		}
	},

	count: function(client, network, channel, command, trigger, nickname, target, args, prefix) {
		readyCounts();

		var name = args[0].substring(0, 100);
		var option = args[1];
		var amount = args[2];

		if (!amount || isNaN(amount) || amount < 1 || amount > 100000)
			amount = 1;
		else
			amount = Math.round(amount);

		if (countData[client] === undefined)
			countData[client] = {};
		if (countData[client][name.toLowerCase()] === undefined)
			countData[client][name.toLowerCase()] = 0;

		if (option === '+')
			countData[client][name.toLowerCase()] = Math.min(countData[client][name.toLowerCase()] + amount, 1000000);

		else if (option === '-')
			countData[client][name.toLowerCase()] = Math.max(countData[client][name.toLowerCase()] - amount, 0);

		else if (option === '=')
			countData[client][name.toLowerCase()] = amount;

		rpc.emit('call', client, 'privmsg', [target, prefix + name + ' count: ' + countData[client][name.toLowerCase()]]);

		fs.writeFileSync(countFile, JSON.stringify(countData));
	}
};
