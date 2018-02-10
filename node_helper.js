
/* Magic Mirror
 * Node Helper: pihole-info
 *
 * By maliciousbanjo
 * MIT Licensed.
 */

var NodeHelper = require("node_helper");
var XMLHttpRequest = require("xmlhttprequest");

module.exports = NodeHelper.create({

	// Override socketNotificationReceived method.

	/* socketNotificationReceived(notification, payload)
	 * This method is called when a socket notification arrives.
	 *
	 * argument notification string - The identifier of the noitication.
	 * argument payload mixed - The payload of the notification.
	 */
	socketNotificationReceived: function(notification, payload) {
		if (notification === "START") {
			console.log(notification + " received!");
			console.log("Payload: " + payload);
			// Send notification
			this.getPiholeStats(payload);
		}
		if (notification === "RESCHEDULE") {
			console.log(notification);
			var self = this;
			setTimeout(function() {
				self.getPiholeStats(payload)
			}, payload.updateInterval);
		}
	},

	// Example function send notification test
	sendNotificationTest: function(payload) {
		this.sendSocketNotification("pihole-info-NOTIFICATION_TEST", payload);
	},

	// Test another function
	getPiholeStats: function(config) {
		console.log("Gathering Pihole Stats");
		var url = config.apiURL + "?summary";
		var self = this;
		var retry = false;

		var statsSummaryRequest = new XMLHttpRequest.XMLHttpRequest();
		statsSummaryRequest.open("GET", url, true);
		statsSummaryRequest.onreadystatechange = function() {
			if (this.readyState === 4) {
				if (this.status === 200) {
					console.log(this.responseText);
					self.sendSocketNotification("SUMMARY", this.responseText);
				}
				else {
					console.log(self.name + ": Could not load pihole summary.");
					retry = true; // Try again
				}

				if (retry) {
					console.log("Retrying...");
					console.log(config);
					self.getPiholeStats(config); // Recursive until success
				}
			}
		};
		statsSummaryRequest.send();

		if (config.showSources) {
			var url = config.apiURL + "?getQuerySources" + "&auth=" + config.webpassword;
			var retry = false;

			var statsSourcesRequest = new XMLHttpRequest.XMLHttpRequest();
			statsSourcesRequest.open("GET", url, true);
			if (this.readyState === 4) {
				if (this.status === 200) {
					console.log(this.responseText);
					self.sendSocketNotification("SOURCES", this.responseText);
				}
				else {
					console.log(self.name + ": Could not load pihole sources.");
					retry = true; // Try again
				}

				if (retry) {
					console.log("Retrying...");
					console.log(config);
					this.getPiholeStats(config); // Recursive until success
				}
			};
			statsSourcesRequest.send();
		}
	}
});
