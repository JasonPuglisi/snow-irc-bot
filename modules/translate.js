module.exports = {
	getTranslation: function(client, network, channel, command, trigger, nickname, target, arguments, prefix) {
		if (config.apis.microsoft !== undefined) {
			var microsoftId = config.apis.microsoft.id;
			var microsoftSecret = config.apis.microsoft.secret;
		}
		
		if (microsoftId !== undefined && microsoftSecret !== undefined) {
			var targetLang = arguments[0];
			var input = iconv.decode(new Buffer(arguments.slice(1).join(' ')), 'ISO-8859-1');

			var authUrl = 'https://datamarket.accesscontrol.windows.net/v2/OAuth2-13/';
			var scopeUrl = 'http://api.microsofttranslator.com';
			var grantType = 'client_credentials';

			request.post(authUrl, {
				form: {
					client_id: microsoftId,
					client_secret: microsoftSecret,
					scope: scopeUrl,
					grant_type: grantType
				}
			}, function (error, response, body) {
				if (!error && response.statusCode === 200) {
					var data = JSON.parse(body);

					var accessToken = data.access_token;
					var translateUrl = 'https://api.microsofttranslator.com/V2/Http.svc/Translate?appId=Bearer ' + encodeURIComponent(accessToken) + '&text=' + input + '&to=' + targetLang + '&contentType=text/plain';

					request(translateUrl, function (error, response, body) {
						if (!error && response.statusCode === 200)
							parseXml.parseString(body, function (error, result) {
								var translation = result.string._;
								rpc.emit('call', client, 'privmsg', [target, prefix + '[' + targetLang + '] ' + translation]);
							});
						
						else
							rpc.emit('call', client, 'privmsg', [target, prefix + 'The language code \'' + targetLang + '\' is not valid (Languages Codes: http://msdn.microsoft.com/en-us/library/hh456380.aspx)']);
					});
				}
			});
		}
	}
};
