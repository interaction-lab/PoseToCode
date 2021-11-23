// Global variables
const canvas = document.getElementById("renderCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
var currSphereSize;
var idleAnim, makeSphereAnim, placeSphereAnim, danceAnim;
// Create GUI
const gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
// Keep track of all GUI elements
let guiElements = [];

// Sphere diamters
const largeSphereDiameter = 1.2;
const mediumSphereDiameter = 0.9;
const smallSphereDiameter = 0.6;
// Time delays for each animation
let delay = 500;
const makeSphereDelay = 2000;
const placeSphereDelay = 2000;
const danceDelay = 2000;

// Keep track of sphere coordinates
let startYPosition = 1.3;
let endYPosition = -3;
const endXPosition = 0.7;
const endZPosition = 0.2;
let currHeight = 0;

let level = 1;
const levelOneDone = false;
// Can initialize ahead of time because we know these six actions MUST happen
// in order for a user to pass level one
let levelOneDoneDelay = 3 * makeSphereDelay + 3 * placeSphereDelay;

/***** create scene function ******/
const createScene = function () {
  // Create + set up
  const camera = new BABYLON.FreeCamera(
    "camera",
    new BABYLON.Vector3(0, 0, 0),
    scene
  );
  scene.clearColor = new BABYLON.Color3(.8, .9, 1);
  const camera1 = new BABYLON.ArcRotateCamera(
    "camera1",
    Math.PI / 2,
    Math.PI / 4,
    10,
    new BABYLON.Vector3(0, -4, 0),
    scene
  );
  const light = new BABYLON.HemisphericLight(
    "light",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  const light1 = new BABYLON.HemisphericLight(
    "light1",
    new BABYLON.Vector3(0, 1, 0),
    scene
  );
  setUpScene(camera, camera1, light, light1);
  // Load robot character and robot animations
  BABYLON.SceneLoader.ImportMesh(
    "",
    "https://raw.githubusercontent.com/interaction-lab/PoseToCode/current-main/public/Robot/",
    "blue_robo_finalish.glb",
    scene,
    function (newMeshes, particleSystems, skeletons, animationGroups) {
      const robot = newMeshes[0];
      // Scale the model down
      robot.scaling.scaleInPlace(3.25);
      // Lock camera on the character
      camera1.target = robot;
      // Get all the animations
      idleAnim = scene.getAnimationGroupByName("Idle");
      makeSphereAnim = scene.getAnimationGroupByName("MakeSphere");
      placeSphereAnim = scene.getAnimationGroupByName("PlaceSphere");
      danceAnim = scene.getAnimationGroupByName("Dance");

      // enable animation blending
      idleAnim.enableBlending = true;
      makeSphereAnim.enableBlending = true;
      placeSphereAnim.enableBlending = true;
      danceAnim.enableBlending = true;

      // Start with Idle Animation
      idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
    }
  );
  return scene;
};

// Code block functions
Blockly.JavaScript.make_small_sphere = function (block) {
  currSphereSize = "small";
  var code = 'makeSmallSphere();\n';
  return code;
};

Blockly.JavaScript.make_medium_sphere = function (block) {
  currSphereSize = "medium";
  const code = 'makeMediumSphere();\n';
  return code;
};

Blockly.JavaScript.make_large_sphere = function (block) {
  currSphereSize = "large";
  const code = 'makeLargeSphere();\n';
  return code;
};

function makeSphere(currSphereSize) {
  makeSphereAnim.start(false, 1.0, makeSphereAnim.from, makeSphereAnim.to, false);
  setTimeout(() => {
    startYPosition += 0.5;
    if (currSphereSize == "small") diam = smallSphereDiameter;
    else if (currSphereSize == "medium") diam = mediumSphereDiameter;
    else if (currSphereSize == "large") diam = largeSphereDiameter;
    // create a new snowball at the position of the robot's hands
    currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {
      diameter: diam,
      segments: 32,
    });
    currSphere.position = new BABYLON.Vector3(0, 1.5, .5);
    guiElements.push(currSphere);
  }, 200);
  delay += makeSphereDelay;
  levelOneDoneDelay += makeSphereDelay;
}

Blockly.JavaScript.place = function (block) {
  const code = 'placeSphereCode();\n';
  return code;
};
function placeSphereCode() {
  idleAnim.stop();
  setTimeout(() => {
    placeSphereAnim.start(false, 1.0, placeSphereAnim.from, placeSphereAnim.to, false);
  }, 0);
  setTimeout(() => {
    if (currSphereSize == "small") {
      endYPosition += 0.15;
      moveSphere(new BABYLON.Vector3(endXPosition, endYPosition, endZPosition), currSphere);
      currHeight += smallSphereDiameter / 2;
    } else if (currSphereSize == "medium") {
      endYPosition += 0.25;
      moveSphere(new BABYLON.Vector3(endXPosition, endYPosition, endZPosition), currSphere);
      currHeight += mediumSphereDiameter / 2;
    } else if (currSphereSize == "large") {
      endYPosition += 0.5;
      moveSphere(new BABYLON.Vector3(endXPosition, endYPosition, endZPosition), currSphere);
      currHeight += largeSphereDiameter / 2;
    }
  }, placeSphereDelay);
  delay += placeSphereDelay;
  idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
}

Blockly.JavaScript.dance = function (block) {
  const code = 'dance();\n';
  return code;
};
function dance() { //TODO: pass in dance move
  music = new Audio("sounds/dance.wav");
  idleAnim.stop();
  setTimeout(() => {
    danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
    music.play();
  }, 0);
  delay += danceDelay;
  levelOneDoneDelay += danceDelay;
  danceAnim.stop();
  music.pause();
  idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
}

//dance functions to pass to generic dance()

//cake functions
  //place layer
  //frost layer
  //make layer -> see make sphere logic (2 options)


// Helper functions
function setUpScene(camera, camera1, light, light1) {
  camera.setTarget(BABYLON.Vector3.Zero());
  camera.attachControl(canvas, true);
  light.intensity = 0.7;
  light1.intensity = 0.6;
  light1.specular = BABYLON.Color3.Black();
  scene.activeCamera = camera1;
  scene.activeCamera.attachControl(canvas, true);
  camera1.lowerRadiusLimit = 10;
  camera1.upperRadiusLimit = 10;
  camera1.wheelDeltaPercentage = 0.1;
}

function moveSphere(translate, currSphere) {
  let j = 0;
  const deltaDistance = 0.1;
  const dist = translate.length() - currHeight;
  const dir = new BABYLON.Vector3(0, -2, .5);
  dir.normalize();
  scene.registerAfterRender(function () {
    if (j++ * deltaDistance <= dist)
      currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
  });
}

function moveRobotUp(robot, delay) {
  setTimeout(() => {
    robot.position.y += 0.5;
  }, 0);
}

function runOnGUI() {
  if (level == 1 && detectLevelOneDone()) {
    setTimeout(() => {
      const audio = new Audio("sounds/party_horn.mp3");
      audio.play();
      document.getElementById("levelUpModal").style.display = "block";
      document.getElementById("levelUpModal").querySelector("p").innerHTML =
        "You passed level 1!";
      level++;
    }, levelOneDoneDelay);
  }
}

function resetGUI() {
  for (i = 0; i < guiElements.length; i++) {
    guiElements[i].isVisible = false;
  }
  guiElements = [];
  setTimeout(function () {
    document.activeElement.blur();
  }, 150);
}

// Returns flag for whether the user's programmed sequence of events will
// create a three-tiered snowman. Assumes that to pass this level, there's no
// "side trips" on the way to making this snowman (i.e. no other snowballs are
// created and placed in between the desired sequence). Dance moves are okay. :)
function detectLevelOneDone() {
  // Look for right sequence of animations
  let sequence = [
    "make sphere",
    "place",
    "make sphere",
    "place",
    "make sphere",
    "place",
  ];
  let spotInSequence = 0;
  for (i = 0; i < animations.length; i++) {
    if (spotInSequence == 6) break;
    if (animations[i] == "dance") continue;
    if (animations[i] == sequence[spotInSequence]) {
      spotInSequence++;
    } else {
      break;
    }
  }
  if (spotInSequence != 6) return false;
  sequence = ["large", "medium", "small"];
  spotInSequence = 0;
  for (i = 0; i < sizes.length; i++) {
    if (spotInSequence == 3) break;
    if (sizes[i] == sequence[i]) {
      spotInSequence++;
    } else break;
  }
  if (spotInSequence != 3) return false;
  return true;
}

// function to call createScene()
window.addEventListener("DOMContentLoaded", function () {
  const scene = createScene();
  engine.runRenderLoop(function () {
    if (scene) {
      scene.render();
    }
  });
  window.addEventListener("resize", function () {
    engine.resize();
  });
});
