var Slack 			= require('slack-client'),
	donedone_api 	= require('donedone-api'),
	sortBy 			= require('sort-by'),
	fs 				= require('fs'),
	ArgumentParser 	= require('argparse').ArgumentParser;

// load commands
var commands = {};
fs.readdirSync(__dirname + '/' + "commands").forEach(function(file) {
	if (file.match(/.+\.js/g) === null)
		return;

	var command = require(__dirname + '/commands/' + file);
	var parser = new ArgumentParser({version: '0.0.1', addHelp:true});

	if ("args" in command){
		var p = command.args;
		for (var i=0; i<p.length; i++){
			parser.addArgument(p[i].names, p[i]);
		}
	}
	command.parser = parser;
	commands[command.trigger] = command;
});

var keys = JSON.parse(fs.readFileSync('keys.json'));

var slack = new Slack(keys.slack, true, true);

var makeMention = function(userId) {
	return '<@' + userId + '>';
};

var isDirect = function(userId, messageText) {
	var userTag = makeMention(userId);
	return messageText &&
	messageText.length >= userTag.length &&
	messageText.substr(0, userTag.length) === userTag;
};

var getOnlineHumansForChannel = function(channel) {
	if (!channel) return [];

	return (channel.members || [])
	.map(function(id) { 
		return slack.users[id]; 
	})
	.filter(function(u) { 
		return (!!u && !u.is_bot && u.presence === 'active'); 
	});
};

slack.on('open', function () {
	var channels = Object.keys(slack.channels)
	.map(function (k) { return slack.channels[k]; })
	.filter(function (c) { return c.is_member; })
	.map(function (c) { return c.name; });

	var groups = Object.keys(slack.groups)
	.map(function (k) { return slack.groups[k]; })
	.filter(function (g) { return g.is_open && !g.is_archived; })
	.map(function (g) { return g.name; });

	console.log('Welcome to Slack. You are ' + slack.self.name + ' of ' + slack.team.name);

	if (channels.length > 0) {
		console.log('You are in: ' + channels.join(', '));
	} else {
		console.log('You are not in any channels.');
	}

	if (groups.length > 0) {
		console.log('As well as: ' + groups.join(', '));
	}
});

slack.on('message', function(message) {
	var channel = slack.getChannelGroupOrDMByID(message.channel),
	user = slack.getUserByID(message.user);

	if (message.text[0] === "!"){
		var fullCommand = message.text.substr(1).split(/\s(.+)?/);
		handleCommand({msg: message, chan: channel, user: user}, fullCommand[0], getargs(fullCommand[1]));
	}
});

function handleCommand(slack, cmd, args){
	if (!(cmd in commands))
		return;

	var thisCmd = commands[cmd];

	var errored = false;

	thisCmd.parser.error = function(err){
		slack.chan.send(err);
		errored = true;
	}

	args = thisCmd.parser.parseArgs(args);

	if (errored)
		return;

	thisCmd.func(slack, args);
}

// delimits options with quotes. e.g. '--word "hello world"' -> ['--word', 'hello world']
function getargs(argstr){
	if (argstr === undefined)
		return [];

	argstr = argstr+" ";
	var insideQuotes = false;
	var argstart = 0;
	var argend = 0;
	var args = [];
	for (var i in argstr){
		var char = argstr[i];
		if ((char == " ") && !insideQuotes){
			var arg = argstr.substr(argstart, argend);
			if (arg[0] == "\"" && arg[arg.length-1] == "\""){
				args.push(argstr.substr(argstart+1, argend-2));
			} else {
				args.push(argstr.substr(argstart, argend));
			}
			argstart = parseInt(i)+1;
			argend = 0;
		} else {
			if (char == "\""){
				insideQuotes = !insideQuotes;	
			}
			argend++;	
		}
	}
	return args;
}

slack.login();