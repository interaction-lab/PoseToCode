window.addEventListener('DOMContentLoaded', function() {

var canvas = document.getElementById("renderCanvas"); // Get the canvas element
var engine = new BABYLON.Engine(canvas, true); // Generate the BABYLON 3D engine

/******* Add the create scene function ******/
var createScene = function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 0, 0), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;
    var currSphere;
    var animations = [];
    var sizes = [];
    var deltaDistance = 0.009;

    engine.enableOfflineSupport = false;

    var camera1 = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 10, new BABYLON.Vector3(0, -4, 0), scene);
    scene.activeCamera = camera1;
    scene.activeCamera.attachControl(canvas, true);
    camera1.lowerRadiusLimit = 10;
    camera1.upperRadiusLimit = 10;
    camera1.wheelDeltaPercentage = 0.1;

    // Lights
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = BABYLON.Color3.Black();

    var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Load hero character and play animation
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/nisha-chat/hourofcode/main/", "robot.glb", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
        var hero = newMeshes[0];
        //Scale the model down        
        hero.scaling.scaleInPlace(0.6);
        hero.position.x -= 1.5;
        //Lock camera on the character 
        camera1.target = hero;
    
        // Create GUI
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        // Run Button
        var topBlock = -400;
        var run = BABYLON.GUI.Button.CreateSimpleButton("but", "Click to Run!");
        run.width = 0.1;
        run.height = "40px";
        run.color = "white";
        run.background = "green";
        advancedTexture.addControl(run);  
        run.left = 300;
        run.top = 300;

        //Get the animations
        const idleAnim = scene.getAnimationGroupByName("Idle");
        const placeLargeAnim = scene.getAnimationGroupByName("placeLarge");
        const placeMediumAnim = scene.getAnimationGroupByName("placeMedium");
        const placeSmallAnim = scene.getAnimationGroupByName("placeSmall");
        const danceAnim = scene.getAnimationGroupByName("Dance");
        const gestureAnim = scene.getAnimationGroupByName("Gesture");
        //start with Idle
        idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

        run.onPointerUpObservable.add(function() {
            var arrow = new BABYLON.GUI.TextBlock();
            var arrowPos = -360;
            arrow.text = "←";
            arrow.color = "red";
            arrow.fontSize = 24; 
            arrow.left = 420;

            var i = 0;
            var delay = 500;
            var startX = -1.5;
            var startY = 1.3;
            var startZ = 1;
            var endX = 0.7;
            var endY = -1.5;
            var endZ = 0.2;
            var sizeIndex = -1;
            var currSize = "large";
            while(i < animations.length) {
                console.log(delay);
                console.log(animations[i]);
                var diam = 1.2;
                if(animations[i] == "make sphere") {
                    i++;
                    setTimeout(() => {
                        startY += 0.5;
                        sizeIndex++;
                        console.log(sizeIndex);
                        console.log(sizes[sizeIndex]);
                        currSize = sizes[sizeIndex];
                        if(sizes[sizeIndex] == "small") {
                            diam = 0.6;
                            //startX -= 0.2;
                        }
                        else if(sizes[sizeIndex] == "medium") {
                            diam = 0.9;
                        }
                        else if(sizes[sizeIndex] == "large"){
                            diam = 1.2;
                        }
                        arrow.top = arrowPos;
                        advancedTexture.addControl(arrow);  
                        arrowPos += 80;
                        var startPosition = new BABYLON.Vector3(startX,startY,startZ);
                        currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: diam, segments: 32}, scene);
                        currSphere.position = startPosition;
                    }, delay);
                    delay += 500;
                }
                else if(animations[i] == "dance") {
                    idleAnim.stop();
                    i++;
                    setTimeout(() => {
                        arrow.top = arrowPos;
                        advancedTexture.addControl(arrow); 
                        arrowPos += 40;
                        danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
                      }, delay);
                    danceAnim.stop();
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                    delay += 7000;
                }
                else if(animations[i] == "place") {
                    idleAnim.stop();
                    i++;
                    
                    setTimeout(() => {
                        var j = 0;
                        arrow.top = arrowPos;
                        advancedTexture.addControl(arrow); 
                        arrowPos += 40;
                        if(currSize == "small") {
                            endY += 0.1;
                            var translate = new BABYLON.Vector3(endX, endY, endZ);
                            var dist = translate.length();
                            var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
                            dir.normalize();
                            scene.registerAfterRender(function () { 
                                if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
                            });
                            placeSmallAnim.start(false, 1.0, 0, 2.3, false);   
                        } 
                        else if(currSize == "medium") {
                            endY += 0.3;
                            var translate = new BABYLON.Vector3(endX, endY, endZ);
                            var dist = translate.length();
                            var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
                            dir.normalize();
                            scene.registerAfterRender(function () { 
                                if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
                            });
                            placeMediumAnim.start(false, 1.0, placeMediumAnim.from, placeMediumAnim.to, false);  
                        }   
                        else if(currSize == "large"){
                            endY += 0.5;
                            var translate = new BABYLON.Vector3(endX, endY, endZ);
                            var dist = translate.length();
                            var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
                            dir.normalize();
                            scene.registerAfterRender(function () { 
                                if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
                            });
                            placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);  
                        }   
                    }, delay);
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                    delay += 5000;
                    setTimeout(() => {
                        hero.position.y += 0.5                    
                    }, delay);
                }
            }
        });

        //take in keyboard input
        scene.onKeyboardObservable.add((kbInfo) => {
            switch (kbInfo.type) {
                case BABYLON.KeyboardEventTypes.KEYDOWN:
                    switch (kbInfo.event.key) {
                        case "m":
                            var makeSphere = BABYLON.GUI.Button.CreateSimpleButton("but", "Make Sphere");
                            makeSphere.position = new BABYLON.Vector3(1,1,1);
                            makeSphere.width = 0.1;
                            makeSphere.height = "40px";
                            makeSphere.color = "white";
                            makeSphere.background = "blue";
                            advancedTexture.addControl(makeSphere);  
                            makeSphere.left = 300;
                            topBlock += 40;
                            makeSphere.top = topBlock;
                            topBlock += 40;

                            var checkboxSmall = new BABYLON.GUI.Checkbox();
                            checkboxSmall.width = "20px";
                            checkboxSmall.height = "20px";
                            checkboxSmall.isChecked = false;
                            checkboxSmall.color = "blue";
                            checkboxSmall.left = 200;
                            checkboxSmall.top = topBlock;
                            advancedTexture.addControl(checkboxSmall);    
                        
                            var labelSmall = new BABYLON.GUI.TextBlock();
                            labelSmall.text = "small";
                            labelSmall.width = "50px";
                            labelSmall.marginLeft = "5px";
                            labelSmall.left = 233;
                            labelSmall.top = topBlock;
                            labelSmall.color = "white";
                            advancedTexture.addControl(labelSmall); 

                            var checkboxMed = new BABYLON.GUI.Checkbox();
                            checkboxMed.width = "20px";
                            checkboxMed.height = "20px";
                            checkboxMed.isChecked = false;
                            checkboxMed.color = "blue";
                            checkboxMed.left = 280;
                            checkboxMed.top = topBlock;
                            advancedTexture.addControl(checkboxMed);    
                        
                            var labelMed = new BABYLON.GUI.TextBlock();
                            labelMed.text = "medium";
                            labelMed.width = "70px";
                            labelMed.marginLeft = "5px";
                            labelMed.left = 323;
                            labelMed.top = topBlock;
                            labelMed.color = "white";
                            advancedTexture.addControl(labelMed); 

                            var checkboxLarge = new BABYLON.GUI.Checkbox();
                            checkboxLarge.width = "20px";
                            checkboxLarge.height = "20px";
                            checkboxLarge.isChecked = false;
                            checkboxLarge.color = "blue";
                            checkboxLarge.left = 376;
                            checkboxLarge.top = topBlock;
                            advancedTexture.addControl(checkboxLarge);    
                        
                            var labelLarge = new BABYLON.GUI.TextBlock();
                            labelLarge.text = "large";
                            labelLarge.width = "50px";
                            labelLarge.marginLeft = "5px";
                            labelLarge.color = "white";
                            labelLarge.left = 408;
                            labelLarge.top = topBlock;
                            advancedTexture.addControl(labelLarge); 
                            
                            checkboxSmall.onIsCheckedChangedObservable.add(function(value) {
                                if(value) {
                                    sizes.push("small");
                                    advancedTexture.removeControl(checkboxMed);
                                    advancedTexture.removeControl(labelMed);
                                    advancedTexture.removeControl(checkboxLarge);
                                    advancedTexture.removeControl(labelLarge);
                                }
                            });
                            checkboxMed.onIsCheckedChangedObservable.add(function(value) {
                                sizes.push("medium");
                                advancedTexture.removeControl(checkboxSmall);
                                advancedTexture.removeControl(labelSmall);
                                advancedTexture.removeControl(checkboxLarge);
                                advancedTexture.removeControl(labelLarge);
                            });
                            checkboxLarge.onIsCheckedChangedObservable.add(function(value) {
                                sizes.push("large");
                                advancedTexture.removeControl(checkboxMed);
                                advancedTexture.removeControl(labelMed);
                                advancedTexture.removeControl(checkboxSmall);
                                advancedTexture.removeControl(labelSmall);
                            });
                            animations.push("make sphere");
                        break
                        case "d":
                            var dance = BABYLON.GUI.Button.CreateSimpleButton("but", "Dance");
                            dance.position = new BABYLON.Vector3(1,1,1);
                            dance.width = 0.1;
                            dance.height = "40px";
                            dance.color = "white";
                            dance.background = "purple";
                            advancedTexture.addControl(dance);  
                            dance.left = 300;
                            topBlock += 40;
                            dance.top = topBlock;
                            animations.push("dance");
                        break
                        case "p":
                            var place = BABYLON.GUI.Button.CreateSimpleButton("but", "Place Snowball");
                            place.position = new BABYLON.Vector3(1,1,1);
                            place.width = 0.1;
                            place.height = "40px";
                            place.color = "white";
                            place.background = "red";
                            advancedTexture.addControl(place);  
                            place.left = 300;
                            topBlock += 40;
                            place.top = topBlock;
                            animations.push("place");
                        break
                        case "g":
                            hero.position.y -= 0.1;
                        break
                    }
                break;
            }
        });
    });
    return scene;
};

/******* End of the create scene function ******/
var scene = createScene();

engine.runRenderLoop(function () {
    if (scene) {
        scene.render();
    }
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
});

});