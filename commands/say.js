"use strict";

module.exports = {
	trigger: "say",
	description: "Says some text",
	args: [
		{
			names: ["msg"],
			action: "store",
			help: "Text to say",
		}
	],
	func: function(slack, args){
		slack.chan.send(args.msg);
	}
};