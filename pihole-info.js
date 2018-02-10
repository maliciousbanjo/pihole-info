/* global Module */

/* Magic Mirror
 * Module: pihole-info
 *
 * By maliciousbanjo
 * MIT Licensed.
 */

Module.register("pihole-info", {
	// Default module config.
	defaults: {
		//apiURL: "http://pi.hole/admin/api.php",
		apiURL: "http://192.168.1.60/admin/api.php",
		showSources: true,
		showSourceHostnameOnly: true,
		webpassword: "",
		updateInterval: 10 * 60 * 1000, // every 10 minutes
		animationSpeed: 1000,

		retryDelay: 2500,
		initialLoadDelay: 0,
	},

	// Define start sequence.
	start: function() {
		console.log("Starting module: " + this.name);

		this.domains_being_blocked = null;
		this.dns_queries_today = null;
		this.ads_blocked_today = null;
		this.ads_percentage_today = null;
		this.top_sources = null;

		this.loaded = false;
		this.sendSocketNotification("START", this.config); // Start on the serverside
		//this.scheduleUpdate(this.config.initialLoadDelay);
	},

	// Override dom generator.
	getDom: function() {
		var wrapper = document.createElement("div");

		if (!this.loaded) {
			wrapper.innerHTML = this.translate("LOADING...");
			wrapper.className = "dimmed light";
			return wrapper;
		}

		var header = document.createElement("div")
		header.className = "small bright";
		header.innerHTML = this.ads_blocked_today + " ads blocked today. (" + this.ads_percentage_today + "%)"
		wrapper.appendChild(header);

		if (this.top_sources && Object.keys(this.top_sources).length) {
			var table = document.createElement("table");
			table.className = "xsmall light";
			wrapper.appendChild(table);

			var thead = document.createElement("thead");
			table.appendChild(thead);

			var row = document.createElement("tr");
			thead.appendChild(row);

			var sourceCell = document.createElement("th");
			sourceCell.innerHTML = "Client";
			row.appendChild(sourceCell);

			var countCell = document.createElement("th");
			countCell.innerHTML = "Requests";
			row.appendChild(countCell);

			var tbody = document.createElement("tbody");
			table.appendChild(tbody);

			for (var source in this.top_sources) {
				var adCount = this.top_sources[source];

				if (this.config.showSourceHostnameOnly) {
					var rx = /^(?!0)(?!.*\.$)((1?\d?\d|25[0-5]|2[0-4]\d)(\.|$)){4}$/
					var ip = source.substring(source.lastIndexOf("(") + 1, source.lastIndexOf(")"));

					if (rx.test(ip)) {
						hostname = source.substring(0, source.lastIndexOf("("))
						if (hostname.length) {
							source = hostname;
						}
					}
				}

				var row = document.createElement("tr");
				tbody.appendChild(row);

				var sourceCell = document.createElement("td");
				sourceCell.innerHTML = source;
				row.appendChild(sourceCell);

				var countCell = document.createElement("td");
				countCell.innerHTML = adCount;
				row.appendChild(countCell);
			}
		}

		var footer = document.createElement("div")
		footer.className = "xsmall";
		footer.innerHTML = this.dns_queries_today + " DNS queries, " + this.domains_being_blocked + " domains blacklisted."
		wrapper.appendChild(footer);

		return wrapper;
	},

	// updateStats: function() {
	// 	console.log("Getting Stats");
	// 	var url = this.config.apiURL + "?summary";
	// 	var self = this;
	// 	var retry = true;

	// 	var statsSummaryRequest = new XMLHttpRequest();
	// 	statsSummaryRequest.open("GET", url, true);
	// 	statsSummaryRequest.onreadystatechange = function() {
	// 		if (this.readyState === 4) {
	// 			if (this.status === 200) {
	// 				self.processSummary(JSON.parse(this.response));
	// 			} else {
	// 				console.log(self.name + ": Could not load pi-hole summary.");
	// 			}

	// 			if (retry) {
	// 				self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
	// 				// If self.loaded, the get was successful and we'll update at the regular time
	// 				// Otherwise, we need to schedule a retry
	// 			}
	// 		}
	// 	};
	// 	statsSummaryRequest.send();

	// 	if (self.config.showSources) {
	// 		console.log("Show Sources");
	// 		var url = this.config.apiURL + "?getQuerySources" + "&auth=" + this.config.webpassword;
	// 		var retry = true;

	// 		var statsSourcesRequest = new XMLHttpRequest();
	// 		statsSourcesRequest.open("GET", url, true);
	// 		statsSourcesRequest.onreadystatechange = function() {
	// 			console.log("State");
	// 			if (this.readyState === 4) {
	// 				console.log("4");
	// 				if (this.status === 200) {
	// 					console.log(this.response);
	// 					self.processSources(JSON.parse(this.response));
	// 				} else {
	// 					console.log(self.name + ": Could not load pi-hole sources.");
	// 				}

	// 				if (retry) {
	// 					self.scheduleUpdate((self.loaded) ? -1 : self.config.retryDelay);
	// 				}
	// 			}
	// 		};
	// 		statsSourcesRequest.send();
	// 	}
	// },

	// scheduleUpdate: function(delay, fn) {
	// 	var nextLoad = this.config.updateInterval;
	// 	if (typeof delay !== "undefined" && delay >= 0) {
	// 		nextLoad = delay;
	// 	}

	// 	var self = this
	// 	setTimeout(function() {
	// 		self.updateStats();
	// 	}, nextLoad);
	// },

	processSummary: function(data) {
		if (!data) {
			// Did not receive usable new data.
			return;
		}

		this.domains_being_blocked = data["domains_being_blocked"] || "0";
		this.dns_queries_today = data["dns_queries_today"] || "0";
		this.ads_blocked_today = data["ads_blocked_today"] || "0";
		this.ads_percentage_today = data["ads_percentage_today"] || "0.0";

		this.loaded = true;
		this.sendSocketNotification("RESCHEDULE", this.config);
		this.updateDom(this.config.animationSpeed);
	},

	processSources: function(data) {
		if (!data) {
			// Did not receive usable new data.
			console.log("processSources: No sources");
			return;
		}
		console.log("processSources: Sources added");
		this.top_sources = data["top_sources"] || [];
	},

	// Receive resulting information from the node-helper
	socketNotificationReceived: function (notification, payload) {
		console.log(notification);
		console.log(payload);
		if(notification === "SUMMARY") {
			this.processSummary(JSON.parse(payload));
		}
		if(notification === "SOURCES") {
			this.processSources(JSON.parse(payload));
		}
	},
});