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

const BLOCKTYPES = {
  CREATESMALLSPHERE: "make_small_sphere",
  CREATEMEDIUMSPHERE: "make_medium_sphere",
  CREATELARGESPHERE: "make_large_sphere",
  PLACESPHERE: "place",
  DANCE: "dance"
}

createSphereTiming = 2000;
const BLOCKTIMINGMAP = {
  CREATESMALLSPHERE : createSphereTiming,
  CREATEMEDIUMSPHERE : createSphereTiming,
  CREATELARGESPHERE : createSphereTiming,
  PLACESPHERE : 2000,
  DANCE : 2000
}

// States / Globals
cumulativeArmStates = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0
  }
}
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
leftProgressheader = document.getElementById("leftProgressHeader");
rightProgressheader = document.getElementById("rightProgressHeader");
var codeIsRunning = false;

// Main
async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  resetCanvas();
  drawPoseSkeleton(results);
  if (!codeIsRunning &&
    results != null &&
    results.poseLandmarks != null) {
    curArmStates = getStateOfArms(results);
    updateCumulativeArmStates(curArmStates, deltaTime);
    updateProgressBars();
    var bestArmScores = getBestArmScores();
    updateBestArmText(bestArmScores);
    if (attemptPoseDetection(bestArmScores)) {
     // Logger.update(Date.now(), results.poseLandmarks, 1); TODO: uncomment when deploying
      resetAllArmScores();
    } else {
     // Logger.update(Date.now(), results.poseLandmarks, 0); TODO: uncomment when deployign
    }
  }
}

// Update Functions
function decayAllOtherStates(curArmStates, deltaTime) {
  var decayFactor = 0.8 * deltaTime;
  for (let arm in cumulativeArmStates) {
    for (let state in cumulativeArmStates[arm]) {
      if (curArmStates[arm] == state) {
        continue;
      }
      cumulativeArmStates[arm][state] -= decayFactor;
      if (cumulativeArmStates[arm][state] < 0) {
        cumulativeArmStates[arm][state] = 0;
      }
    }
  }
}

function updateCumulativeArmStates(curArmStates, deltaTime) {
  const scaleFactor = 1.2;
  const scaledTimeToHoldPose = timeToHoldPoseMS * scaleFactor;
  cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] += deltaTime;
  cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] += deltaTime;

  if (cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] > scaledTimeToHoldPose) {
    cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] = scaledTimeToHoldPose;
  }
  if (cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] > scaledTimeToHoldPose) {
    cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] = scaledTimeToHoldPose;
  }
  decayAllOtherStates(curArmStates, deltaTime);
}

function getBestArmScores() {
  var bestArmScores = {
    [ARMS.LEFT]: ARMSTATES.NONE,
    [ARMS.RIGHT]: ARMSTATES.NONE
  };
  for (let arm in cumulativeArmStates) {
    var bestArmScore = -1;
    for (let state in cumulativeArmStates[arm]) {
      if (bestArmScore < cumulativeArmStates[arm][state]) {
        bestArmScores[arm] = state;
        bestArmScore = cumulativeArmStates[arm][state];
      }
    }
  }
  return bestArmScores;
}

function updateProgressBars() {
  for (let arm in progressBars) {
    for (let state in progressBars[arm]) {
      percent = cumulativeArmStates[arm][state] / timeToHoldPoseMS * 100;
      if (percent > 100) {
        percent = 100;
      }
      progressBars[arm][state].style.width = percent + "%";
      progressBars[arm][state].innerHTML = state;
    }
  }
}

function updateBestArmText(bestArmScores) {
  leftProgressheader.innerHTML = "Best " + ARMS.LEFT + ": " + bestArmScores[ARMS.LEFT];
  rightProgressheader.innerHTML = "Best " + ARMS.RIGHT + ": " + bestArmScores[ARMS.RIGHT];
}

function armScoresOverThreshHold(bestArmScores) {
  return cumulativeArmStates[ARMS.LEFT][bestArmScores[ARMS.LEFT]] >= timeToHoldPoseMS &&
    cumulativeArmStates[ARMS.RIGHT][bestArmScores[ARMS.RIGHT]] >= timeToHoldPoseMS;
}

function attemptPoseDetection(bestArmScores) {
  if (!armScoresOverThreshHold(bestArmScores)) {
    return false;
  }
  if (bestArmScores[ARMS.LEFT] == ARMSTATES.MED &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.MED) {
    addDanceBlock();
    return true;
  }
  // run pose
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.MED &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    resetGUI();
    runCode();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.LOW &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    placeSphere();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.LOW) {
    makeSmallSphereBlock();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.MED) {
    makeMediumSphereBlock();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    makeLargeSphereBlock();
    return true;
  }
  return false;
}

function resetAllArmScores() {
  for (let arm in progressBars) {
    for (let state in progressBars[arm]) {
      cumulativeArmStates[arm][state] = 0;
    }
  }
}

function getMidSection(results) {
  return (results.poseLandmarks[11].y + results.poseLandmarks[23].y) / 2;
}

// Assumes results.poseLandmarks != null
function getStateOfArms(results) {
  armStates = {
    [ARMS.LEFT]: ARMSTATES.NONE,
    [ARMS.RIGHT]: ARMSTATES.NONE
  }
  if (results.poseLandmarks[15].y < results.poseLandmarks[2].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[15].y < getMidSection(results) &&
    results.poseLandmarks[15].y > results.poseLandmarks[12].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[15].y > getMidSection(results)) {
    armStates[ARMS.RIGHT] = ARMSTATES.LOW;
  }

  if (results.poseLandmarks[16].y < results.poseLandmarks[5].y) {
    armStates[ARMS.LEFT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[16].y < getMidSection(results) &&
    results.poseLandmarks[16].y > results.poseLandmarks[11].y) {
    armStates[ARMS.LEFT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[16].y > getMidSection(results)) {
    armStates[ARMS.LEFT] = ARMSTATES.LOW;
  }
  return armStates;
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

const modal = document.getElementById("levelUpModal");
const span = document.getElementsByClassName("close")[0];
span.onclick = function () {
  modal.style.display = "none";
};

window.onclick = function (event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
};

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
  if (myInterpreter.step()) {
    myInterpreter.step();
    myInterpreter.step(); // not sure why but this is needed to run 3 times?
    setTimeout(stepThroughAllCode, 500); // need the correct timing
  }
  else{
    codeIsRunning = false;
  }
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
