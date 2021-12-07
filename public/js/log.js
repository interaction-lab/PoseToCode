class Log {
	constructor(STUID_in, ACT_in) {
		this.db = firebase.firestore();
		this.count = 0;
		this.STUID = STUID_in;
		this.ACT = ACT_in;
		this.filename = this.STUID + "_" + Date.now() + "_" + this.ACT + ".json";
		this.jsonObject = {};
		this.uploading = false;
		this.uploaded = false;
		this.landMarkMapTimings = new Set();
	}

	addMapAtTime(time, newMap) {
		if (!(time in this.jsonObject)) {
			this.jsonObject[time] = newMap;
		}
		else {
			this.jsonObject[time] = new Map([this.jsonObject[time], newMap]);
		}
	}

	updateLandmarksAndPoseDetected(time, landmarks, poseDetected) {
		if (this.uploading || this.uploaded) {
			return;
		}
		const landmarksMap = { ...landmarks };
		const flattenedData = new Map();
		for (var key in landmarksMap) {
			const coordinates = landmarks[key];
			for (var cKey in coordinates) {
				flattenedData.set(cKey + key, coordinates[cKey]);
			}
		}
		flattenedData.set('poseDetected', poseDetected);
		if (!this.landMarkMapTimings.has(time)) {
			this.addMapAtTime(time, flattenedData);
			this.landMarkMapTimings.add(time); // do not want duplicates as it inflates file
		}
	}

	updateCodeState(time, codeState) {
		var blocknames = [];
		for (var i = 0; i < codeState.length; ++i) {
			blocknames.push(codeState[i].type);
		}
		this.addMapAtTime(time, new Map([["codestate", blocknames]]));
	}


	upload(urlRedirect, funcCallback) {
		if (this.uploading || this.uploaded) {
			return; // double calls for some reason
		}
		this.uploading = true;
		//this.jsonObject = {"t" : 0}; // TODO: uncomment when running study, limits uploads
		var jsonString = JSON.stringify(this.jsonObject);
		// create a Blob from the JSON-string
		var blob = new Blob([jsonString], { type: "application/json" })

		var storageRef = firebase.storage().ref();
		var jsonFolder = storageRef.child("json_test");
		var jsonFileRef = jsonFolder.child(this.filename);

		//upload file
		var upload = jsonFileRef.put(blob);

		//update progress bar
		upload.on(
			"state_changed",
			function progress(snapshot) {
				var percentage =
					(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				console.log(percentage);

			},
			function error() {
				alert("error uploading file");
				this.uploaded = true;
			},

			function complete() {
				console.log("complete");
				this.uploaded = true;
				if (urlRedirect) {
					window.location.href = urlRedirect;
				}
				else {
					funcCallback();
				}
			}
		);
	}
}