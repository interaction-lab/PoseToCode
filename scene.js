// Global variables
var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine
var topBlock = -300;
const largeDiameter = 1.2;
const mediumDiameter = 0.9;
const smallDiameter = 0.6;
const startDelay = 500;
const makeSphereDelay = 500;
const placeSphereDelay = 5000;
const danceDelay = 7000;
var animations = [];
var sizes = [];
// Helper functions

// Blockly.JavaScript['create_sphere'] = function(block) {
//     var dropdown_name = block.getFieldValue('NAME');
//     var value_name = Blockly.JavaScript.valueToCode(block, 'NAME', Blockly.JavaScript.ORDER_ATOMIC);
//     // TODO: Assemble JavaScript into code variable.
//     var code = animations.push("make_sphere");
//     alert(animations);
//     return code;
// }; 

Blockly.JavaScript['create_sphere'] = function(block) {
    // Search the text for a substring.
    var dropdown_name = block.getFieldValue('NAME');
    var code = 'alert(' + dropdown_name + ')';
    return [code, Blockly.JavaScript.ORDER_FUNCTION_CALL];
  };
    
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

function createResetButton(gui) {
    var reset = BABYLON.GUI.Button.CreateSimpleButton("but", "Reset");
    reset.width = 0.1;
    reset.height = "40px";
    reset.color = "white";
    reset.background = "green";
    reset.left = -400;
    reset.top = 300;
    gui.addControl(reset);
    reset.onPointerUpObservable.add(function() {
        window.location.reload();
    });
}

function createRunButton() {
    var run = BABYLON.GUI.Button.CreateSimpleButton("but", "Click to Run!");
    run.width = 0.1;
    run.height = "40px";
    run.color = "white";
    run.background = "green";
    run.left = 300;
    run.top = 300;
    return run;
}

function createPointer() {
    var arrow = new BABYLON.GUI.TextBlock();
    arrow.text = "←";
    arrow.color = "red";
    arrow.fontSize = 24; 
    arrow.left = 420;
    return arrow;
}

function movePointer(arrow, arrowPos, height, gui) {
    arrow.top = arrowPos;
    gui.addControl(arrow);  
    arrowPos += height;
    return arrowPos;
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

function makeSphereBlock(gui) {
    var makeSphere = BABYLON.GUI.Button.CreateSimpleButton("but", "Make Sphere");
    makeSphere.position = new BABYLON.Vector3(1,1,1);
    makeSphere.width = 0.1;
    makeSphere.height = "40px";
    makeSphere.color = "white";
    makeSphere.background = "blue";
    gui.addControl(makeSphere);  
    makeSphere.left = 300;
    topBlock += 40;
    makeSphere.top = topBlock;
    topBlock += 40;
}

function createCheckBox(size, gui) {
    var checkbox = new BABYLON.GUI.Checkbox();
    checkbox.width = "20px";
    checkbox.height = "20px";
    checkbox.isChecked = false;
    checkbox.color = "blue";
    checkbox.top = topBlock; 

    var label = new BABYLON.GUI.TextBlock();
    label.text = size;
    label.top = topBlock;
    label.color = "white";
    label.marginLeft = "5px";
    label.width = "50px";
    if(size == "medium")
    {
        checkbox.left = 280;
        label.width = "70px";
        label.left = 323;
    }
    else if (size == "large") {
        checkbox.left = 376;
        label.left = 408;
    }
    else {
        checkbox.left = 200;
        label.left = 233;
    }
    gui.addControl(checkbox);
    gui.addControl(label); 
    return checkbox;
}

function makeDanceBlock(gui) {
    var dance = BABYLON.GUI.Button.CreateSimpleButton("but", "Dance");
    dance.position = new BABYLON.Vector3(1,1,1);
    dance.width = 0.1;
    dance.height = "40px";
    dance.color = "white";
    dance.background = "purple";
    dance.left = 300;
    topBlock += 40;
    dance.top = topBlock;
    gui.addControl(dance);
}

function makePlacementBlock(gui) {
    var place = BABYLON.GUI.Button.CreateSimpleButton("but", "Place Snowball");
    place.position = new BABYLON.Vector3(1,1,1);
    place.width = 0.1;
    place.height = "40px";
    place.color = "white";
    place.background = "red";
    place.left = 300;
    topBlock += 40;
    place.top = topBlock;
    gui.addControl(place);
}

/******* main function ******/
var createScene = function () {
    // Create scene + Set up
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);
    var camera1 = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, -4, 0), scene);
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    var light1 = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    setUpScene(scene, camera, camera1, light, light1);

    // Create GUI
    var gui = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");    
    // Arrays to store robot actions and sizes of snowballs
    //var animations = [];
    //var sizes = [];

    // Create Reset Button
    createResetButton(gui);

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

        // Create Run Button
        var run = createRunButton();
        gui.addControl(run);  
        //function for when the "run" button is clicked
        run.onPointerUpObservable.add(function() {
            alert(animations);
            // Create pointer arrow that follows current code block
            var arrow = createPointer();
            var arrowPos = -260;
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
                alert(animations[i]);
                if(animations[i] == "make sphere") {
                    setTimeout(() => {
                        startY += 0.5;
                        //currSize = sizes[sizeIndex];
                        currSize = "small";
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
                        arrowPos = movePointer(arrow, arrowPos, 80, gui);
                        //create a new snowball at the position of the robot's hands
                        currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: diam, segments: 32}, scene);
                        currSphere.position = new BABYLON.Vector3(startX,startY,startZ);
                        sizeIndex++;
                    }, delay);
                    delay += makeSphereDelay;
                }
                else if(animations[i] == "dance") {
                    idleAnim.stop();
                    setTimeout(() => {
                        arrowPos = movePointer(arrow, arrowPos, 40, gui);
                        danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
                      }, delay);
                      delay += danceDelay;
                    danceAnim.stop();
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                }
                else if(animations[i] == "place") {
                    idleAnim.stop();
                    setTimeout(() => {
                        arrowPos = movePointer(arrow, arrowPos, 40, gui);
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

        // take in keyboard input
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "m":
                            // make sphere block
                            makeSphereBlock(gui);
                            //create checkboxes for size
                            var checkboxSmall = createCheckBox("small", gui);
                            var checkboxMed = createCheckBox("medium", gui);
                            var checkboxLarge = createCheckBox("large", gui);
                            checkboxSmall.onIsCheckedChangedObservable.add(function(value) {
                                sizes.push("small");
                                // "grey out" other options once one is selected
                                checkboxMed.background = "grey";
                                checkboxLarge.background = "grey";
                            });
                            checkboxMed.onIsCheckedChangedObservable.add(function(value) {
                                sizes.push("medium");
                                checkboxSmall.background = "grey";
                                checkboxLarge.background = "grey";
                            });
                            checkboxLarge.onIsCheckedChangedObservable.add(function(value) {
                                sizes.push("large");
                                checkboxMed.background = "grey";
                                checkboxSmall.background = "grey";
                            });
                            animations.push("make sphere");
                        break
                        case "d":
                            // create dance block
                            makeDanceBlock(gui);
                            animations.push("dance");
                        break
                        case "p":
                            // create placement block
                            makePlacementBlock(gui);
                            animations.push("place");
                        break
                    }
                break;
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