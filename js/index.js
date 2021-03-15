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

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

// pose needs a struct
// 

// Detection
const POSES = {
  NONE: "none",
  DANCE: "bothArmsMedium",
  RESET: "bothArmsHigh",
  CREATESPHEREBLOCK: "createSphereBlock",
  PLACESPHEREBLOCK: "placeSphereBlock",
  RUNCODE: "runCode",
  SETSPHERESMALL: "setSphereSmall",
  SETSPHEREMEDIUM: "setSphereMedium",
  SETSPHERELARGE: "setSphereLarge",
};


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
  cumulativeArmStates[ARMS.LEFT][curArmStates[ARMS.LEFT]] += deltaTime;
  cumulativeArmStates[ARMS.RIGHT][curArmStates[ARMS.RIGHT]] += deltaTime;
  decayAllOtherStates(curArmStates, deltaTime);
}



timeToHoldPoseMS = 10000;
function updateTopArmScores() {
  // find most likely pose right now to display
  var bestArmScores = {
    [ARMS.LEFT] : ARMSTATES.NONE,
    [ARMS.RIGHT] : ARMSTATES.NONE
  };
  for (let arm in cumulativeArmStates) {
    var bestStateScore = -1;
    for (let state in cumulativeArmStates[arm]) {
      if(bestStateScore < cumulativeArmStates[arm][state]){
        bestArmScores[arm] = state;
      }
    }
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

async function onResults(results) {
  deltaTime = getDeltaTimeMS();
  resetCanvas();
  drawPoseSkeleton(results);
  // detect each arm
  if (results != null && results.poseLandmarks != null) {
    curArmStates = getStateOfArms(results);
    updateCumulativeArmStates(curArmStates, deltaTime);
    updateProgressBars();
    updateTopArmScores();
  }

  // if (!sleepFlag) {
  //   detectedPose = detectPose(results);
  //   if (detectedPose != POSES.NONE) {
  //     console.log(detectedPose);
  //     sleepFlag = true;
  //     showProgressBar();
  //     await moveProgressBar();
  //     hideProgressBar();
  //     //if pose fully dected
  //     processDetectedPose(detectedPose);
  //     canvasCtx.restore();
  //   }
  // }
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
  },
});

pose.setOptions({
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5,
});
pose.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
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

// Progress Bar
function showProgressBar() {
  hold.style.visibility = "visible";
  progress.style.visibility = "visible";
}

function hideProgressBar() {
  setTimeout(() => {
    hold.style.visibility = "hidden";
    progress.style.visibility = "hidden";
    loader.style.visibility = "visible";
    processing.style.visibility = "visible";
  }, 3500);
}

async function moveProgressBar() {
  loading.play();
  var i = 0;
  if (i == 0) {
    i = 1;
    var elem = document.getElementsByClassName("progress")[0];
    var width = 10;
    var id = setInterval(frame, 10);
    function frame() {
      if (width >= 100) {
        clearInterval(id);
        i = 0;
      } else {
        width++;
        elem.style.width = width + "%";
        elem.innerHTML = width + "%";
      }
    }
  }
  return;
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
  setTimeout(() => {
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
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("small sphere");
}

function resetAllBlocks() {
  setTimeout(() => {
    for (i = 0; i < allBlocks.length; i++) {
      allBlocks[i].dispose(true);
    }
    parentBlock = null;
    resetGUI();
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("reset");
}

function setSphereSizeLarge() {
  setTimeout(() => {
    if (parentBlock != null) {
      childBlock = workspace.newBlock("size");
      click.play();
      childBlock.setFieldValue("large", "TEXT");
      const parentConnection = parentBlock.getInput("TEXT").connection;
      const childConnection = childBlock.outputConnection;
      parentConnection.connect(childConnection);
    }
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("large sphere");
}

function setSphereSizeMedium() {
  setTimeout(() => {
    if (parentBlock != null) {
      childBlock = workspace.newBlock("size");
      click.play();
      childBlock.setFieldValue("medium", "TEXT");
      const parentConnection = parentBlock.getInput("TEXT").connection;
      const childConnection = childBlock.outputConnection;
      parentConnection.connect(childConnection);
    }
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("medium sphere");
}

function setSphereSizeSmall() {
  setTimeout(() => {
    if (parentBlock != null) {
      childBlock = workspace.newBlock("size");
      click.play();
      childBlock.setFieldValue("small", "TEXT");
      const parentConnection = parentBlock.getInput("TEXT").connection;
      const childConnection = childBlock.outputConnection;
      parentConnection.connect(childConnection);
    }
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("small sphere");
}

async function addDanceBlock() {
  setTimeout(() => {
    /* programatically adding code block */
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
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("dance");
}

function runCode() {
  setTimeout(() => {
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
    calculate.pause();
    runCode();
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("run");
}

function createSphereBlock() {
  setTimeout(() => {
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
    loader.style.visibility = "hidden";
    processing.style.visibility = "hidden";
  }, 5000);
  setTimeout(() => {
    sleep(500);
    sleepFlag = false;
  }, 5100);
  console.log("create sphere");
}



// detecyed right arm {HIGH, MED, LOW} 3
// detect left arm position {HIGH, MEDIUM, LOW} 3
// detect right/left out front {TRUE, FALSE} 2



// as soon as somehting dected, reset -> becomes 10

// LEFT{LOW:0,MED:1,HIGH:6}
// RIGHT{LOW,MED,HIGH}
// arm_out_front {happenign:0}


// NONE -> anything not used
// DANCE -> {MEDIUM, MEDIUM, FALSE}
// RESET -> {LOW, HIGH, FALSE}
// RUNCODE -> {MEDIUM, HIGH,FALSE}
// PLACESPHERE -> {MEDIUM, MEDIUM, TRUE}
// MAKESPHERESMALL -> {HIGH, LOW, FALSE}
// MAKESPHEREMED -> {HIGH, MEDIUM, FALSE}
// MAKESPHERELARGER -> {HIGH, HIGH, FALSE}



function detectPose(results) {
  if (results != null && results.poseLandmarks != null) {
    if (bothArmsHigh(results)) {
      return POSES.RESET;
    } else if (bothArmsMedium(results)) {
      return POSES.DANCE;
    } else if (bothArmsLow(results)) {
      return POSES.CREATESPHEREBLOCK;
    } else if (rightArmLow(results)) {
      return POSES.SETSPHERESMALL;
    } else if (rightArmMedium(results)) {
      return POSES.SETSPHEREMEDIUM;
    } else if (rightArmHigh(results)) {
      return POSES.SETSPHERELARGE;
    } else if (leftArmHighRightArmLow(results)) {
      return POSES.RUNCODE;
    } else if (handsInFrontOfChest(results)) {
      return POSES.PLACESPHEREBLOCK;
    }
  }
  return POSES.NONE;
}

function processDetectedPose(pose) {
  if (pose == POSES.SETSPHERESMALL) {
    setSphereSizeSmall();
  } else if (pose == POSES.SETSPHEREMEDIUM) {
    setSphereSizeMedium();
  } else if (pose == POSES.SETSPHERELARGE) {
    setSphereSizeLarge();
  } else if (pose == POSES.RUNCODE) {
    runCode();
  } else if (pose == POSES.RESET) {
    resetAllBlocks();
  } else if ((pose = POSES.DANCE)) {
    addDanceBlock();
  } else if ((pose = POSES.CREATESPHEREBLOCK)) {
    createSphereBlock();
  } else if ((pose = POSES.PLACESPHEREBLOCK)) {
    placeSphere();
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

function bothArmsHigh(results) {
  return (
    results.poseLandmarks.length >= 22 &&
    results.poseLandmarks[21].y < results.poseLandmarks[2].y &&
    results.poseLandmarks[22].y < results.poseLandmarks[2].y &&
    !sphereSizeFlag
  );
}

function handsInFrontOfChest(results) {
  return (
    results.poseLandmarks.length >= 20 &&
    results.poseLandmarks[20].x > results.poseLandmarks[12].x &&
    results.poseLandmarks[19].x < results.poseLandmarks[11].x &&
    results.poseLandmarks[20].y < results.poseLandmarks[14].y &&
    results.poseLandmarks[20].y > results.poseLandmarks[12].y &&
    results.poseLandmarks[19].y < results.poseLandmarks[13].y &&
    results.poseLandmarks[19].y > results.poseLandmarks[11].y &&
    !sphereSizeFlag
  );
}

function leftArmHighRightArmLow(results) {
  return (
    results.poseLandmarks.length >= 20 &&
    results.poseLandmarks[20].y < results.poseLandmarks[5].y &&
    !(results.poseLandmarks[19].y < results.poseLandmarks[2].y) &&
    !sphereSizeFlag
  );
}

function rightArmMedium(results) {
  return (
    results.poseLandmarks.length >= 23 &&
    results.poseLandmarks[19].y < results.poseLandmarks[23].y &&
    results.poseLandmarks[19].y > results.poseLandmarks[11].y &&
    sphereSizeFlag
  );
}

function rightArmLow(results) {
  return (
    results.poseLandmarks.length >= 23 &&
    results.poseLandmarks[19].y > results.poseLandmarks[23].y &&
    sphereSizeFlag
  );
}

function rightArmHigh(results) {
  return (
    results.poseLandmarks.length >= 19 &&
    results.poseLandmarks[19].y < results.poseLandmarks[11].y &&
    sphereSizeFlag
  );
}

function bothArmsMedium(results) {
  return (
    results.poseLandmarks.length >= 14 &&
    results.poseLandmarks[11].y - results.poseLandmarks[13].y < 0.05 &&
    results.poseLandmarks[14].y - results.poseLandmarks[12].y < 0.05 &&
    !sphereSizeFlag
  );
}

function bothArmsLow(results) {
  return (
    results.poseLandmarks.length >= 26 &&
    results.poseLandmarks[19].y > results.poseLandmarks[25].y &&
    results.poseLandmarks[20].y > results.poseLandmarks[26].y &&
    !sphereSizeFlag
  );
}
