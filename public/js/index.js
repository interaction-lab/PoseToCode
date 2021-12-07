// Query string params
const urlSearchParams = new URLSearchParams(window.location.search);
const queryStringParams = Object.fromEntries(urlSearchParams.entries());

var idFieldString = "STUID";
var firstActFieldString = "FIRAC";
var thisActivityString = "FREEPLAY";

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
const Logger = new Log(queryStringParams[idFieldString], thisActivityString); //TODO: uncomment this, used to debug rn to avoid errors

window.onbeforeunload = function (evt) {
  if(Logger.uploaded){
    return;
  }

  // Cancel the event (if necessary)
  evt.preventDefault();

  // Google Chrome requires returnValue to be set
  evt.returnValue = "";

  return "";
};

function tellParentToClose() {
  window.opener.closeChildWindow();
}

function uploadAndClose() {
  Logger.upload(null, tellParentToClose);
}

// Add funcitonaility to close early if desired
document.getElementById("finishEarlyButton").onclick = uploadAndClose;

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

const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

var challengeIndex = 0;
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

const POSENAMES = [
  [
    "Raise the Roof",
    "Wave Right Arm",
    "Wave Left Arm",
    "Spin",
  ],
  [
    "Make Small Sphere",
    "Make Medium Sphere",
    "Make Large Sphere",
    "Place Sphere",
  ],
  [
    "Make Small Cake",
    "Make Large Cake",
    "Place Cake",
    "Frost Cake",
  ]
]

// names of the code blocks
const POSES = [
  [
    "raise_the_roof",
    "right_wave",
    "left_wave",
    "spin",
    "RunCode",
    "Reset"
  ],
  [
    "make_small_sphere",
    "make_medium_sphere",
    "make_large_sphere",
    "place",
    "RunCode",
    "Reset"
  ],
  [
    "make_small_layer",
    "make_large_layer",
    "place_layer",
    "frost_layer",
    "RunCode",
    "Reset"
  ]
]

const BLOCKTYPES = {
  CREATESMALLSPHERE: "make_small_sphere",
  CREATEMEDIUMSPHERE: "make_medium_sphere",
  CREATELARGESPHERE: "make_large_sphere",
  PLACESPHERE: "place",
  DANCE: "dance"
}

//TODO: add times for other code blocks
createSphereTiming = 2000;
const BLOCKTIMINGMAP = {
  CREATESMALLSPHERE: createSphereTiming,
  CREATEMEDIUMSPHERE: createSphereTiming,
  CREATELARGESPHERE: createSphereTiming,
  PLACESPHERE: 2000,
  DANCE: 2000
}

// States / Globals
var robotProgressBars = {
  [POSES[challengeIndex][0]]: document.getElementById("LeftLowRightHighBar"),
  [POSES[challengeIndex][1]]: document.getElementById("LeftMedRightMedBar"),
  [POSES[challengeIndex][2]]: document.getElementById("LeftMedRightHighBar"),
  [POSES[challengeIndex][3]]: document.getElementById("LeftHighRightLowBar"),
  [POSES[challengeIndex][4]]: document.getElementById("LeftHighRightMedBar"),
  [POSES[challengeIndex][5]]: document.getElementById("LeftHighRightHighBar")
}

var cummulativePoseScores = {
  [POSES[challengeIndex][0]]: 0,
  [POSES[challengeIndex][1]]: 0,
  [POSES[challengeIndex][2]]: 0,
  [POSES[challengeIndex][3]]: 0,
  [POSES[challengeIndex][4]]: 0,
  [POSES[challengeIndex][5]]: 0
};

var poseMapping = {
  [POSES[challengeIndex][0]]: {
    [ARMS.LEFT]: ARMSTATES.LOW,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  },
  [POSES[challengeIndex][1]]: {
    [ARMS.LEFT]: ARMSTATES.MED,
    [ARMS.RIGHT]: ARMSTATES.MED
  },
  [POSES[challengeIndex][2]]: {
    [ARMS.LEFT]: ARMSTATES.MED,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  },
  [POSES[challengeIndex][3]]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.LOW
  },
  [POSES[challengeIndex][4]]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.MED
  },
  [POSES[challengeIndex][5]]: {
    [ARMS.LEFT]: ARMSTATES.HIGH,
    [ARMS.RIGHT]: ARMSTATES.HIGH
  }
};

var codeIsRunning = false;


lastUpdateDrawTime = curDrawTime = null;
function getDeltaDrawTimeMS() {
  if (lastUpdateDrawTime == null) {
    lastUpdateDrawTime = Date.now();
  }
  curDrawTime = Date.now();
  deltaTime = curDrawTime - lastUpdateDrawTime;
  if (deltaTime > 16) {
    lastUpdateDrawTime = curDrawTime;
    return true;
  }
  return false;
}


// Main
async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  // only draw at 60HZ max
  if (getDeltaDrawTimeMS()) {
    resetCanvas();
    drawPoseSkeleton(results);
  }
  if (!codeIsRunning) {
    if (results != null &&
      results.poseLandmarks != null) {
      updateArmStateWithDetectPose(results);
    }
    curArmStates = armStates; // workaround for async
    var bestPose = updateProgressBars(curArmStates, deltaTime);
    Logger.updateLandmarksAndPoseDetected(Date.now(), results.poseLandmarks, bestPose); //TODO: uncomment when deploying
    if (checkBarFull(bestPose)) {
      resetAllPoseProgress();
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
    //console.log((cummulativePoseScores[pose] / timeToHoldPoseMS));
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
  if (bestPose == POSES[challengeIndex][0]) {
    codeBlock0();
    return true;
  }
  else if (bestPose == POSES[challengeIndex][1]) {
    codeBlock1();
    return true;
  }
  else if (bestPose == POSES[challengeIndex][2]) {
    codeBlock2();
    return true;
  }
  else if (bestPose == POSES[challengeIndex][3]) {
    codeBlock3();
    return true;
  }
  else if (bestPose == POSES[challengeIndex][4]) {
    resetGUI();
    runCode();
    return true;
  }
  else if (bestPose == POSES[challengeIndex][5]) {
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

  //Dance functions
  interpreter.setProperty(
    globalObject,
    "raiseTheRoof",
    interpreter.createNativeFunction(function (text) {
      dance("raise_the_roof");
    })
  );

  interpreter.setProperty(
    globalObject,
    "rightWave",
    interpreter.createNativeFunction(function (text) {
      dance("right_wave");
    })
  );

  interpreter.setProperty(
    globalObject,
    "leftWave",
    interpreter.createNativeFunction(function (text) {
      dance("left_wave");
    })
  );

  interpreter.setProperty(
    globalObject,
    "spin",
    interpreter.createNativeFunction(function (text) {
      dance("spin");
    })
  );

  //Snowman functions
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

  //Cake functions
  interpreter.setProperty(
    globalObject,
    "makeSmallLayer",
    interpreter.createNativeFunction(function (text) {
      makeLayer("small");
    })
  );

  interpreter.setProperty(
    globalObject,
    "makeLargeLayer",
    interpreter.createNativeFunction(function (text) {
      makeLayer("large");
    })
  );

  interpreter.setProperty(
    globalObject,
    "frostLayer",
    interpreter.createNativeFunction(function (text) {
      frostLayer();
    })
  );

  interpreter.setProperty(
    globalObject,
    "placeLayer",
    interpreter.createNativeFunction(function (text) {
      placeLayer();
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
  document.getElementsByClassName("blocklySvg")[0].style.backgroundColor = "white";
  codeIsRunning = false;
}

function stepCode() {
  resetStepUi(true);
  myInterpreter = new Interpreter(latestCode, initApi);
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
  Logger.updateCodeState(Date.now(), allBlocks);
}

function resetPoseNames() {
  console.log(challengeIndex);
  document.getElementById("pose0").innerHTML = POSENAMES[challengeIndex][0];
  document.getElementById("pose1").innerHTML = POSENAMES[challengeIndex][1];
  document.getElementById("pose2").innerHTML = POSENAMES[challengeIndex][2];
  document.getElementById("pose3").innerHTML = POSENAMES[challengeIndex][3];

  cummulativePoseScores = {
    [POSES[challengeIndex][0]]: 0,
    [POSES[challengeIndex][1]]: 0,
    [POSES[challengeIndex][2]]: 0,
    [POSES[challengeIndex][3]]: 0,
    [POSES[challengeIndex][4]]: 0,
    [POSES[challengeIndex][5]]: 0
  };

  poseMapping = {
    [POSES[challengeIndex][0]]: {
      [ARMS.LEFT]: ARMSTATES.LOW,
      [ARMS.RIGHT]: ARMSTATES.HIGH
    },
    [POSES[challengeIndex][1]]: {
      [ARMS.LEFT]: ARMSTATES.MED,
      [ARMS.RIGHT]: ARMSTATES.MED
    },
    [POSES[challengeIndex][2]]: {
      [ARMS.LEFT]: ARMSTATES.MED,
      [ARMS.RIGHT]: ARMSTATES.HIGH
    },
    [POSES[challengeIndex][3]]: {
      [ARMS.LEFT]: ARMSTATES.HIGH,
      [ARMS.RIGHT]: ARMSTATES.LOW
    },
    [POSES[challengeIndex][4]]: {
      [ARMS.LEFT]: ARMSTATES.HIGH,
      [ARMS.RIGHT]: ARMSTATES.MED
    },
    [POSES[challengeIndex][5]]: {
      [ARMS.LEFT]: ARMSTATES.HIGH,
      [ARMS.RIGHT]: ARMSTATES.HIGH
    }
  };

  robotProgressBars = {
    [POSES[challengeIndex][0]]: document.getElementById("LeftLowRightHighBar"),
    [POSES[challengeIndex][1]]: document.getElementById("LeftMedRightMedBar"),
    [POSES[challengeIndex][2]]: document.getElementById("LeftMedRightHighBar"),
    [POSES[challengeIndex][3]]: document.getElementById("LeftHighRightLowBar"),
    [POSES[challengeIndex][4]]: document.getElementById("LeftHighRightMedBar"),
    [POSES[challengeIndex][5]]: document.getElementById("LeftHighRightHighBar")
  }

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
  Logger.updateCodeState(Date.now(), allBlocks);
}

function codeBlock0() {
  console.log(challengeIndex);
  console.log(POSES[challengeIndex][0]);
  addNewBlock(POSES[challengeIndex][0]);
}

function codeBlock1() {
  addNewBlock(POSES[challengeIndex][1]);
}

function codeBlock2() {
  addNewBlock(POSES[challengeIndex][2]);
}

function codeBlock3() {
  addNewBlock(POSES[challengeIndex][3]);
}

function codeBlock4() {
  addNewBlock(POSES[challengeIndex][4]);
}