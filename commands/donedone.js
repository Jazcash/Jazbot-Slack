"use strict";

var donedone_api 	= require('donedone-api'),
	sortBy 			= require('sort-by');

module.exports = {
	trigger: "donedone",
	description: "DoneDone",
	args: [
		// {
		// 	names: ["numOfIssues"],
		// 	action: "store",
		// 	type: "int",
		// 	help: "Number of issues",
		// }
	],
	func: function(config, slack, args){
		donedone_api.getIssuesWaitingOnYou('quba', 'jcashmore', config.donedone, function(err, data){
			var issues = data.issues;
			issues.sort(sortBy('-priority.id'));
			var issueMsg = "";
			issues.forEach(function(issue){
				var re = new RegExp(/(\w[\w\s']+$)/);
				var title = issue.title.match(re)[0].trim();
				var project = issue.project.name.split(" - ")[1];
				var priority = issue.priority.name;

				issueMsg += ("*" + priority + "* - " + project + " - " + title + "\n");
			});
			slack.chan.send("*Jasper's Tickets*:\n" + issueMsg);
		});
	}
};