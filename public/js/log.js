class Log {
	constructor(STUID_in) {
		this.db = firebase.firestore();
		this.count = 0;
		this.STUID = STUID_in
		this.filename = this.STUID + Date.now() + ".json";
		this.jsonObject = {};
		this.uploaded = false;
	}


	update(time, landmarks, poseDetected) {
		if (this.uploaded) {
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
		this.jsonObject[time] = flattenedData;
	}

	upload() {
		this.uploaded = true;
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
			},

			function complete() {
				console.log("complete");
				window.location.href = "http://www.w3schools.com";
			}
		);
	}
}