(function($) {
	/*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
	 */

	var config1 = {
		apiKey: testApiKey,
		address: testUsers[0].address,
		password: testUsers[0].password,
		displayName: 'Unit Tester #1',
		capability: {
			refreshPeriod: 5
		}
	};
	var config2 = {
		apiKey: testApiKey,
		address: testUsers[1].address,
		password: testUsers[1].password,
		displayName: 'Unit Tester #2',
		capability: {
			refreshPeriod: 5
		},
		onDisconnected: function (event) {
			if (event.status === 'normal') {
				QUnit.start();
			}
			// Otherwise wait for the hung test timeout
		}
	};
	var config3 = {
		apiKey: testApiKey,
		address: testUsers[2].address,
		password: testUsers[2].password,
		displayName: 'Unit Tester #3',
		capability: {
			refreshPeriod: 5
		}
	};

	QUnit.module("Capability API");
	
	QUnit.asyncTest("test onWatchRequest events fire", 1, function(assert) {
		config2.capability.onWatchRequest = function() {
			assert.ok(true, "onWatchRequest fired");
			croc1.capability.stop();
		};
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
	});
	
	QUnit.asyncTest("invalid configuration: setWatchStatus sets wrong status", 2, function(assert) {
		config2.capability.onWatchRequest = function(event) {
			var status = croc1.capability.watchDataCache[config2.address].status;
			switch (status) {
				case "normal":
					assert.throws(function() {
						event.setWatchStatus("invalid");
					}, CrocSDK.Exceptions.ValueError, "Throws if status is an invalid value.");
					break;
			}
		};		
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			croc1.capability.stop();
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "normal", "expected value normal after refresh");
				croc1.capability.refresh(config2.address);
			}, 2000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
	});
	
	QUnit.asyncTest("invalid configuration: setWatchStatus sets wrong status type", 2, function(assert) {
		config2.capability.onWatchRequest = function(event) {
			var status = croc1.capability.watchDataCache[config2.address].status;
			switch (status) {
				case "normal":
					assert.throws(function() {
						event.setWatchStatus(1);
					}, TypeError, "Throws if status is an invalid type.");
					break;
			}
		};		
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			croc1.capability.stop();
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "normal", "expected value normal after refresh");
				croc1.capability.refresh(config2.address);
			}, 2000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
	});
	
	QUnit.asyncTest("test onWatchChange events fire", 9, function(assert) {
		config1.capability.onWatchChange = function(event) {
			assert.strictEqual(event.address, croc2.address, "expected address for onWatchChange event");
			assert.strictEqual(event.status, croc1.capability.watchDataCache[config2.address].status, "expected status for onWatchChange event");
			assert.deepEqual(event.capabilities, croc1.capability.watchDataCache[config2.address].capabilities, "expected capabilities for onWatchChange event");
		};
		config2.capability.onWatchRequest = function(event) {
			var status = croc1.capability.watchDataCache[config2.address].status;
			switch (status) {
				case "normal":
					event.setWatchStatus("blocked");
					break;
			}
		};		
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			croc1.capability.stop();
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "normal", "expected value normal after refresh");
				croc1.capability.refresh(config2.address);
			}, 2000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "blocked", "expected value blocked after refresh");
			}, 4000);	
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "blocked", "expected value blocked after refresh");
			}, 6000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 8000);
	});
	
	QUnit.asyncTest("Watch Capabilities for address", 5, function(assert) {
		config1.capability.onWatchChange = function() {
			croc1.capability.stop();
		};
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		var croc3 = $.croc(config3);
		
		croc3.sipUA.on('registered', function () {
		
			croc1.capability.watch(config2.address);
			assert.strictEqual(croc1.capability.watchList[0], config2.address, 'correct address in watchList');
			
			croc1.capability.watch(config2.address);
			assert.strictEqual(croc1.capability.watchList.length, 1, 'only one address entry per address in watchList');
			
			croc1.capability.watch(config3.address);
			assert.strictEqual(croc1.capability.watchList.length, 2, 'more than one address in watchList');
			assert.strictEqual(croc1.capability.watchList[0], config2.address, 'first entry added to the watchList');
			assert.strictEqual(croc1.capability.watchList[1], config3.address, 'most recent entry added to end of the watchList');
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc3.disconnect();
			croc2.disconnect();
		}, 5000);
	});
	
	QUnit.asyncTest("UnWatch Capabilities for address", 6, function(assert) {
		config1.capability.onWatchChange = function() {
			croc1.capability.stop();
		};
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		var croc3 = $.croc(config3);
		
		croc3.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			assert.strictEqual(croc1.capability.watchList.length, 1, 'expected length of watchList');			
			
			setTimeout(function() {
				croc1.capability.unwatch(config2.address);
				assert.strictEqual(croc1.capability.watchList.length, 0, 'expected length of watchList');
				croc1.capability.watch(config2.address);
				croc1.capability.watch(config3.address);
				assert.strictEqual(croc1.capability.watchList.length, 2, 'successfully added more than one entry to watchList');
			}, 2000);
			
			setTimeout(function() {
				croc1.capability.unwatch(config2.address);
				assert.strictEqual(croc1.capability.watchList.length, 1, 'successfully removed one entry from watchList');
				assert.strictEqual(croc1.capability.watchList[0], config3.address, 'successfully removed correct entry from watchList');
				
				croc1.capability.unwatch(config2.address);
				assert.strictEqual(croc1.capability.watchList.length, 1, 'entry not present, does not remove an entry from watchList');				
			}, 4000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc3.disconnect();
			croc2.disconnect();
		}, 6000);
	});
	
	QUnit.asyncTest("Refresh Capabilities", 5, function(assert) {
		config1.capability.onWatchChange = function() {
			croc1.capability.stop();
		};
		config2.capability.onWatchRequest = function(event) {
			var status = croc1.capability.watchDataCache[config2.address].status;
			switch (status) {
				case "normal":
					event.setWatchStatus("blocked");
					break;
				case "blocked":
					event.setWatchStatus("offline");
					break;
				case "offline":
					event.setWatchStatus("notfound");
					break;
			}
		};
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			assert.strictEqual(croc1.capability.refresh(config2.address), null, "expected value, address isn't in watchList");
			
			croc1.capability.watch(config2.address);
			
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "normal", "expected value normal after refresh");
				croc1.capability.refresh(config2.address);
			}, 2000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "blocked", "expected value blocked after refresh");
				croc1.capability.refresh(config2.address);
			}, 4000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "offline", "expected value offline after refresh");
				croc1.capability.refresh(config2.address);
			}, 6000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].status, "notfound", "expected value notfound after refresh");
			}, 8000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 12000);
	});
	
	QUnit.asyncTest("Get Capabilities for address", 2, function(assert) {
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
	
		croc2.sipUA.on('registered', function () {
			assert.strictEqual(croc1.capability.getCapabilities(config2.address), null, "expected value, address isn't in watchList");
			
			croc1.capability.watch(config2.address);
			assert.equal(croc1.capability.getCapabilities(config2.address), croc1.capability.watchDataCache[config2.address].capabilities, "capabilities match");
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
	});
	
	QUnit.asyncTest("Get Watch Status for address", 2, function(assert) {
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
	
		croc2.sipUA.on('registered', function () {
			assert.strictEqual(croc1.capability.getWatchStatus(config2.address), null, "expected value, address isn't in watchList");
			
			croc1.capability.watch(config2.address);
			assert.equal(croc1.capability.getWatchStatus(config2.address), croc1.capability.watchDataCache[config2.address].status, "status match");
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
	});

	QUnit.asyncTest("test custom capabilities", 3, function(assert) {
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.capabilities["custom.presence"] = "present";
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["custom.presence"], "present", "expected value present for capability custom.presence");
				croc2.capabilities["custom.presence"] = true;
			}, 2000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["custom.presence"], true, "expected value true for capability custom.presence");
				croc2.capabilities["custom.presence"] = false;
			}, 7000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["custom.presence"], false, "expected value false for capability custom.presence");
			}, 12000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 14000);
	});
	
	QUnit.asyncTest("test uncached/invalid capabilities not present in cache", 10, function(assert) {
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		// Give up if the test has hung for too long
		var hungTimerId = setTimeout(function() {
			assert.ok(false, 'Aborting hung test');
			croc1.disconnect();
			croc2.disconnect();
		}, 5000);
		
		croc2.capabilities["sip.audio"] = "invalid";
		croc2.capabilities["sip.class"] = true;
		croc2.capabilities["sip"] = "invalid";
		croc2.capabilities["croc.invalid"] = "invalid";
		croc2.capabilities["custom.test"] = 1;
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			setTimeout(function() {
				assert.strictEqual(croc2.capabilities["sip.audio"], "invalid", "new capability added");
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["sip.audio"], false, "Capability not added to cache as expected");
				assert.strictEqual(croc2.capabilities["sip.class"], true, "new capability added");
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["sip.class"], undefined, "Capability not added to cache as expected");
				assert.strictEqual(croc2.capabilities["sip"], "invalid", "new capability added");
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["sip"], undefined, "Capability not added to cache as expected");
				assert.strictEqual(croc2.capabilities["croc.invalid"], "invalid", "new capability added");
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["croc.invalid"], undefined, "Capability not added to cache as expected");
				assert.strictEqual(croc2.capabilities["custom.test"], 1, "new capability added");
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["custom.test"], undefined, "Capability not added to cache as expected");
				clearTimeout(hungTimerId);
				croc1.disconnect();
				croc2.disconnect();
			}, 2000);
		});
	});
	
	QUnit.asyncTest("test refreshPeriod", 8, function(assert) {
		config1.capability.onWatchChange = function(event) {
			assert.strictEqual(event.address, croc2.address, "expected address for onWatchChange event");
			assert.strictEqual(event.status, croc1.capability.watchDataCache[config2.address].status, "expected status for onWatchChange event");
			assert.deepEqual(event.capabilities, croc1.capability.watchDataCache[config2.address].capabilities, "expected capabilities for onWatchChange event");
		};
		var croc1 = $.croc(config1);
		var croc2 = $.croc(config2);
		
		croc2.sipUA.on('registered', function () {
			croc1.capability.watch(config2.address);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["sip.audio"], true, "expected value true for capabilities sip.audio");
				croc2.capabilities["sip.audio"] = false;
			}, 2000);
			setTimeout(function() {
				assert.strictEqual(croc1.capability.watchDataCache[config2.address].capabilities["sip.audio"], false, "expected value false for capabilities sip.audio");
			}, 7000);
		});
		
		// Give up if the test has hung for too long
		setTimeout(function() {
			croc1.disconnect();
			croc2.disconnect();
		}, 8000);
	});

}(jQuery));