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
    var large = false;
    var med = false;
    var small = false;
    var sphereLarge;
    var sphereMed;
    var sphereSmall;
    var animations = []

    // Create GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Run Button
    var run = BABYLON.GUI.Button.CreateSimpleButton("but", "Click to Run!");
    run.width = 0.1;
    run.height = "40px";
    run.color = "white";
    run.background = "green";
    advancedTexture.addControl(run);  
    run.left = 300;
    run.top = 300;
    run.onPointerUpObservable.add(function() {
        var i;
        for (i = 0; i < animations.length; i++)
        {
            console.log(animations[i]);
        }
    });

    var topBlock = -400;

    

    // Our built-in 'ground' shape.
    //var ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 9, height: 9}, scene);

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

    // Keyboard events
    var inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
    inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
    }));

    // Load hero character and play animation
    BABYLON.SceneLoader.ImportMesh("", "https://raw.githubusercontent.com/nisha-chat/hourofcode/main/", "robot.glb", scene, function (newMeshes, particleSystems, skeletons, animationGroups) {
    var hero = newMeshes[0];
    //Scale the model down        
    hero.scaling.scaleInPlace(0.6);
    hero.position.x -= 1.5;
    //Lock camera on the character 
    camera1.target = hero;
    var animating = true;
    //Get the animation Group
    const idleAnim = scene.getAnimationGroupByName("Idle");
    const placeLargeAnim = scene.getAnimationGroupByName("placeLarge");
    const placeMediumAnim = scene.getAnimationGroupByName("placeMedium");
    const placeSmallAnim = scene.getAnimationGroupByName("placeSmall");
    const danceAnim = scene.getAnimationGroupByName("Dance");
    const gestureAnim = scene.getAnimationGroupByName("Gesture");

    //Rendering loop (executed for everyframe)
    scene.onBeforeRenderObservable.add(() => {
    var keydown = false;
    if (inputMap["p"]) {
        keydown = true;
    }
    if (inputMap["d"]) {
        keydown = true;
    }
    if (inputMap["i"]) {
        keydown = true;
    }
    if (inputMap["g"]) {
        keydown = true;
    }
    if(inputMap["l"]) {
        keydown = true;
    }
    if(inputMap["m"]) {
        keydown = true;
    }
    if(inputMap["s"]) {
        keydown = true;
    }

    //Manage animations to be played  
    if (keydown) {
        if (!animating) {
            animating = true;
            var deltaDistance = 0.02;
            if(inputMap["i"]) {
                //Idle
                idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
            }
            else if(inputMap["l"])
            {
                // Large sphere
                var makeSphere = BABYLON.GUI.Button.CreateSimpleButton("but", "Create Sphere");
                makeSphere.position = new BABYLON.Vector3(1,1,1);
                makeSphere.width = 0.1;
                makeSphere.height = "40px";
                makeSphere.color = "white";
                makeSphere.background = "green";
                advancedTexture.addControl(makeSphere);  
                makeSphere.left = 300;
                topBlock += 40;
                makeSphere.top = topBlock;
                animations.push("make sphere");

                sphereLarge = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1.2, segments: 32}, scene);
                var startLarge = new BABYLON.Vector3(2, 2.5, 0);
                sphereLarge.position = startLarge;
            }
            else if(inputMap["m"])
            {
                //Medium sphere
                var makeSphere = BABYLON.GUI.Button.CreateSimpleButton("but", "Create Sphere");
                makeSphere.position = new BABYLON.Vector3(1,1,1);
                makeSphere.width = 0.1;
                makeSphere.height = "40px";
                makeSphere.color = "white";
                makeSphere.background = "green";
                advancedTexture.addControl(makeSphere);  
                makeSphere.left = 300;
                topBlock += 40;
                makeSphere.top = topBlock;
                animations.push("make sphere");

                sphereMed = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.9, segments: 32}, scene);
                var startMed = new BABYLON.Vector3(2, 1.4, 0);
                sphereMed.position = startMed;
            }
            else if(inputMap["s"])
            {
                //Small sphere
                var makeSphere = BABYLON.GUI.Button.CreateSimpleButton("but", "Create Sphere");
                makeSphere.position = new BABYLON.Vector3(1,1,1);
                makeSphere.width = 0.1;
                makeSphere.height = "40px";
                makeSphere.color = "white";
                makeSphere.background = "green";
                advancedTexture.addControl(makeSphere);  
                makeSphere.left = 300;
                topBlock += 40;
                makeSphere.top = topBlock;
                animations.push("make sphere");

                sphereSmall = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.6, segments: 32}, scene);
                var startSmall = new BABYLON.Vector3(2, 0.5, 0);
                sphereSmall.position = startSmall;
            }
            else if(inputMap["g"]) {
                //Gesture to Side
                var grab = BABYLON.GUI.Button.CreateSimpleButton("but", "Grab Snowball");
                grab.position = new BABYLON.Vector3(1,1,1);
                grab.width = 0.1;
                grab.height = "40px";
                grab.color = "white";
                grab.background = "green";
                advancedTexture.addControl(grab);  
                grab.left = 300;
                topBlock += 40;
                grab.top = topBlock;

                gestureAnim.start(true, 1.0, gestureAnim.from, gestureAnim.to, false);
                
                var i = 0;
                if(!large)
                {
                    var translateVector = new BABYLON.Vector3(-3.7, -0.7, 1.5);
                    var distance = translateVector.length();
                    var direction = new BABYLON.Vector3(translateVector.x, translateVector.y, translateVector.z);
                    direction.normalize();
                    scene.registerAfterRender(function () { 
                        if((i++) * deltaDistance <= distance) sphereLarge.translate(direction, deltaDistance, BABYLON.Space.WORLD);
                    });
                }
                else if(!med)
                {
                    var translateVector = new BABYLON.Vector3(-3.7, 0.9, 1);
                    var distance = translateVector.length();
                    var direction = new BABYLON.Vector3(translateVector.x, translateVector.y, translateVector.z);
                    direction.normalize();
                    scene.registerAfterRender(function () { 
                        if((i++) * deltaDistance <= distance) sphereMed.translate(direction, deltaDistance, BABYLON.Space.WORLD);
                    });
                }
                else if(!small)
                {
                    var translateVector = new BABYLON.Vector3(-3.4, 1.9, 1);
                    var distance = translateVector.length();
                    var direction = new BABYLON.Vector3(translateVector.x, translateVector.y, translateVector.z);
                    direction.normalize();
                    scene.registerAfterRender(function () { 
                        if((i++) * deltaDistance <= distance) sphereSmall.translate(direction, deltaDistance, BABYLON.Space.WORLD);
                    });
                }
            }
            else if
                (inputMap["p"]) {
                //Placement!
                var j = 0;
                deltaDistance = 0.01;
                var place = BABYLON.GUI.Button.CreateSimpleButton("but", "Place Snowball");
                place.position = new BABYLON.Vector3(1,1,1);
                place.width = 0.1;
                place.height = "40px";
                place.color = "white";
                place.background = "green";
                advancedTexture.addControl(place);  
                place.left = 300;
                topBlock += 40;
                place.top = topBlock;
                animations.push("place");

                if(!large) {
                    placeLargeAnim.start(true, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);
                    var translateL = new BABYLON.Vector3(0.7, -1, 0.2);
                    var distL = translateL.length();
                    var dirL = new BABYLON.Vector3(translateL.x, translateL.y, translateL.z);
                    dirL.normalize();
                    large = true;
                    scene.registerAfterRender(function () { 
                        if((j++) * deltaDistance <= distL) sphereLarge.translate(dirL, deltaDistance, BABYLON.Space.WORLD);
                    });
                }   
                else if(!med) {
                    placeMediumAnim.start(true, 1.0, placeMediumAnim.from, placeMediumAnim.to, false);
                    hero.position.y += 0.5;
                    var translateM = new BABYLON.Vector3(0.7, -0.6, 0.8);
                    var distM = translateM.length();
                    var dirM = new BABYLON.Vector3(translateM.x, translateM.y, translateM.z);
                    dirM.normalize();
                    med = true;
                    scene.registerAfterRender(function () { 
                        if((j++) * deltaDistance <= distM) sphereMed.translate(dirM, deltaDistance, BABYLON.Space.WORLD);
                    });
                }
                else if(!small) {
                    hero.position.y += 0.5;
                    placeSmallAnim.start(true, 1.0, 1, 2.5, false);
                    var translateS = new BABYLON.Vector3(0.4, -0.1, 0.8);
                    var distS = translateS.length();
                    var dirS = new BABYLON.Vector3(translateS.x, translateS.y, translateS.z);
                    dirS.normalize();
                    small = true;
                    scene.registerAfterRender(function () { 
                        if((j++) * deltaDistance <= distS) sphereSmall.translate(dirS, deltaDistance, BABYLON.Space.WORLD);
                    });
                }
            }
            else if
                (inputMap["d"]) {
                //Dance!
                var dance = BABYLON.GUI.Button.CreateSimpleButton("but", "Dance");
                dance.position = new BABYLON.Vector3(1,1,1);
                dance.width = 0.1;
                dance.height = "40px";
                dance.color = "white";
                dance.background = "green";
                advancedTexture.addControl(dance);  
                dance.left = 300;
                topBlock += 40;
                dance.top = topBlock;
                animations.push("dance")

                danceAnim.start(true, 1.0, danceAnim.from, danceAnim.to, false);
            }
            else {
                //Idle
                idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
            }
        }
    }
    else {
        if (animating) {
            //Default animation is idle when no key is down     
            idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);

            //Stop all animations besides Idle Anim when no key is down
            placeLargeAnim.stop();
            placeSmallAnim.stop();
            placeMediumAnim.stop();
            gestureAnim.stop()
            danceAnim.stop();

            //Ensure animation are played only once per rendering loop
            animating = false;
        }
    }
    });
});

return scene;
};
/******* End of the create scene function ******/
var scene = createScene();

// Register a render loop to repeatedly render the scene
engine.runRenderLoop(function () {
        scene.render();
});

// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
        engine.resize();
});