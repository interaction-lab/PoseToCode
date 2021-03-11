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
let startMotion = 0;
let standingDistLeft = 0;
let standingDistRight = 0;

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
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // run (paused running motion --> left hand up + right hand down)
    else if (
      results.poseLandmarks[20].y < results.poseLandmarks[5].y &&
      !(results.poseLandmarks[19].y < results.poseLandmarks[2].y) &&
      !sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        calculate.play();
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // reset (both hands above head)
    else if (
      results.poseLandmarks[21].y < results.poseLandmarks[2].y &&
      results.poseLandmarks[22].y < results.poseLandmarks[2].y &&
      !sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // size of sphere (right arm: low)
    else if (
      results.poseLandmarks[19].y > results.poseLandmarks[23].y &&
      sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // size of sphere (right arm: med)
    else if (
      results.poseLandmarks[19].y < results.poseLandmarks[23].y &&
      results.poseLandmarks[19].y > results.poseLandmarks[11].y &&
      sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // size of sphere (right arm: high)
    else if (
      results.poseLandmarks[19].y < results.poseLandmarks[11].y &&
      sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
      canvasCtx.restore();
    }
    // place sphere (point down to ankles)
    else if (
      results.poseLandmarks[19].y > results.poseLandmarks[25].y &&
      results.poseLandmarks[20].y > results.poseLandmarks[26].y &&
      !sphereSizeFlag
    ) {
      sleepFlag = true;
      hold.style.visibility = "visible";
      progress.style.visibility = "visible";
      await moveProgressBar();
      setTimeout(() => {
        hold.style.visibility = "hidden";
        progress.style.visibility = "hidden";
        loader.style.visibility = "visible";
        processing.style.visibility = "visible";
      }, 3500);
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
