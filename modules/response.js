module.exports = {
	processResponse: function(client, network, channel, nickname, target, message) {
		var text = message.join(' ');

		var name = network.identity.nick || config.identity.nick;

		var log = channel.settings.log;
		if (log === undefined) {
			log = network.settings.log;
			if (log === undefined)
				log = config.settings.log;
		}

		var nolog = channel.settings.nolog || network.settings.nolog || [];

		var respond = channel.settings.respond;
		if (respond === undefined) {
			respond = network.settings.respond;
			if (respond === undefined)
				respond = config.settings.respond;
		}

		var toName = text.toLowerCase().indexOf(name.toLowerCase() + ' ') === 0 || text.toLowerCase().indexOf(name.toLowerCase() + ', ') === 0;
		var shouldAdd = nolog.indexOf(nickname.toLowerCase()) === -1 && log;

		if (toName && respond)
			rpc.emit('call', client, 'privmsg', [target, megahal.getReplyFromSentence(text.substring(name.length + 1))]);

		else
			if (shouldAdd) {
				var textEnd = text.charAt(text.length - 1);
				var hasPunctuation = textEnd === '.' || textEnd === '!' || textEnd === '?';
				if (!hasPunctuation) text += '.';

				fs.appendFile('brain.txt', text + ' ');
				megahal.add(text);
			}
	}
};
