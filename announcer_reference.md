# Announcer reference

Arguments in \<chevrons\> are required while arguments in [brackets] are optional. See below for global arguments. Only optional arguments will default to specified values. See individual command arguments for exceptions.

Global arguments:

- channel: Name of channel that command is being used for. Must start with # character. Defaults to channel that command is used in. 
- set_name: Name of set that command is being used for.

## On/off

```!announce [channel] on [set_name]```

Starts the announcer in channel [channel] with set \<set_name\>. If announcer is already running, will restart. If [set_name] not specified, will use dates and times.

```!announce [channel] off```

Stops the announcer in channel [channel].

## Sets

```!announce [channel] set <set_name> add```

Creates a set \<set_name\> in channel [channel].

```!announce [channel] set <set_name> remove```

Destroys the set \<set_name\> in channel [channel].

```!announce [channel] set <set_name> alias <aliased_set_name>```

Creates a set \<set_name\> in channel [channel] that is an alias of \<aliased_set_name\> in channel [channel]. Messages in \<set_name\> are always the same as messages in \<aliased_set_name\>, and cannot be modified.

```!announce [channel] set <set_name> copy <copied_set_name>```

Creates a set \<set_name\> in channel [channel] that is a copy of \<copied_set_name\> in channel [channel]. Messages in \<set_name\> are the same as messages in \<copied_set_name\> when \<set_name\> was created, and can be modified.

```!announce [channel] set <set_name> rename <new_set_name>```

Renames set \<set_name\> to \<new_set_name\> in channel [channel].

```!announce [channel] set <set_name> default```

Makes set \<set_name\> default in channel [channel]. Removes previous default. First set created is automatically made default.

```!announce [channel] set <set_name> update interval [interval_time]```

Updates number of seconds between messages to [inverval_time]. Default is 300, which is five minutes. If [interval_time] not specified, will revert to default.

```!announce [channel] set <set_name> update date start [start_date]```

Updates set automatic start date to [start_date] in format YYYY-MM-DD, such as 2015-01-01. Set will only be announced automatically on [start_date] or later. Default is none. If [start_date] not specified, will revert to default.

```!announce [channel] set <set_name> update date end [end_date]```

Updates set automatic end date to [end_date] in format YYYY-MM-DD, such as 2015-12-31. Set will only be announced automatically on [end_date] or earlier. Default is none. If [end_date] not specified, will revert to default.

```!announce [channel] set <set_name> update time start [start_time]```

Updates set automatic start time to [start_time] in format HH:MM, such as 00:00. Set will only be announced automatically at [start_time] or later. Default is 00:00. If [start_time] not specified, will revert to default.

```!announce [channel] set <set_name> update time end [end_time]```

Updates set automatic end time to [end_time] in format HH:MM, such as 23:59. Set will only be announced automatically at [end_time] or earlier. Default is 23:59. If [end_time] not specified, will revert to default.

## Messages

```!announce [channel] msg <set_name> add <message>```

Creates a message \<message\> in set \<set_name\> in channel [channel]. Message is inserted at lowest available spot number, starting at 1.

```!announce [channel] msg <set_name> remove <spot>```

Destroys the message in spot \<spot\> in set \<set_name\> in channel [channel]. Messages in spots after \<spot\> are shifted back one spot.

```!announce [channel] msg <set_name> alias <spot>```

Creates a message \<message\> in set \<set_name\> in channel [channel] that is an alias of message at spot \<spot\>. Message is always the same as message in \<spot\>, and cannot be modified.

```!announce [channel] msg <set_name> edit <spot> <message>```

Edits messageat spot \<spot\> in set \<set_name\> in channel [channel] to \<message\>.

```!announce [channel] msg <set_name> move <spot> <new_spot>```

Moves message in spot \<spot\> in set \<set_name\> in channel [channel] to spot \<new_spot\>. Messages in spots \<new_spot\> and following, before spot \<spot\>, are shifted forward one spot.

```!announce [channel] msg <set_name> swap <spot> <new_spot>```

Swaps message in spot \<spot\> with message in spot \<new_spot\> in set \<set_name\> in channel [channel].

```!announce [channel] msg <set_name> first <spot>```

Moves message in spot \<spot\> in set \<set_name\> in channel [channel] to spot 1. Previous message in spot 1 and messages in spots after 1, before spot \<spot\>, are shifted forward one spot.

```!announce [channel] msg <set_name> last <spot>```

Moves message in spot \<spot\> in set \<set_name\> in channel [channel] to first available spot at end of message list. Messages in spots after \<spot\> are shifted back one spot.

## Lists

```!announce [channel] list set```

Outputs the list of sets in channel [channel] in alphabetical order.

```!announce [channel] list msg [set_name]```

Outputs the list of spots and messages in set [set_name] in channel [channel] in ascending spot order. If [set_name] not specified, outputs list for default set.
