# Snow IRC Bot

Snow IRC Bot is a multi-purpose JavaScript IRC bot for Node.js created to suit some specific needs. It can be easily modified for use in any IRC channel, and commands can be added and deleted as needed.

You will need to customize the configuration file ```snow.json``` to get your bot ready. Read the sections below to make sure you have everything you need to run Snow IRC Bot without any problems.

# NPM Dependencies

Snow IRC Bot relies on the following Node Package Manager dependencies to run.

- iconv-lite
- irc
- jsmegahal
- moment
- request
- xml2js

To install these dependencies, make sure you have Node.js and NPM installed. Then run ```npm install iconv-lite irc jsmegahal moment request xml2js```.

To verify that you have the latest versions of these dependencies, run ```npm update```.

# API Dependencies

Snow IRC Bot relies on the following APIs for various commands. Commands mentioned in each API dependency can be removed to disable their features and avoid errors without proper API keys present.

API keys and other information are stored in the ```apis``` section of the configuration file.

## Google Geocoding API

The [Google Geocoding API] is used in the ```weather``` command to find the address and coordinates of a location input. It cannot be used without Forecast for Developers. Your Google Geocoding API key is stored in ```apis -> google -> key```.

At the time of writing, the Google Geocoding API provides 2,500 free API requests per day.

## Forecast for Developers

[Forecast for Developers] is used in the ```weather``` command to find the weather information of a coordinate location input. It cannot be used without the Google Geocoding API. Your Forecast for Developers key is stored in ```apis -> forecast -> key```.

At the time of writing, Forecast for Developers provides 1,000 free API requests per day. Although the Google Geocoding API will continue to work after this cutoff, the command will fail to complete.

## Microsoft Translator

[Microsoft Translator] is used in the ```translate``` command to translate an input to a specified language. Your Microsoft Translator client ID is stored in ```apis -> microsoft -> id``` and your Microsoft Translator client secret is stored in ```apis -> microsoft -> secret```.

At the time of writing, Microsoft Translator provides free translations for 2,000,000 characters per month. Microsoft Translator was chosen over the Google Translate API because the Google Translate API does not offer a free service.

## Yo API

[Yo API] is used in the ```yo``` command to send a Yo to a specified username. Your Yo API account name is stored in ```apis -> yo -> name``` and your Yo API key is stored in ```apis -> yo -> key```.

At the time of writing, Yo API provides one Yo per username per minute. If this limit is exceeded, the bot will announce a warning in chat.

# Configuration

All Snow IRC Bot configuration is done in the ```snow.json``` configuration file. The following sections will detail what you need to put where to get your bot up and running.

## Settings

Navigate to the ```settings``` section of the configuration file. The following entries most be configured.

- ```server```: The IRC server you want your bot to connect to. Connections by default are made over SSL. If your server does not support SSL, you must change the ```client``` variable in ```snow.js```. The line ```port: 6697,``` parameter must be changed to ```port: 6667``` and the two lines below it must be deleted.
- ```name```: The nick that you want your bot to use on the IRC server. It's encouraged to register your bot's name with NickServ, or your IRC server's equivalent, if possible. Make sure that nobody else is using the nick you choose, and that you are not using the nick yourself when you launch the bot.
- ```removeMask```: The option that specifies whether to unset your IRC server's host masking or not. Only some IRC servers have automatic host masking, so this may not be applicable in all cases. If set to ```true```, it will set the mode ```-x``` on your nickname, which will usually remove automatic host masks. If set to ```false```, it will do nothing.
- ```namePassword```: The NickServ, or equivalent, password for your bot's nick. If your bot is not registerd with NickServ, or your IRC server is using a different nick authentication system, you should remove or modify the line under ```Identify with NickServ``` in the main ```snow.js``` file.
- ```admins```: A list of bot administrators who will be able to use the bot's private message commands. The list must contain at least one nick, and the first nick will be considered the main administrator. You should set this to your own nick, and make sure that you are registered with NickServ, or your server's equivalent, to make sure nobody can take it from you.
- ```channels```: A list of channels that the bot will join upon start. The list must contain at least one channel, and the first channel will be considered the default channel. Your bot may not work properly if you do not have it join any channels automatically.
- ```users```: A list of users in the default channel. This should be left blank at all times, as it will automatically populate when the bot starts, as well as when people join or leave the default channel.
- ```defaultBot```: The nick of a bot in the default channel that shares one or more commands with Snow IRC Bot. This is to make sure that Snow IRC Bot doesn't execute commands that may be covered by another bot. If this isn't needed, leave the value blank.
- ```symbol```: The symbol prepended to commands in channel messages. Some commands may have symbols of their own that ignore this, but it is good to stay consistent whenever possible.

## Commands

Navigate to the ```settings -> commands``` section of the configuration file. The following entries may be left as default or configured as needed.

- ```name```: The friendly name of each command. These values are not used anywhere in the code, and can be modified freely. It's recommended to leave them as default for easy reference.
- ```function```: The function executed for each command. These should be left as default unless the function names are specifically changed in the code.
- ```minArgs```: The minimum number of arguments that may be specified along with a command. These values should be left as default unless code is changed to require more or fewer arguments.
- ```commands```: Information for each input that executes the command. These entries can be added, removed, or modified freely.
    - ```command```: The text input that executes the command.
    - ```symbol```: Whether the the default command symbol must be prepended to the beginning of the command text. This should be ```true``` if your command text does not have a custom symbol, and ```false``` if it does.
    - ```exclusive```: Whether the command is exclusive to Snow IRC Bot or not. If there is a default bot specified that uses the same command text as this command entry, this value should be set to ```false```. If no other bot shares this command text, this value should be set to ```true```.

## Dependencies

The ```dependencies``` entries should be left how they are unless code is modified to require more or fewer dependencies. The object key will be the name of the variable in the code, and the value will be the full dependency name, such as one for an NPM package.

## APIs

The ```apis``` entries should be changed only according to the API Dependencies information above. Snow IRC Bot will not function properly without the required API keys unless their dependent commands are removed.

# Commands

The following commands can be executed by any user in any IRC channel. These are only the default commands, and they may be removed or added as desired. They include symbols based on the default configuration.

## Weather

> ```!w [today|tomorrow|week] <location>```

> ```!weather ...```

> ```!s ...```

> ```!snow ...```

The weather command announces the weather for the specified location in both fahrenheit and celsius, as well as the local time for the specified location. If the today option is included, the command announces a weather summary for the day, with temperature highs and lows. If the tomorrow option is included, the command announces a weather summary for the next day, with temperature highs and lows. If the week option is included, the command announces a weather summary for the week.

## Fahrenheit

> ```!f <celsius>```

> ```!fahrenheit <celsius>```

The fahrenheit command announces the fahrenheit conversion of the specified celsius temperature. It also includes the original celsius temperature for reference.

## Celsius

> ```!c <fahrenheit>```

> ```!celsius <fahrenheit>```

The celsius command announces the celsius conversion of the specified fahrenheit temperature. It also includes the orginal fahrenheit temperature for reference.

## Video

> ```!v <video>```

> ```!video ...```

> ```!yt ...```

> ```!youtube ...```

The video command searches YouTube for the specified video. If a match is found, the video title and url are announced.

## Translate

> ```!t <target-language-code> <text>```

> ```!translate ...```

The translate command uses Microsoft Translator to translate the specified text to a language based on the specified [language code]. If the translation is successful, the translated text and its target language are announced.

## Boobs

> `!boobs`

> `.boobs`

> `!tits`

> `.tits`

__[NSFW]__ The boobs command fetches an image of a pair of boobs and announces the link.

## Butt

> `!butt`

> `.butt`

> `!ass`

> `.ass`

__[NSFW]__ The butt command fetches an image of a butt and announces the link.

## Dubs

> ```!dubs [digits]```

> ```.dubs ...```

> ```:dubs ...```

The dubs command rolls a random number with the specified amount of digits. If no amount is specified, it defaults to two. It announces the random number, which is checked by the user for repeating digits.

## 8ball

> ```!8ball [question]```

> ```.8ball ...```

> ```:8ball ...```

The 8ball command announces a random [Magic 8-Ball answer]. The user can choose to ask a question along with the command, but it has no effect on the output.

## Yo

> ```!y <username>```

> ```!yo <username>```

> ```yo <username>```

The Yo command sends a Yo to the specified username. The username must be subscribed to the bot by having sent a Yo to it in the past. The command will only work once per minute for each username.

# Administrator Commands

The following commands can be executed in a private message to the bot. They can be executed by any user that is a part of ```admins``` in the configuration file.

## Say

> ```say <channel> <message>```

The say command announces the specified message in the specified channel. The bot must be in the specified channel.

## Act

> ```act <channel> <action>```

The act command does the specified action in the specified channel. The bot must be in the specified channel.

## Join

> ```join <channel>```

The join command joins the specified channel. The bot must not be in the specified channel already.

## Part

> ```part <channel>```

The part command parts the specified channel. The bot must be in the specified channel.

## Nick

> ```nick <nick>```

The nick command changes the bot's nick to the specified nick. Before using this, make sure that the nick is not in use already and is not registered by NickServ, or your server's equivalent.

# Extra Features

These are extra features that may not be needed for your bot's purposes. They can be disabled by deleting the code specified in each section.

## Sentience

As Snow IRC Bot spends time in IRC, it will save what users say in its brain file ```snow.txt```. If a channel message begins with the bot's name, followed by a space, it will announce a response based on the message and chat history. The more it hears, the more it learns.

It's best to start off with a blank brain flie, but you can add to your bot's brain manually by adding individual sentences with punctuation. Just make sure to leave a space at the end of the file if you edit it yourself.

This feature can be disabled by deleting the line under ```Check for brain response``` in the main code file ```snow.js```.

## Curse to Bless Converter

The Curse to Bless Converter converts all forms of the word ```curse``` in a channel message to their respective forms of the word ```bless``` and announces the result. It does so automatically and without any input from the user.

The converter also detects and converts reversed text forms of the word ```curse``` to reversed text forms of the word ```bless```. If a channel message matches ```!curse``` exactly, an image is appended to the response in dedication to the user who inspired this feature.

This feature can be disabled by deleting the line under ```Check for curse response``` in the main code file ```snow.js```.

# License

Feel free to do pretty much whatever you want with this code. Just include the license statement below and you're good to go. If you ever end up making money off of this somehow, remember that sharing is caring.

## The MIT License (MIT)

The MIT License (MIT)

Copyright (c) 2014 Jason Puglisi

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.


[Google Geocoding API]:https://developers.google.com/maps/documentation/geocoding/
[Forecast For Developers]:https://developer.forecast.io/
[Microsoft Translator]:http://msdn.microsoft.com/en-us/library/ff512423.aspx
[Yo API]:http://dev.justyo.co/documents.html
[language code]:http://msdn.microsoft.com/en-us/library/hh456380.aspx
[Magic 8-Ball answer]:https://en.wikipedia.org/wiki/Magic_eight_ball#Possible_answers
