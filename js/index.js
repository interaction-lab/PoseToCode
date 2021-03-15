const toolbox = document.getElementById("toolbox");
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
/* Inject your Blockly workspace */
const blocklyDiv = document.getElementById("blocklyDiv");
const workspace = Blockly.inject(blocklyDiv, options);
const workspaceBlocks = document.getElementById("workspaceBlocks");
Blockly.Xml.domToWorkspace(workspaceBlocks, workspace);
const loader = document.getElementsByClassName("loader")[0];
const progress = document.getElementsByClassName("progress")[0];
const hold = document.getElementById("hold");
const processing = document.getElementById("processing");
loader.style.visibility = "hidden";
progress.style.visibility = "hidden";
hold.style.visibility = "hidden";
processing.style.visibility = "hidden";

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
timeToHoldPoseMS = 4000;

// Constants
const ARMS = {
  LEFT: "Left",
  RIGHT: "Right"
}
const ARMSTATES = {
  NONE: "None",
  LOW: "Low",
  MED: "Medium",
  HIGH: "High",
  OUTINFRONT: "Out"
}

// States / Globals
cumulativeArmStates = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0,
    [ARMSTATES.OUTINFRONT]: 0
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: 0,
    [ARMSTATES.MED]: 0,
    [ARMSTATES.HIGH]: 0,
    [ARMSTATES.OUTINFRONT]: 0
  }
}

progressBars = {
  [ARMS.LEFT]: {
    [ARMSTATES.LOW]: document.getElementById("leftArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("leftArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("leftArmHighBar"),
    [ARMSTATES.OUTINFRONT]: document.getElementById("leftArmOutBar")
  },
  [ARMS.RIGHT]: {
    [ARMSTATES.LOW]: document.getElementById("rightArmLowBar"),
    [ARMSTATES.MED]: document.getElementById("rightArmMedBar"),
    [ARMSTATES.HIGH]: document.getElementById("rightArmHighBar"),
    [ARMSTATES.OUTINFRONT]: document.getElementById("rightArmOutBar")
  }
}
leftProgressheader = document.getElementById("leftProgressHeader");
rightProgressheader = document.getElementById("rightProgressHeader");

// Main
async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  resetCanvas();
  drawPoseSkeleton(results);
  if (results != null && results.poseLandmarks != null) {
    curArmStates = getStateOfArms(results);
    updateCumulativeArmStates(curArmStates, deltaTime);
    updateProgressBars();
    var bestArmScores = getBestArmScores();
    updateBestArmText(bestArmScores);
    if (attemptPoseDetection(bestArmScores)) {
      resetAllArmScores();
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
      progressBars[arm][state].innerHTML = state + ": " + Math.round(percent) + "%";
    }
  }
}

function updateBestArmText(bestArmScores) {
  leftProgressheader.innerHTML = "Best Left: " + bestArmScores[ARMS.LEFT];
  rightProgressheader.innerHTML = "Best Right: " + bestArmScores[ARMS.RIGHT];
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
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.LOW &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    resetAllBlocks();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.MED &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    runCode();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.OUTINFRONT &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.OUTINFRONT) {
    placeSphere();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.LOW) {
    setSphereSizeSmall();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.MED) {
    setSphereSizeMedium();
    return true;
  }
  else if (bestArmScores[ARMS.LEFT] == ARMSTATES.HIGH &&
    bestArmScores[ARMS.RIGHT] == ARMSTATES.HIGH) {
    setSphereSizeLarge();
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

// Assumes results.poseLandmarks != null
function getStateOfArms(results) {
  armStates = {
    [ARMS.LEFT]: ARMSTATES.NONE,
    [ARMS.RIGHT]: ARMSTATES.NONE
  }
  if (results.poseLandmarks[19].x < results.poseLandmarks[11].x &&
    results.poseLandmarks[19].y < results.poseLandmarks[13].y &&
    results.poseLandmarks[19].y > results.poseLandmarks[11].y) {
    armStates[ARMS.LEFT] = ARMSTATES.OUTINFRONT;
  }
  else if (results.poseLandmarks[15].y < results.poseLandmarks[2].y) {
    armStates[ARMS.LEFT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[15].y < results.poseLandmarks[23].y &&
    results.poseLandmarks[15].y > results.poseLandmarks[12].y) {
    armStates[ARMS.LEFT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[15].y > results.poseLandmarks[23].y) {
    armStates[ARMS.LEFT] = ARMSTATES.LOW;
  }

  if (results.poseLandmarks[20].x > results.poseLandmarks[12].x &&
    results.poseLandmarks[20].y < results.poseLandmarks[14].y &&
    results.poseLandmarks[20].y > results.poseLandmarks[12].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.OUTINFRONT
  }
  else if (results.poseLandmarks[16].y < results.poseLandmarks[5].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.HIGH;
  }
  else if (results.poseLandmarks[16].y < results.poseLandmarks[24].y &&
    results.poseLandmarks[16].y > results.poseLandmarks[11].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.MED;
  }
  else if (results.poseLandmarks[16].y > results.poseLandmarks[24].y) {
    armStates[ARMS.RIGHT] = ARMSTATES.LOW;
  }
  return armStates;
}

// MediaPipe and DOM events
const userPose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
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

// Codeblock Actions
function runCode() {
  window.LoopTrap = 1000;
  Blockly.JavaScript.INFINITE_LOOP_TRAP =
    'if(--window.LoopTrap == 0) throw "Infinite loop.";\n';
  const code = Blockly.JavaScript.workspaceToCode(workspace);
  try {
    eval(code);
  } catch (e) {
    alert(e);
  }
  runOnGUI();
  setTimeout(function () {
    document.activeElement.blur();
  }, 150);
}

function placeSphere() {
  if (parentBlock == null) {
    parentBlock = workspace.newBlock("place");
    click.play();
    parentBlock.initSvg();
    parentBlock.render();
  } else {
    childBlock = workspace.newBlock("place");
    click.play();
    childBlock.initSvg();
    childBlock.render();
    const parentConnection = parentBlock.nextConnection;
    const childConnection = childBlock.previousConnection;
    parentConnection.connect(childConnection);
    parentBlock = childBlock;
  }
  allBlocks.push(parentBlock);
  console.log("place sphere");
}

function resetAllBlocks() {

  for (i = 0; i < allBlocks.length; i++) {
    allBlocks[i].dispose(true);
  }
  parentBlock = null;
  resetGUI();
  console.log("reset");
}

function setSphereSizeLarge() {
  if (parentBlock != null) {
    childBlock = workspace.newBlock("size");
    click.play();
    childBlock.setFieldValue("large", "TEXT");
    const parentConnection = parentBlock.getInput("TEXT").connection;
    const childConnection = childBlock.outputConnection;
    parentConnection.connect(childConnection);
  }
  console.log("large sphere");
}

function setSphereSizeMedium() {
  if (parentBlock != null) {
    childBlock = workspace.newBlock("size");
    click.play();
    childBlock.setFieldValue("medium", "TEXT");
    const parentConnection = parentBlock.getInput("TEXT").connection;
    const childConnection = childBlock.outputConnection;
    parentConnection.connect(childConnection);
  }
  console.log("medium sphere");
}

function setSphereSizeSmall() {
  if (parentBlock != null) {
    childBlock = workspace.newBlock("size");
    click.play();
    childBlock.setFieldValue("small", "TEXT");
    const parentConnection = parentBlock.getInput("TEXT").connection;
    const childConnection = childBlock.outputConnection;
    parentConnection.connect(childConnection);
  }
  console.log("small sphere");
}

function addDanceBlock() {
  if (parentBlock == null) {
    parentBlock = workspace.newBlock("dance");
    click.play();
    parentBlock.initSvg();
    parentBlock.render();
  } else {
    childBlock = workspace.newBlock("dance");
    click.play();
    childBlock.initSvg();
    childBlock.render();
    const parentConnection = parentBlock.nextConnection;
    const childConnection = childBlock.previousConnection;
    parentConnection.connect(childConnection);
    parentBlock = childBlock;
  }
  allBlocks.push(parentBlock);
  console.log("dance block added");
}

function createSphereBlock() {
  if (parentBlock == null) {
    parentBlock = workspace.newBlock("create_sphere");
    click.play();
    parentBlock.initSvg();
    parentBlock.render();
  } else {
    childBlock = workspace.newBlock("create_sphere");
    click.play();
    childBlock.initSvg();
    childBlock.render();
    const parentConnection = parentBlock.nextConnection;
    const childConnection = childBlock.previousConnection;
    parentConnection.connect(childConnection);
    parentBlock = childBlock;
  }
  allBlocks.push(parentBlock);
  console.log("create sphere block");
}



