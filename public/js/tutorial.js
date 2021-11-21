const toolbox = document.getElementById("toolbox");
var time = 0;
const options = {
  toolbox: toolbox,
  collapse: true,
  comments: false,
  disable: true,
  maxBlocks: Infinity,
  trashcan: true,
  horizontalLayout: false,
  toolboxPosition: "start",
  css: true,
  media: "https://blockly-demo.appspot.com/static/media/",
  rtl: false,
  scrollbars: true,
  sounds: true,
  oneBasedIndex: true,
  zoom: {
    controls: true,
    wheel: true,
    startScale: 2,
    maxScale: 3,
    minScale: 0.3,
    scaleSpeed: 1.2,
    pinch: true
  }
};

/* Instantiate log */
// const Logger = new Log(); TODO: uncomment this, used to debug rn to avoid errors

/* Inject your Blockly workspace */
const blocklyDiv = document.getElementById("blocklyDiv");
const workspace = Blockly.inject(blocklyDiv, options);
const workspaceBlocks = document.getElementById("workspaceBlocks");
Blockly.Xml.domToWorkspace(workspaceBlocks, workspace);

click = new Audio("sounds/click.wav");
calculate = new Audio("sounds/calculate.wav");
loading = new Audio("sounds/loading.mp3");
/* variables to hold current parent block and child block */
let parentBlock = null;
let childBlock = null;
/* keep track of all blocks for resetting */
const allBlocks = [];

let sphereSizeFlag = false;
let sleepFlag = false;

const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

var completedChallenge1 = false;
var challenge1Alert = false;
var completedChallenge2 = false;
var challenge2Alert = false;
var completedChallenge3 = false;

function startTutorial() {
  alert("Challenge 1: Make the Robot Dance!");
}

// Helpers
function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

lastUpdateTime = curTime = null;
function getDeltaTimeMS() {
  if (lastUpdateTime == null) {
    lastUpdateTime = Date.now();
  }
  curTime = Date.now();
  deltaTime = curTime - lastUpdateTime;
  lastUpdateTime = curTime;
  return deltaTime;
}

// Variables to Tweak
timeToHoldPoseMS = 2000;

// Constants
const ARMS = {
  LEFT: "Left",
  RIGHT: "Right",
}
const ARMSTATES = {
  NONE: "None",
  LOW: "Low",
  MED: "Medium",
  HIGH: "High"
}

const POSES = {
  MAKESPHERESMALL: "MakeSphereSmall",
  MAKESPHEREMEDIUM: "MakeSphereMedium",
  MAKESPHERELARGE: "MakeSphereLarge",
  PLACESPHERE: "PlaceSphere",
  DANCE: "Dance",
  RUNCODE: "RunCode",
  NONE: "none"
}

const BLOCKTYPES = {
  CREATESMALLSPHERE: "make_small_sphere",
  CREATEMEDIUMSPHERE: "make_medium_sphere",
  CREATELARGESPHERE: "make_large_sphere",
  PLACESPHERE: "place",
  DANCE: "dance"
}

createSphereTiming = 2000;
const BLOCKTIMINGMAP = {
  CREATESMALLSPHERE: createSphereTiming,
  CREATEMEDIUMSPHERE: createSphereTiming,
  CREATELARGESPHERE: createSphereTiming,
  PLACESPHERE: 2000,
  DANCE: 2000
}

// States / Globals
progressBars = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: document.getElementById("leftArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("leftArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("leftArmHighBar")
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: document.getElementById("rightArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("rightArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("rightArmHighBar")
  }
}

robotProgressBars = {
  [POSES.MAKESPHERESMALL]: document.getElementById("makeSphereSmallBar"),
  [POSES.MAKESPHEREMEDIUM]: document.getElementById("makeSphereMediumBar"),
  [POSES.MAKESPHERELARGE]: document.getElementById("makeSphereLargeBar"),
  [POSES.PLACESPHERE]: document.getElementById("placeSphereBar"),
  [POSES.DANCE]: document.getElementById("danceBar"),
  [POSES.RUNCODE]: document.getElementById("runCodeBar")
}

cummulativePoseScores = {
  [POSES.MAKESPHERESMALL]: 0,
  [POSES.MAKESPHEREMEDIUM]: 0,
  [POSES.MAKESPHERELARGE]: 0,
  [POSES.PLACESPHERE]: 0,
  [POSES.DANCE]: 0,
  [POSES.RUNCODE]: 0,
  [POSES.NONE]: 0
};

const poseMapping = {
  [POSES.MAKESPHERESMALL]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.LOW
  },
  [POSES.MAKESPHEREMEDIUM]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.MED
  },
  [POSES.MAKESPHERELARGE]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  },
  [POSES.PLACESPHERE]: {
    [ARMS.LEFT]: ARMSTATES.LOW,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  },
  [POSES.DANCE]: {
    [ARMS.LEFT]: ARMSTATES.MED,
    [ARMS.RIGHT]: ARMSTATES.MED
  },
  [POSES.RUNCODE]: {
    [ARMS.LEFT]: ARMSTATES.MED,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  },
  [POSES.NONE]: {
    [ARMS.LEFT]: ARMSTATES.LOW,
    [ARMS.RIGHT]: ARMSTATES.LOW
  }
};

var codeIsRunning = false;

// Main
async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  resetCanvas();
  drawPoseSkeleton(results);
  if (!codeIsRunning) {
    if (results != null &&
      results.poseLandmarks != null) {
      updateArmStateWithDetectPose(results);
    }
    else { // reset if out of frame long enough
      armStates = {
        [ARMS.LEFT]: ARMSTATES.NONE,
        [ARMS.RIGHT]: ARMSTATES.NONE
      };
    }
    curArmStates = armStates; // workaround for async
    var bestPose = updateProgressBars(curArmStates, deltaTime);
    if (checkBarFull(bestPose)) {
      // Logger.update(Date.now(), results.poseLandmarks, 1); TODO: uncomment when deploying
      resetAllPoseProgress();
    } else {
      // Logger.update(Date.now(), results.poseLandmarks, 0); TODO: uncomment when deployign
    }
  }
}

// Update Functions
function updateCumulativePoseStates(bestArmScores, deltaTime) {
  const scaleFactor = 1.2;
  const scaledTimeToHoldPose = timeToHoldPoseMS * scaleFactor;
  var decayFactor = 0.8 * deltaTime;
  var bestPose;
  for (let pose in poseMapping) {
    if (cArm(bestArmScores, poseMapping[pose])) {
      addToPoseState(pose, deltaTime, scaledTimeToHoldPose);
      bestPose = pose;
    }
    else {
      decayPoseProgress(pose, decayFactor);
    }
  }
  return bestPose;
}

function addToPoseState(pose, deltaTime, scaledTimeToHoldPose) {
  cummulativePoseScores[pose] += deltaTime;
  if (cummulativePoseScores[pose] > scaledTimeToHoldPose) {
    cummulativePoseScores[pose] = scaledTimeToHoldPose;
  }
}

function decayPoseProgress(pose, decayFactor) {
  cummulativePoseScores[pose] -= decayFactor;
  if (cummulativePoseScores[pose] < 0) {
    cummulativePoseScores[pose] = 0;
  }
}

function cArm(armState, compareTo) {
  return armState[ARMS.LEFT] == compareTo[ARMS.LEFT] && armState[ARMS.RIGHT] == compareTo[ARMS.RIGHT];
}

function updateProgressBars(bestArmScores, deltaTime) {
  var curPoseDetected = updateCumulativePoseStates(bestArmScores, deltaTime);
  for (let pose in robotProgressBars) {
    console.log((cummulativePoseScores[pose] / timeToHoldPoseMS));
    robotProgressBars[pose].style.height = (cummulativePoseScores[pose] / timeToHoldPoseMS) * 100 + "%";
  }
  return curPoseDetected;
}

function poseScoresOverThreshHold(bestPose) {
  return cummulativePoseScores[bestPose] >= timeToHoldPoseMS;
}

function checkBarFull(bestPose) {
  if (!poseScoresOverThreshHold(bestPose)) {
    return false;
  }
  if (bestPose == POSES.DANCE) {
    addDanceBlock();
    return true;
  }
  else if (bestPose == POSES.RUNCODE) {
    resetGUI();
    runCode();
    return true;
  }
  else if (bestPose == POSES.PLACESPHERE) {
    placeSphere();
    return true;
  }
  else if (bestPose == POSES.MAKESPHERESMALL) {
    makeSmallSphereBlock();
    return true;
  }
  else if (bestPose == POSES.MAKESPHEREMEDIUM) {
    makeMediumSphereBlock();
    return true;
  }
  else if (bestPose == POSES.MAKESPHERELARGE) {
    makeLargeSphereBlock();
    return true;
  }
  else if (bestPose == POSES.NONE) {
    console.log("reset");
    resetAllBlocks();
    return true;
  }
  return false;
}


function resetAllPoseProgress() {
  for (let pose in robotProgressBars) {
    cummulativePoseScores[pose] = 0;
  }
}


armInputsR = [
  0, 9, 11, 12, 13, 15, 17, 19, 21, 23
];
armInputsL = [
  0, 10, 11, 12, 14, 16, 18, 20, 22, 24
];
numInputs = 4 * armInputsL.length;

let optionsNN = {
  inputs: numInputs,
  outputs: 3, // LOW, MED, HIGH
  task: 'classification',
  debug: false
}
leftBrain = ml5.neuralNetwork(optionsNN);
rightBrain = ml5.neuralNetwork(optionsNN);

pretrainedFolder = "js/models/leftArm/"
const leftModelInfo = {
  model: pretrainedFolder + 'model.json',
  metadata: pretrainedFolder + 'model_meta.json',
  weights: pretrainedFolder + 'model.weights.bin',
};
leftBrain.load(leftModelInfo, leftBrainLoaded);

pretrainedFolder = "js/models/rightArm/"
const rightModelInfo = {
  model: pretrainedFolder + 'model.json',
  metadata: pretrainedFolder + 'model_meta.json',
  weights: pretrainedFolder + 'model.weights.bin',
};
rightBrain.load(rightModelInfo, rightBrainLoaded);


rBrainLoaded = false;
function rightBrainLoaded() {
  rBrainLoaded = true;
}
lBrainLoaded = false;
function leftBrainLoaded() {
  lBrainLoaded = true;
}


// Assumes results.poseLandmarks != null
armStates = {
  [ARMS.LEFT]: ARMSTATES.NONE,
  [ARMS.RIGHT]: ARMSTATES.NONE
}
function updateArmStateWithDetectPose(results) {
  if (!lBrainLoaded || !rBrainLoaded) {
    console.log(lBrainLoaded);
    return armStates;
  }
  classifyPose(results.poseLandmarks, armInputsL, leftBrain, ARMS.LEFT);
  classifyPose(results.poseLandmarks, armInputsR, rightBrain, ARMS.RIGHT);
  return armStates;
}

function classifyPose(pose, armInputs, brain, armIndex) {
  if (pose) {
    let inputs = [];
    for (let j = 0; j < armInputsL.length; j++) {
      let i = armInputs[j];
      inputs.push(pose[i].x, pose[i].y, pose[i].z, pose[i].visibility);
    }
    if (armIndex == ARMS.LEFT) {
      brain.classify(inputs, gotResultL);
    }
    else {
      brain.classify(inputs, gotResultR);
    }
  }
}

poseLabelMap = {
  "HIGH_R": ARMSTATES.HIGH,
  "HIGH_L": ARMSTATES.HIGH,
  "MED_R": ARMSTATES.MED,
  "MED_L": ARMSTATES.MED,
  "LOW_R": ARMSTATES.LOW,
  "LOW_L": ARMSTATES.LOW
}

function gotResultL(error, results) {
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
    armStates[ARMS.LEFT] = poseLabelMap[poseLabel];
  }
  else {
    armStates[ARMS.LEFT] = ARMSTATES.NONE;
  }
}

function gotResultR(error, results) {
  if (results[0].confidence > 0.75) {
    poseLabel = results[0].label.toUpperCase();
    armStates[ARMS.RIGHT] = poseLabelMap[poseLabel];
  }
  else {
    armStates[ARMS.RIGHT] = ARMSTATES.NONE;
  }
}

// MediaPipe and DOM events
const userPose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  },
});

userPose.setOptions({
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
userPose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await userPose.send({ image: videoElement });
  },
  width: 1280,
  height: 720,
});
camera.start();

function resetCanvas() {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
}

function drawPoseSkeleton(results) {
  canvasCtx.drawImage(
    results.image,
    0,
    0,
    canvasElement.width,
    canvasElement.height
  );
  drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
    color: "#00FF00",
    lineWidth: 4,
  });
  drawLandmarks(canvasCtx, results.poseLandmarks, {
    color: "#FF0000",
    lineWidth: 2,
  });
}

var myInterpreter = null;

function runCode() {
  stepCode();
}

function initApi(interpreter, globalObject) {
  interpreter.setProperty(
    globalObject,
    "alert",
    interpreter.createNativeFunction(function (text) {
      text = arguments.length ? text : "";
      alert(text);
    })
  );
  interpreter.setProperty(
    globalObject,
    "dance",
    interpreter.createNativeFunction(function (text) {
      dance();
    })
  );
  interpreter.setProperty(
    globalObject,
    "placeSphereCode",
    interpreter.createNativeFunction(function (text) {
      placeSphereCode();
    })
  );
  interpreter.setProperty(
    globalObject,
    "makeSmallSphere",
    interpreter.createNativeFunction(function (text) {
      makeSphere("small");
    })
  );
  interpreter.setProperty(
    globalObject,
    "makeMediumSphere",
    interpreter.createNativeFunction(function (text) {
      makeSphere("medium");
    })
  );
  interpreter.setProperty(
    globalObject,
    "makeLargeSphere",
    interpreter.createNativeFunction(function (text) {
      makeSphere("large");
    })
  );
  var wrapper = function (id) {
    id = String(id || "");
    return interpreter.createPrimitive(highlightBlock(id));
  };
  interpreter.setProperty(
    globalObject,
    "highlightBlock",
    interpreter.createNativeFunction(wrapper)
  );
}

var highlightPause = false;
var latestCode = "";

function highlightBlock(id) {
  workspace.highlightBlock(id);
  highlightPause = true;
}

function resetStepUi(clearOutput) {
  workspace.highlightBlock(null);
  highlightPause = false;
}

function generateCodeAndLoadIntoInterpreter() {
  // Generate JavaScript code and parse it.
  Blockly.JavaScript.STATEMENT_PREFIX = "highlightBlock(%1);\n";
  Blockly.JavaScript.addReservedWords("highlightBlock");
  latestCode = Blockly.JavaScript.workspaceToCode(workspace);
  resetStepUi(true);
}

function stepThroughAllCode() {
  codeIsRunning = true;
  document.getElementsByClassName("blocklySvg")[0].style.backgroundColor = "#228B22";
  if (myInterpreter.step()) {
    myInterpreter.step();
    myInterpreter.step(); // not sure why but this is needed to run 3 times?
    setTimeout(stepThroughAllCode, 500); // need the correct timing
  }
  else {
    if(!challenge1Alert && completedChallenge1) {
      alert("Congratulations! You completed Challenge 1: Dance Routine!");
      alert("Challenge 2: Build a Snowman. Construct a snowman by creating and placing differently sized spheres.");
      challenge1Alert = true;
      resetAllBlocks();
      document.getElementById("snowmanImage").style.display = "block";
    }
    else if (!challenge2Alert && completedChallenge2) {
      alert("Congratulations! You completed Challenge 2: Build a Snowman!");
      alert("Challenge 3: Make a Cake. Construct a frosted cake with two layers!");
      challenge2Alert = true;
      resetAllBlocks();
    }
    else if (completedChallenge3) {
      alert("Congratulations! You completed the tutorial!");
    }
    document.getElementsByClassName("blocklySvg")[0].style.backgroundColor = "white";
  }
}

function stepCode() {
  resetStepUi(true);
  myInterpreter = new Interpreter(latestCode, initApi);
  var regex_challenge1 = /highlightBlock\(.*\);[\r\n]dance\(\);/ //TODO: replace with regex for multiple dance move blocks
  var regex_challenge2 = /highlightBlock\(.*\);[\r\n]makeLargeSphere\(\);[\r\n]highlightBlock\(.*\);[\r\n]placeSphereCode\(\);[\r\n]highlightBlock\(.*\);[\r\n]makeMediumSphere\(\);[\r\n]highlightBlock\(.*\);[\r\n]placeSphereCode\(\);[\r\n]highlightBlock\(.*\);[\r\n]makeSmallSphere\(\);[\r\n]highlightBlock\(.*\);[\r\n]placeSphereCode\(\);/
  var regex_challenge3 = /highlightBlock\(.*\);[\r\n]dance\(\);/ //TODO: replace with regex for multiple cake building blocks
  if (latestCode.match(regex_challenge1)) {
    completedChallenge1 = true;
  }
  if (completedChallenge1 && latestCode.match(regex_challenge2)) {
    completedChallenge2 =  true;
  }
  if (completedChallenge2 && latestCode.match(regex_challenge3)) {
    completedChallenge3 =  true;
  }
  myInterpreter.step(); // dummy first step
  stepThroughAllCode();
}

// Load the interpreter now, and upon future changes.
generateCodeAndLoadIntoInterpreter();
workspace.addChangeListener(function (event) {
  if (!(event instanceof Blockly.Events.Ui)) {
    // Something changed. Parser needs to be reloaded.
    generateCodeAndLoadIntoInterpreter();
  }
});

function resetAllBlocks() {
  for (i = 0; i < allBlocks.length; i++) {
    allBlocks[i].dispose(true);
  }
  parentBlock = null;
  resetGUI();
  time = 0;

}

function addNewBlock(blockName, fields = []) {
  block = workspace.newBlock(blockName);
  click.play();
  for (var i = fields.length - 1; i >= 0; --i) {
    block.setFieldValue(fields[i]['value'], fields[i]['name'])
  }
  block.initSvg();
  block.render();
  if (parentBlock != null) {
    parentBlock.nextConnection.connect(block.previousConnection);
  }
  parentBlock = block;
  allBlocks.push(parentBlock);
}

function placeSphere() {
  addNewBlock(BLOCKTYPES.PLACESPHERE);
  console.log("place sphere block added");
}

function addDanceBlock() {
  addNewBlock(BLOCKTYPES.DANCE);
  console.log("dance block added");
}

function makeSmallSphereBlock() {
  addNewBlock(BLOCKTYPES.CREATESMALLSPHERE);
  console.log("create small sphere block");
}

function makeMediumSphereBlock() {
  addNewBlock(BLOCKTYPES.CREATEMEDIUMSPHERE);
  console.log("create medium sphere block");
}

function makeLargeSphereBlock() {
  addNewBlock(BLOCKTYPES.CREATELARGESPHERE);
  console.log("create large sphere block");
}
