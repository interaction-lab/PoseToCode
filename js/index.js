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

async function onResults(results) {
  resetCanvas();
  drawPoseSkeleton(results);
  detectedPose = detectPose(results);
  if (detectedPose != POSES.NONE) {
    console.log(detectedPose);
  }
  if (!sleepFlag) {
    // if (bothArmsMedium(results)) {
    //   sleepFlag = true;
    //   showProgressBar();
    //   await moveProgressBar();
    //   hideProgressBar();
    //   await addDanceBlock();
    //   canvasCtx.restore();
    // }
    // run (paused running motion --> left hand up + right hand down)
    // else if (leftArmHighRightArmLow(results)) {
    //   sleepFlag = true;
    //   hideProgressBar();
    //   await moveProgressBar();
    //   showProgressBar();
    //   runCode();
    //   canvasCtx.restore();
    // }
    // // reset (both hands above head)
    // else if (bothArmsHigh(results)) {
    //   sleepFlag = true;
    //   showProgressBar();
    //   await moveProgressBar();
    //   hideProgressBar();
    //   resetAllBlocks();
    //   canvasCtx.restore();
    // }
    // // make sphere (hands in front of chest)
    // else if (handsInFrontOfChest(results)) {
    //   sleepFlag = true;
    //   showProgressBar()
    //   await moveProgressBar();
    //   hideProgressBar();
    //   createSphereBlock();
    //   canvasCtx.restore();
    // }
    // // size of sphere (right arm: low)
    // else if (rightArmLow(results)) {
    //   sleepFlag = true;
    //   hideProgressBar()
    //   await moveProgressBar();
    //   showProgressBar();
    //   setSphereSizeSmall();
    //   canvasCtx.restore();
    // }
    // // size of sphere (right arm: med)
    // else if (rightArmMedium(results)) {
    //   sleepFlag = true;
    //   hideProgressBar();
    //   await moveProgressBar();
    //   showProgressBar();
    //   setSphereSizeMedium();
    //   canvasCtx.restore();
    // }
    // // size of sphere (right arm: high)
    // else if (rightArmHigh(results)) {
    //   sleepFlag = true;
    //   hideProgressBar();
    //   await moveProgressBar();
    //   showProgressBar();
    //   setSphereSizeLarge();
    //   canvasCtx.restore();
    // }
    // // place sphere (point down to ankles)
    // else if (bothArmsLow(results)) {
    //   sleepFlag = true;
    //   hideProgressBar();
    //   await moveProgressBar();
    //   showProgressBar();
    //   placeSphere();
    //   canvasCtx.restore();
    // }
  }
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

// Detection
const POSES = {
  NONE: "none",
  DANCE: "bothArmsMedium",
  RESET: "bothArmsHigh",
  CREATESPHEREBLOCK: "createSphereBlock",
  RUNCODE: "runCode",
  SETSPHERESMALL: "setSphereSmall",
  SETSPHEREMEDIUM: "setSphereMedium",
  SETSPHERELARGE: "setSphereLarge",
};

function detectPose(results) {
  if (results != null && results.poseLandmarks != null) {
    if (rightArmLow(results)) {
      return POSES.SETSPHERESMALL;
    } else if (rightArmMedium(results)) {
      return POSES.SETSPHEREMEDIUM;
    } else if (rightArmHigh(results)) {
      return POSES.SETSPHERELARGE;
    } else if (leftArmHighRightArmLow(results)) {
      return POSES.RUNCODE;
    } else if (bothArmsHigh(results)) {
      return POSES.RESET;
    } else if (bothArmsMedium(results)) {
      return POSES.DANCE;
    } else if (bothArmsLow(results)) {
      return POSES.CREATESPHEREBLOCK;
    } else if (handsInFrontOfChest(results)) {
      return POSES.DANCE;
    }
  }
  return POSES.NONE;
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
