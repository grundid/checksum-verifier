var ChecksumExtension = {
	downloads : {},
	
	log : function(str) {
		Components.classes['@mozilla.org/consoleservice;1'].getService(
				Components.interfaces.nsIConsoleService).logStringMessage(str);
	},

	onLoad : function() {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(
				Components.interfaces.nsIObserverService);
		observerService.addObserver(ChecksumExtension.downloadObserver, "dl-done", false);
		observerService.addObserver(ChecksumExtension.downloadObserver, "dl-start", false);
	},

	onUnload : function() {
		window.removeEventListener("load", ChecksumExtension.onLoad, false);
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(
				Components.interfaces.nsIObserverService);
		observerService.removeObserver(ChecksumExtension.downloadObserver, "dl-start", false);
		observerService.removeObserver(ChecksumExtension.downloadObserver, "dl-done", false);
	},

	downloadObserver : {
		observe : function(aSubject, topic, aData) {
			if (topic == "dl-done") {
				var dl = aSubject.QueryInterface(Components.interfaces.nsIDownload);				
				var linkInfo = ChecksumExtension.downloads[dl.targetFile.path];
				ChecksumExtension.log("linkInfo: " + linkInfo.checksum);
				if (linkInfo.checksum == null) {
					var document = linkInfo.document;
					var checksumMd5 = this.createChecksum(dl.targetFile,"MD5");
					var checksumSha1 = this.createChecksum(dl.targetFile,"SHA1");
					ChecksumExtension.log("MD5 for "+dl.displayName+" => " + checksumMd5);
					ChecksumExtension.log("SHA1 for "+dl.displayName+" => " + checksumSha1);
					this.findChecksumInDocument(document.getElementsByTagName("body"), [checksumMd5,checksumSha1]);
				}
				else {
					var hashTypeAndValue = linkInfo.checksum.split(":");
					if (hashTypeAndValue.length == 2) {
						var actualChecksum = this.createChecksum(dl.targetFile,hashTypeAndValue[0].toUpperCase());
						ChecksumExtension.log("verifing: "+dl.displayName+" => actual:" + actualChecksum+" expected: "+hashTypeAndValue[1]);
						
						if (actualChecksum != hashTypeAndValue[1]) {
							this.notifyFailedCheck(actualChecksum,hashTypeAndValue[1],dl.displayName);
						}
					}
				}

				delete ChecksumExtension.downloads[dl.targetFile.path];
			}
			else if (topic == "dl-start") {
				var dl = aSubject.QueryInterface(Components.interfaces.nsIDownload);				
				var linkInfo = {};
				linkInfo["document"] = content.document;
				var fullUrl = dl.source.prePath+dl.source.path;
				linkInfo["checksum"] = this.findLinkChecksum(content.document.getElementsByTagName("a"), fullUrl);
				ChecksumExtension.downloads[dl.targetFile.path] = linkInfo;
			}
		},
		
		notifyFailedCheck : function(actual, expected, fileName) {
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
			 .getService(Components.interfaces.nsIPromptService);
			 prompts.alert(window, "Checksum verification failed", "Checksum verification failed for "+fileName
					 + "\nExpected: "+expected+"\nActual: "+actual);
		},
		
		createChecksum : function(fileToCheck, hashType) {
			// open input stream
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
			istream.init(fileToCheck, -1, 0, 0);

			// hash check
			var ch = Components.classes["@mozilla.org/security/hash;1"]
			.createInstance(Components.interfaces.nsICryptoHash);
			ch.init(ch[hashType]); // initWithString
			const PR_UINT32_MAX = 0xffffffff;
			ch.updateFromStream(istream, PR_UINT32_MAX);
			var hash = ch.finish(false);
			var toHexString = function (charCode){ return ("0" + charCode.toString(16)).slice(-2); }
			var filechecksum = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
			filechecksum = filechecksum.replace(/[^0-9a-f]/ig, '').toLowerCase();
			return filechecksum;
			
		},
		
		findChecksumInDocument : function(elements, checksums) {
			for (var x = 0; x < elements.length;x++) {
				var node = elements[x];
				if (node.nodeType == 3) {
					for (var c = 0; c < checksums.length;c++) {
						if (node.data.indexOf(checksums[c]) != -1) {
							ChecksumExtension.log("FOUND IT, parent: "+node.parentNode.nodeName);
							node.parentNode.setAttribute("style","background-color:#00a500");
							return true;
						}
					}
				}
				else {
					if (this.findChecksumInDocument(node.childNodes,checksums))
						return true;
				}
			}
		},
		
		findLinkChecksum : function(aTags, fullUrl) {
			for (var x = 0; x < aTags.length;x++) {
				var node = aTags[x];
				var href = node.getAttribute("href");
// ChecksumExtension.log("compare "+fullUrl+" => "+href);
				if (fullUrl.indexOf(href) != -1) {	// TODO endsWith compare
					return node.getAttribute("data-checksum");					
				}
			}
		}
	}
};

window.addEventListener("load", ChecksumExtension.onLoad, false);
window.addEventListener("unload", ChecksumExtension.onUnload, false);

