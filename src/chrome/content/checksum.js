var ChecksumExtension = {

	log : function(str) {
		Components.classes['@mozilla.org/consoleservice;1'].getService(
				Components.interfaces.nsIConsoleService).logStringMessage(str);
	},

	onLoad : function() {
		Components.classes["@mozilla.org/observer-service;1"].getService(
				Components.interfaces.nsIObserverService).addObserver(
				ChecksumExtension.downloadObserver, "dl-done", false);
	},

	onUnload : function() {
		window.removeEventListener("load", ChecksumExtension.onLoad, false);
		Components.classes["@mozilla.org/observer-service;1"].getService(
				Components.interfaces.nsIObserverService).removeObserver(
				ChecksumExtension.downloadObserver, "dl-done", false);
	},

	downloadObserver : {
		observe : function(aSubject, topic, aData) {
			ChecksumExtension.log("observe: " + topic);
			if (topic == "dl-done") {
				var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
						.getService(Components.interfaces.nsIPromptService);
				var jsonSubject = window.JSON.stringify(aSubject);
				var dl = aSubject.nsIDownload;

				var checksumMd5 = this.createChecksum(dl.targetFile,"MD5");
				var checksumSha1 = this.createChecksum(dl.targetFile,"SHA1");
//				prompts.alert(window, "Checksums", "MD5: "+checksumMd5+"\nSHA1: "+checksumSha1);
				
				
				this.findChecksumInDocument(content.document.getElementsByTagName("body"), checksumMd5);


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

