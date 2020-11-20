// Global variables
var canvas = document.getElementById("renderCanvas");
var engine = new BABYLON.Engine(canvas, true);
var scene = new BABYLON.Scene(engine);
// Create GUI
var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
// Keep track of all GUI elements
var guiElements = [];
// Arrays to store robot actions and sizes of snowballs
var animations = [];
var sizes = [];

var topBlock = -300;
const largeDiameter = 1.2;
const mediumDiameter = 0.9;
const smallDiameter = 0.6;
const startDelay = 500;
const makeSphereDelay = 500;
const placeSphereDelay = 5000;
const danceDelay = 7000;

// functions for code blocks
Blockly.JavaScript['create_sphere'] = function(block) {
    var dropdown_name = block.getFieldValue('NAME');
    animations.push("make sphere");
    sizes.push(dropdown_name);
    var code = 'console.log("make sphere");\n';
    return code;
}; 

Blockly.JavaScript['place'] = function(block) {
    animations.push("place");
    var code = 'console.log("place");\n';
    return code;
};

Blockly.JavaScript['dance'] = function(block) {
    animations.push("dance");
    var code = 'console.log("dance");\n';
    return code;
};

function clearGUI() {
    for (i = 0; i < guiElements.length; i++) {
        guiElements[i].isVisible = false;
    }
    animations = [];
}

// Helper functions
function setUpScene(scene, camera, camera1, light, light1) {
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

function createResetButton() {
    var reset = BABYLON.GUI.Button.CreateSimpleButton("but", "Reset");
    reset.width = 0.1;
    reset.height = "40px";
    reset.color = "white";
    reset.background = "green";
    reset.left = -400;
    reset.top = 300;
    gui.addControl(reset);
    return reset;
}

function createRunButton() {
    var run = BABYLON.GUI.Button.CreateSimpleButton("but", "Click to Run!");
    run.width = 0.1;
    run.height = "40px";
    run.color = "white";
    run.background = "green";
    run.left = 300;
    run.top = 300;
    gui.addControl(run);
    return run;
}

function moveSphere(translate, currSphere, scene) {
    var j = 0;
    var deltaDistance = 0.009;
    var dist = translate.length();
    var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
    dir.normalize();
    scene.registerAfterRender(function () { 
        if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
    });
}

function moveRobotUp(robot, delay) {
    setTimeout(() => {
        robot.position.y += 0.5                    
    }, delay);
}

/******* main function ******/
var createScene = function () {
    // Create scene + Set up
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
    var camera1 = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, -4, 0), scene);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    setUpScene(scene, camera, camera1, light, light1);

    // Load robot character from github and play animation
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/nisha-chat/hourofcode/main/", "robot.glb", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
        var robot = newMeshes[0];
        // Scale the model down        
        robot.scaling.scaleInPlace(0.6);
        robot.position.x -= 1.5;
        // Lock camera on the character 
        camera1.target = robot;

        // Get all the animations
        const idleAnim = scene.getAnimationGroupByName("Idle");
        const placeLargeAnim = scene.getAnimationGroupByName("placeLarge");
        const placeMediumAnim = scene.getAnimationGroupByName("placeMedium");
        const placeSmallAnim = scene.getAnimationGroupByName("placeSmall");
        const danceAnim = scene.getAnimationGroupByName("Dance");
        // Start with Idle Animation
        idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

        // Create Reset Button
        var reset = createResetButton();
        //function for when the "reset" button is clicked
        reset.onPointerUpObservable.add(function() {
            clearGUI();
            robot.position.y = 0;
        });
        // Create Run Button
        var run = createRunButton();
        //function for when the "run" button is clicked
        run.onPointerUpObservable.add(function() {
            // Create pointer arrow that follows current code block
            //var arrow = createPointer();
            //var arrowPos = -260;
            var delay = startDelay;
            //Initialize start and end coordinates for snowballs
            var startX = -1.5;
            var startY = 1.3;
            var startZ = 1;
            var endX = 0.7;
            var endY = -1.5;
            var endZ = 0.2;
            // Index tracker for sizes of snowball
            var sizeIndex = 0;
            // Variable to hold the current size of snowball
            var currSize = "large";
            // Loop through all animations/actions
            for(var i = 0; i < animations.length; i++) {
                if(animations[i] == "make sphere") {
                    setTimeout(() => {
                        startY += 0.5;
                        currSize = sizes[sizeIndex];
                        //set default diameter to largest size
                        var diam = largeDiameter;
                        //change diameter of the ball based on selected size
                        if(currSize == "small") {
                            diam = smallDiameter;
                        }
                        else if(currSize == "medium") {
                            diam = mediumDiameter;
                        }
                        else if(currSize == "large"){
                            diam = largeDiameter;
                        }
                        //create a new snowball at the position of the robot's hands
                        currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: diam, segments: 32}, scene);
                        currSphere.position = new BABYLON.Vector3(startX,startY,startZ);
                        guiElements.push(currSphere);
                        sizeIndex++;
                    }, delay);
                    delay += makeSphereDelay;
                }
                else if(animations[i] == "dance") {
                    idleAnim.stop();
                    setTimeout(() => {
                        danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
                      }, delay);
                      delay += danceDelay;
                    danceAnim.stop();
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                }
                else if(animations[i] == "place") {
                    idleAnim.stop();
                    setTimeout(() => {
                        if(currSize == "small") {
                            endY += 0.1;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere, scene);
                            placeSmallAnim.start(false, 1.0, 0, 2.3, false);   
                        } 
                        else if(currSize == "medium") {
                            endY += 0.3;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere, scene);
                            placeMediumAnim.start(false, 1.0, placeMediumAnim.from, placeMediumAnim.to, false);  
                        }   
                        else if(currSize == "large"){
                            endY += 0.5;
                            moveSphere(new BABYLON.Vector3(endX, endY, endZ), currSphere, scene);
                            placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);  
                        }   
                    }, delay);
                    delay += placeSphereDelay;
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                    moveRobotUp(robot, delay);
                }
            }
        });
    });
    return scene;
};

// function to call createScene()
window.addEventListener('DOMContentLoaded', function() {
    var scene = createScene();
    engine.runRenderLoop(function () {
        if (scene) {
            scene.render();
        }
    });
    window.addEventListener("resize", function () {
            engine.resize();
    });
});