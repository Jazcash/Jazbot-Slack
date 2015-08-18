"use strict";

var fs = require('fs');
var nodemailer = require('nodemailer');
var email = JSON.parse(fs.readFileSync('keys.json')).gmail;

var transporter = nodemailer.createTransport({
    service: 'gmail',
    port: 465,
    auth: {
        user: email.address,
        pass: email.password
    }
});

module.exports = {
	trigger: "golive",
	description: "Sends out Go Live notification emails",
	args: [
		{
			names: ["client"],
			action: "store",
			help: "Existing client as defined in golive.json",
		}
	],
	func: function(slack, args){
		var clients = JSON.parse(fs.readFileSync('golive.json'));

		if (!(args.client in clients)){
			slack.chan.send("No client named " + args.client);
			return;	
		}

		var mailOptions = {
		    from: 'Quba Dev Team <devteam.quba@gmail.com>',
		    to: clients[args.client].join(","),
		    subject: args.client + ' Go Live',
		    html: 'A ' + args.client + ' Go Live is being performed. Expect some short downtime.',
		};

		transporter.sendMail(mailOptions, function(error, info){
		    if (error){
		        console.log(error);
		        slack.chan.send("There was an error sending emails.");
		    } else {
		        console.log('Message sent: ' + info.response);
		        slack.chan.send("Notification emails sent.");
		    }
		});
	}
};