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
const hold = document.getElementById("hold");
const processing = document.getElementById("processing");
loader.style.visibility = "hidden";
processing.style.visibility = "hidden";
/* variables to hold current parent block and child block */
let parentBlock = null;
let childBlock = null;
/* keep track of all blocks for resetting */
const allBlocks = [];

let sphereSizeFlag = false;
let sleepFlag = false;
let startMotion = 0;
let standingDistLeft = 0;
let standingDistRight = 0;

const videoElement = document.getElementsByClassName("input_video")[0];
const canvasElement = document.getElementsByClassName("output_canvas")[0];
const canvasCtx = canvasElement.getContext("2d");

function sleep(milliseconds) {
  loader.style.visibility = "visible";
  processing.style.visibility = "visible";
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
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

  if (startMotion <= 100) {
    standingDistLeft =
      results.poseLandmarks[28].y - results.poseLandmarks[24].y;
    standingDistRight =
      results.poseLandmarks[27].y - results.poseLandmarks[23].y;
    startMotion += 1;
  }
  // dance (both arms out to the side)
  const leftDist = Math.abs(
    results.poseLandmarks[14].y - results.poseLandmarks[12].y
  );
  const rightDist = Math.abs(
    results.poseLandmarks[11].y - results.poseLandmarks[13].y
  );

  if (!sleepFlag) {
    if (rightDist < 0.05 && leftDist < 0.05 && !sphereSizeFlag) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        /* programatically adding code block */
        if (parentBlock == null) {
          parentBlock = workspace.newBlock("dance");
          parentBlock.initSvg();
          parentBlock.render();
        } else {
          childBlock = workspace.newBlock("dance");
          childBlock.initSvg();
          childBlock.render();
          const parentConnection = parentBlock.nextConnection;
          const childConnection = childBlock.previousConnection;
          parentConnection.connect(childConnection);
          parentBlock = childBlock;
        }
        allBlocks.push(parentBlock);
      }, 1000);
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("dance");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // run (paused running motion --> left hand up + right hand down)
    else if (
      results.poseLandmarks[20].y < results.poseLandmarks[5].y &&
      !(results.poseLandmarks[19].y < results.poseLandmarks[2].y) &&
      !sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        runCode();
      }, 1000);
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("run");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // reset (both hands above head)
    else if (
      results.poseLandmarks[21].y < results.poseLandmarks[2].y &&
      results.poseLandmarks[22].y < results.poseLandmarks[2].y &&
      !sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        // delete all code blocks in the workspace
        for (i = 0; i < allBlocks.length; i++) {
          allBlocks[i].dispose(true);
        }
        parentBlock = null;
        resetGUI();
      }, 1000);
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("reset");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // make sphere (hands in front of chest)
    else if (
      results.poseLandmarks[20].x > results.poseLandmarks[12].x &&
      results.poseLandmarks[19].x < results.poseLandmarks[11].x &&
      results.poseLandmarks[20].y < results.poseLandmarks[14].y &&
      results.poseLandmarks[20].y > results.poseLandmarks[12].y &&
      results.poseLandmarks[19].y < results.poseLandmarks[13].y &&
      results.poseLandmarks[19].y > results.poseLandmarks[11].y &&
      !sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        /* add code block */
        if (parentBlock == null) {
          parentBlock = workspace.newBlock("create_sphere");
          parentBlock.initSvg();
          parentBlock.render();
        } else {
          childBlock = workspace.newBlock("create_sphere");
          childBlock.initSvg();
          childBlock.render();
          const parentConnection = parentBlock.nextConnection;
          const childConnection = childBlock.previousConnection;
          parentConnection.connect(childConnection);
          parentBlock = childBlock;
        }
        allBlocks.push(parentBlock);
      }, 1000);
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("create sphere");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      sphereSizeFlag = true;
      canvasCtx.restore();
    }
    // size of sphere (right arm: low)
    else if (
      results.poseLandmarks[19].y > results.poseLandmarks[23].y &&
      sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        // change field value of create_sphere block
        if (parentBlock != null) {
          childBlock = workspace.newBlock("size");
          childBlock.setFieldValue("small", "TEXT");
          const parentConnection = parentBlock.getInput("TEXT").connection;
          const childConnection = childBlock.outputConnection;
          parentConnection.connect(childConnection);
        }
      }, 1000);
      sphereSizeFlag = false;
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("small sphere");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // size of sphere (right arm: med)
    else if (
      results.poseLandmarks[19].y < results.poseLandmarks[23].y &&
      results.poseLandmarks[19].y > results.poseLandmarks[11].y &&
      sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        // change field value of create_sphere block
        if (parentBlock != null) {
          childBlock = workspace.newBlock("size");
          childBlock.setFieldValue("medium", "TEXT");
          const parentConnection = parentBlock.getInput("TEXT").connection;
          const childConnection = childBlock.outputConnection;
          parentConnection.connect(childConnection);
        }
      }, 1000);
      sphereSizeFlag = false;
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("medium sphere");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // size of sphere (right arm: high)
    else if (
      results.poseLandmarks[19].y < results.poseLandmarks[11].y &&
      sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        // change field value of create_sphere block
        if (parentBlock != null) {
          childBlock = workspace.newBlock("size");
          childBlock.setFieldValue("large", "TEXT");
          const parentConnection = parentBlock.getInput("TEXT").connection;
          const childConnection = childBlock.outputConnection;
          parentConnection.connect(childConnection);
        }
      }, 1000);
      sphereSizeFlag = false;
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("large sphere");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
    // place sphere (point down to ankles)
    else if (
      results.poseLandmarks[19].y > results.poseLandmarks[25].y &&
      results.poseLandmarks[20].y > results.poseLandmarks[26].y &&
      !sphereSizeFlag
    ) {
      setTimeout(() => {
        loader.style.visibility = "hidden";
        processing.style.visibility = "hidden";
      }, 1500);
      setTimeout(() => {
        if (parentBlock == null) {
          parentBlock = workspace.newBlock("place");
          parentBlock.initSvg();
          parentBlock.render();
        } else {
          childBlock = workspace.newBlock("place");
          childBlock.initSvg();
          childBlock.render();
          const parentConnection = parentBlock.nextConnection;
          const childConnection = childBlock.previousConnection;
          parentConnection.connect(childConnection);
          parentBlock = childBlock;
        }
        allBlocks.push(parentBlock);
      }, 1000);
      sphereSizeFlag = false;
      sleepFlag = true;
      loader.style.visibility = "visible";
      processing.style.visibility = "visible";
      console.log("place sphere");
      setTimeout(() => {
        sleep(500);
      }, 5);
      sleepFlag = false;
      canvasCtx.restore();
    }
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
