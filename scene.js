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
    var animations = []
    var deltaDistance = 0.007;

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
            var i = 0;
            var delay = 500;
            var startX = -1.5;
            var startY = 1.3;
            var startZ = 1;
            var endX = 0.7;
            var endY = -1.5;
            var endZ = 0.2;
            while(i < animations.length) {
                console.log(delay);
                console.log(animations[i]);
                if(animations[i] == "make sphere") {
                    i++;
                    setTimeout(() => {
                        startY += 0.5;
                        var startPosition = new BABYLON.Vector3(startX,startY,startZ);
                        //var startPosition = new BABYLON.Vector3(2, 2.5, 0);
                        currSphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1.2, segments: 32}, scene);
                        currSphere.position = startPosition;
                    }, delay);
                    delay += 500;
                    // input.onTextChangedObservable.add(function() {
                    //     if(input.text == "1")
                    //     {

        
                    //     }
                    // })
                }
                else if(animations[i] == "dance") {
                    idleAnim.stop();
                    setTimeout(() => {
                        danceAnim.start(false, 1.0, danceAnim.from, danceAnim.to, false);
                      }, 100);
                    danceAnim.stop();
                    idleAnim.start(true, 1.0, idleAnim.from, idleAnim.to, false);
                }
                else if(animations[i] == "place") {
                    idleAnim.stop();
                    i++;
                    
                    setTimeout(() => {
                        endY += 0.5;
                        var translate = new BABYLON.Vector3(endX, endY, endZ);
                        var dist = translate.length();
                        var dir = new BABYLON.Vector3(translate.x, translate.y, translate.z);
                        dir.normalize();
                        var j = 0;
                        scene.registerAfterRender(function () { 
                            if((j++) * deltaDistance <= dist) currSphere.translate(dir, deltaDistance, BABYLON.Space.WORLD);
                        });
                        placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);       
                    }, delay);
                    setTimeout(() => {
                        placeLargeAnim.start(false, 1.0, placeLargeAnim.from, placeLargeAnim.to, false);
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
                            animations.push("make sphere");

                            // var input = new BABYLON.GUI.InputText();
                            // input.left = 300;
                            // topBlock += 40;
                            // input.top = topBlock;
                            // input.width = 0.2;
                            // input.maxWidth = 0.2;
                            // input.height = "40px";
                            // input.text = "Enter snowball size (1, 2, or 3)"
                            // input.color = "white";
                            // input.background = "green";
                            // advancedTexture.addControl(input);
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