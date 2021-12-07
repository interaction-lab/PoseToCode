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
		this.loadingbar = document.getElementById("loading");
		this.hideLoading();
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
			if(coordinates['visibility'] < 0.5){ // ignore invisible points, cuts down on log size
				continue;
			}
			for (var cKey in coordinates) {
				var skey = cKey;
				if(skey == "visibility"){
					skey = "v"; // smaller
				}
				flattenedData.set(skey + key, coordinates[cKey].toFixed(6)); // fixed size for smaller files
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

	updateRunCode(time){
		this.addMapAtTime(time, new Map([["runCode", 1]]));
	}

	updateButtonPress(time, buttonPressed) {
		this.addMapAtTime(time, new Map([["buttonPressed", buttonPressed]]));
	}

	updateCompletedExercise(time, exercise) {
		this.addMapAtTime(time, new Map([["completedExercise", exercise]]));
	}

	showLoading() {
		this.loadingbar.style.display = "block";
	}
	hideLoading() {
		this.loadingbar.style.display = "none";
	}

	updateLoadingPerc(percentage) {
		console.log(percentage);
		this.loadingbar.style.width = percentage + "%";
		this.loadingbar.innerHTML = "Uploading, please wait:" + percentage + "%";
	}

	fakeUpload(urlRedirect, funcCallback) {
		this.width = 0;
		this.frame(urlRedirect, funcCallback);
	}

	frame(urlRedirect, funcCallback) {
		if (this.width >= 100) {
			clearInterval(this.id);
			console.log("dk");
			this.uploaded = true;
			this.hideLoading();
			if (urlRedirect) {
				window.location.href = urlRedirect;
			}
			else {
				funcCallback();
			}
		} else {
			this.width++;
			this.updateLoadingPerc(this.width);
			setTimeout(() => { this.frame(urlRedirect, funcCallback); }, 10);
		}
	}

	realUpload(blob, urlRedirect, funcCallback, jsonFileRef) {
		var upload = jsonFileRef.put(blob);
		upload.logOBJ = this; // hacky workaround to `this`
		upload.on(
			"state_changed",
			function progress(snapshot) {
				var percentage =
					(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
				upload.logOBJ.updateLoadingPerc(percentage);
			},
			function error() {
				alert("error uploading file");
				upload.logOBJ.uploaded = true;
			},

			function complete() {
				console.log("complete");
				upload.logOBJ.uploaded = true;
				upload.logOBJ.hideLoading();
				if (urlRedirect) {
					window.location.href = urlRedirect;
				}
				else {
					funcCallback();
				}
			}
		);
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
		this.showLoading();
		this.realUpload(blob, urlRedirect, funcCallback, jsonFileRef);
		//this.fakeUpload(urlRedirect, funcCallback);
	}
}