class Log {
	constructor() {
		this.timestampToDocumentData = new Map();
	}

	update(time, landmarks, poseDetected) {
		const landmarksMap = { ...landmarks };
		const flattenedData = new Map();
		for (var key in landmarksMap) {
			const coordinates = landmarks[key];
		    for (var cKey in coordinates) {
		    	flattenedData.set(cKey+key, coordinates[cKey]);
		    }
		}
		flattenedData.set('poseDetected', poseDetected);
		this.timestampToDocumentData.set(time, flattenedData);
	}
}