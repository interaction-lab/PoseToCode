var sphereSizeFlag = false;
var startMotion = 0;
var standingDistLeft = 0;
var standingDistRight = 0;
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
                    {color: '#00FF00', lineWidth: 4});
    drawLandmarks(canvasCtx, results.poseLandmarks,
                    {color: '#FF0000', lineWidth: 2});

    if(startMotion <= 100){
        standingDistLeft = results.poseLandmarks[28].y - results.poseLandmarks[24].y;
        standingDistRight = results.poseLandmarks[27].y - results.poseLandmarks[23].y;
        startMotion += 1;
    }
    //dance (both arms out to the side)
    var leftDist = Math.abs(results.poseLandmarks[14].y - results.poseLandmarks[12].y)
    var rightDist = Math.abs(results.poseLandmarks[11].y - results.poseLandmarks[13].y)
    if(rightDist < 0.01 && leftDist < 0.01) {
        setTimeout(() => {    
        console.log("dance")
        }, 600);
        canvasCtx.restore();
    }
    //run (paused running motion --> left hand up + right hand down)
    else if(results.poseLandmarks[20].y < results.poseLandmarks[5].y && !(results.poseLandmarks[19].y < results.poseLandmarks[2].y)) {
        setTimeout(() => {     
        console.log("run")
        }, 600);
        canvasCtx.restore();
    }
    //reset (both hands above head)
    else if(results.poseLandmarks[21].y < results.poseLandmarks[2].y && results.poseLandmarks[22].y < results.poseLandmarks[2].y) {
        setTimeout(() => {     
        console.log("reset")
        }, 600);
        canvasCtx.restore();
    }
    //make sphere (hands in front of chest)
    else if((results.poseLandmarks[20].x > results.poseLandmarks[12].x) && (results.poseLandmarks[19].x < results.poseLandmarks[11].x) && (results.poseLandmarks[20].y < results.poseLandmarks[14].y && results.poseLandmarks[20].y > results.poseLandmarks[12].y) && (results.poseLandmarks[19].y < results.poseLandmarks[13].y && results.poseLandmarks[19].y > results.poseLandmarks[11].y)) {
        setTimeout(() => {     
        console.log("make sphere")
        }, 600);
        sphereSizeFlag = true;
        canvasCtx.restore();
    }
    //size of sphere (right arm: low)
    else if(results.poseLandmarks[19].y > results.poseLandmarks[23].y && sphereSizeFlag) {
        setTimeout(() => {     
        console.log("small sphere")
        }, 600);
        sphereSizeFlag = false;
        canvasCtx.restore();
    }
    //size of sphere (right arm: med)
    else if(results.poseLandmarks[19].y < results.poseLandmarks[23].y && results.poseLandmarks[19].y > results.poseLandmarks[11].y && sphereSizeFlag) {
        setTimeout(() => {     
        console.log("med sphere")
        }, 600);
        sphereSizeFlag = false;
        canvasCtx.restore();
    }
    //size of sphere (right arm: high)
    else if(results.poseLandmarks[19].y < results.poseLandmarks[11].y && sphereSizeFlag) {
        setTimeout(() => {     
        console.log("high sphere")
        }, 600);
        sphereSizeFlag = false;
        canvasCtx.restore();
    }
    //place sphere (squat)
    //else if(results.poseLandmarks[28].y - results.poseLandmarks[24].y < standingDistLeft && results.poseLandmarks[27].y - results.poseLandmarks[23].y < standingDistRight) {
        //setTimeout(() => {     
        //console.log("place sphere")
        //}, 600);
        //sphereSizeFlag = false;
        //canvasCtx.restore();
    //}
}
const pose = new Pose({locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
}});
pose.setOptions({
    selfieMode: true,
    upperBodyOnly: false,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
    onFrame: async () => {
    await pose.send({image: videoElement});
},
    width: 1280,
    height: 720
});
camera.start();