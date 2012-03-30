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
			ChecksumExtension.log("observe: " + topic);
			if (topic == "dl-done") {
				var dl = aSubject.QueryInterface(Components.interfaces.nsIDownload);				

				var checksumMd5 = this.createChecksum(dl.targetFile,"MD5");
				ChecksumExtension.log("MD5 for "+dl.displayName+" => " + checksumMd5);

// var checksumSha1 = this.createChecksum(dl.targetFile,"SHA1");
// var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
// .getService(Components.interfaces.nsIPromptService);
// prompts.alert(window, "Checksums", "MD5: "+checksumMd5+"\nSHA1:
// "+checksumSha1);
				
				var document = ChecksumExtension.downloads[dl.targetFile.path];
				this.findChecksumInDocument(document.getElementsByTagName("body"), checksumMd5);
				delete ChecksumExtension.downloads[dl.targetFile.path];
			}
			else if (topic == "dl-start") {
				var dl = aSubject.QueryInterface(Components.interfaces.nsIDownload);				
				ChecksumExtension.downloads[dl.targetFile.path] = content.document;
			}
		},
		
		createChecksum : function(fileToCheck, hashType) {
			// open input stream
			var istream = Components.classes["@mozilla.org/network/file-input-stream;1"]
			.createInstance(Components.interfaces.nsIFileInputStream);
			istream.init(fileToCheck, -1, 0, 0);

			// hash check
			var ch = Components.classes["@mozilla.org/security/hash;1"]
			.createInstance(Components.interfaces.nsICryptoHash);
			ch.init(ch[hashType]);
			const PR_UINT32_MAX = 0xffffffff;
			ch.updateFromStream(istream, PR_UINT32_MAX);
			var hash = ch.finish(false);
			var toHexString = function (charCode){ return ("0" + charCode.toString(16)).slice(-2); }
			var filechecksum = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("");
			filechecksum = filechecksum.replace(/[^0-9a-f]/ig, '').toLowerCase();
			return filechecksum;
			
		},
		
		findChecksumInDocument : function(elements, checksum) {
			for (var x = 0; x < elements.length;x++) {
				var node = elements[x];
				if (node.nodeType == 3) {
					if (node.data.indexOf(checksum) != -1) {
						ChecksumExtension.log("FOUND IT, parent: "+node.parentNode.nodeName);
						node.parentNode.setAttribute("style","background-color:#00a500");
						return true;
					}
				}
				else {
					if (this.findChecksumInDocument(node.childNodes,checksum))
						return true;
				}
			}
		}
	}
};

window.addEventListener("load", ChecksumExtension.onLoad, false);
window.addEventListener("unload", ChecksumExtension.onUnload, false);

