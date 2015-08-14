var Slack = require('slack-client'),
	donedone_api = require('donedone-api'),
	sortBy = require('sort-by'),
	fs = require('fs');

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
	}
	else {
		console.log('You are not in any channels.');
	}

	if (groups.length > 0) {
	   console.log('As well as: ' + groups.join(', '));
	}
});

slack.on('message', function(message) {
	var channel = slack.getChannelGroupOrDMByID(message.channel);
	if (message.user = "U091Y6VM5"){
		if (message.text == "!issues"){
			donedone_api.getIssuesWaitingOnYou('quba', 'jcashmore', keys.donedone, function(err, data){
				var issues = data.issues;
				issues.sort(sortBy('-priority.id'));
				var issueMsg = "";
				issues.forEach(function(issue){
					var re = new RegExp(/(\w[\w\s']+$)/);
					var title = issue.title.match(re)[0].trim();
						project = issue.project.name.split(" - ")[1],
						priority = issue.priority.name;

					issueMsg += ("*" + priority + "* - " + project + " - " + title + "\n");
				});
				channel.send("*Jasper's Tickets*:\n" + issueMsg);
			});
		}
	}
});

slack.login();