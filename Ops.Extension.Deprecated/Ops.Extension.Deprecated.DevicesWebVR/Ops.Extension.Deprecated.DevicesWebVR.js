let cgl = op.patch.cgl;

let render = op.inTrigger("render");
let smallRender = op.inValueBool("Small Renderer");

let trigger = op.outTrigger("trigger");
let triggerGamePad = op.addOutPort(new CABLES.Port(op, "Controller Matrix", CABLES.OP_PORT_TYPE_FUNCTION));
let numGamepads = op.addOutPort(new CABLES.Port(op, "Num Controller", CABLES.OP_PORT_TYPE_VALUE));
// var tex0=op.addOutPort(new CABLES.Port(op,"texture left",CABLES.OP_PORT_TYPE_TEXTURE,{preview:true}));
// var tex1=op.addOutPort(new CABLES.Port(op,"texture right",CABLES.OP_PORT_TYPE_TEXTURE,{preview:true}));
let tex0 = op.outTexture("texture left");
let tex1 = op.outTexture("texture right");

let w = 1025;
let h = 1025;

let fb = null;
if (cgl.glVersion >= 2)
{
    fb = [new CGL.Framebuffer2(cgl, w, h, {}), new CGL.Framebuffer2(cgl, w, h, {})];
}
else fb = [new CGL.Framebuffer(cgl, w, h), new CGL.Framebuffer(cgl, w, h)];

tex0.set(fb[0].getTextureColor());
tex1.set(fb[1].getTextureColor());

let vrDisplay = null;

let orientMatrix = mat4.create();
let identMatrix = mat4.create();
let quaternion = [0, 0, 0, 0];
let firstQuat = null;

let gp1Matrix = mat4.create();
let qMat = mat4.create();
let frameData = new VRFrameData();

let hasDisplay = op.outValue("hasDisplay");
let hasPose = op.outValue("hasPose");
let hasOrientation = op.outValue("hasorientation");
let isPresenting = op.outValue("is presenting");

let triggerAfter = op.addOutPort(new CABLES.Port(op, "trigger After", CABLES.OP_PORT_TYPE_FUNCTION));
let outDeviceString = op.outValue("Device");

let pose = null;

function renderConrollers()
{
    let count = 0;

    let gamePads = navigator.getGamepads();

    for (let gp = 0; gp < gamePads.length; gp++)
    {
        if (gamePads[gp])
        {
            let gamepad = gamePads[gp];
            if (gamepad && gamepad.pose)
            {
                cgl.pushModelMatrix();

                mat4.identity(gp1Matrix);
                mat4.translate(gp1Matrix, gp1Matrix, gamepad.pose.position);
                mat4.multiply(cgl.mvMatrix, cgl.mvMatrix, gp1Matrix);

                // console.log(gamepad.pose);
                mat4.fromQuat(qMat, gamepad.pose.orientation);
                mat4.multiply(cgl.mvMatrix, cgl.mvMatrix, qMat);

                triggerGamePad.trigger();

                cgl.popModelMatrix();
            }
            count++;
        }
    }

    numGamepads.set(count);
}

function renderEye(eye)
{
    cgl.pushPMatrix();
    cgl.pushViewMatrix();

    if (!eye || !pose || !pose.orientation) return;

    mat4.perspectiveFromFieldOfView(cgl.pMatrix, eye.fieldOfView, 0.1, 1024.0);

    mat4.fromRotationTranslation(cgl.vMatrix, pose.orientation, pose.position);
    mat4.translate(cgl.vMatrix, cgl.vMatrix, eye.offset);
    mat4.invert(cgl.vMatrix, cgl.vMatrix);

    trigger.trigger();

    renderConrollers();

    cgl.popViewMatrix();
    cgl.popPMatrix();
}

let eyeLeft = null;
let eyeRight = null;

render.onTriggered = function ()
{
    if (vrDisplay && vrDisplay.isPresenting)
    {
        isPresenting.set(vrDisplay.isPresenting);
        hasDisplay.set(true);
        pose = vrDisplay.getFrameData(frameData);
        pose = frameData.pose;

        if (pose) hasPose.set(true);
        else
        {
            hasPose.set(false);
            return;
        }

        eyeLeft = vrDisplay.getEyeParameters("left");
        eyeRight = vrDisplay.getEyeParameters("right");

        if (pose.orientation) hasOrientation.set(true);
        else hasOrientation.set(false);

        if (smallRender.get())
        {
            w = cgl.canvas.width = document.getElementById("cablescanvas").offsetWidth;
            h = cgl.canvas.height = document.getElementById("cablescanvas").offsetHeight;
        }
        else
        {
            if (eyeLeft && (w != eyeLeft.renderWidth || h != eyeLeft.renderHeight))
            {
                w = eyeLeft.renderWidth;
                h = eyeLeft.renderHeight;
                fb[0].setSize(w, h);
                fb[1].setSize(w, h);
                cgl.canvas.width = w * 2;

                cgl.canvas.height = h;
                console.log("set eye resolution", w, h);
            }
        }

        fb[0].renderStart();
        renderEye(eyeRight);
        fb[0].renderEnd();

        cgl.resetViewPort();

        fb[1].renderStart();
        renderEye(eyeLeft);
        fb[1].renderEnd();

        tex0.set(fb[0].getTextureColor());
        tex1.set(fb[1].getTextureColor());

        cgl.resetViewPort();

        triggerAfter.trigger();

        vrDisplay.submitFrame(pose);
    }
    else
    {
        hasDisplay.set(false);
    }
};

function webvrbutton()
{
    let element = document.createElement("div");

    element.style.padding = "10px";
    element.style = "cableslink";
    element.style.position = "absolute";
    element.style.right = "0px";
    element.style.bottom = "0px";
    element.style.width = "40px";
    element.style.height = "40px";
    element.style.opacity = "0.4";
    element.style.cursor = "pointer";
    element.style["background-image"] = "url(https://cables.gl/img/cables-logo.svg)";
    element.style["z-index"] = "9999";
    element.style["background-size"] = "80%";
    element.style["background-repeat"] = "no-repeat";

    let canvas = op.patch.cgl.canvas.parentElement;
    canvas.appendChild(element);

    element.addEventListener("click", function ()
    {
        requestVrFullscreen();
    });
}

function requestVrFullscreen()
{
    vrDisplay.requestPresent([{ "source": cgl.canvas }]).then(function ()
    {
        //   webglCanvas.width = Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;
        //   webglCanvas.height = Math.max(leftEye.renderHeight, rightEye.renderHeight);

        console.log("requestPresent ok.");
    }, function (e)
    {
        console.log("requestPresent failed.", e);
    });

    //     if(!CABLES.UI && vrHMD)
    //     {
    //         var canvas=document.getElementById('glcanvas');
    //         console.log('requesting HMD fullscreen!');
    //     	if ( canvas.mozRequestFullScreen )
    //     	{
    // 		    console.log("requesting fullscreen...")
    // 			canvas.mozRequestFullScreen( { vrDisplay: vrHMD } );
    // 		}
    // 		else if ( canvas.webkitRequestFullscreen )
    // 		{
    // 		    console.log("requesting fullscreen...")
    // 			canvas.webkitRequestFullscreen( { vrDisplay: vrHMD } );
    // 		}
    //     }
}

if (navigator.getVRDisplays)
{
    console.log("loading devices...");
    navigator.getVRDisplays().then(function (devices)
    {
        console.log("hallo devices...");
        console.log(devices);
        let info = "found devices:<br/>";

        for (let i = 0; i < devices.length; i++)
        {
            // 			if ( devices[ i ] instanceof HMDVRDevice )
            // 				vrHMD = devices[ i ];
            // 			else
            // 			if ( devices[ i ] instanceof PositionSensorVRDevice )
            // 			{
            vrDisplay = devices[i];
            // 				console.log(devices[i]);
            info += "- " + devices[i].displayName + " !!!<br/>";
            outDeviceString.set(devices[i].displayName);
            // 			}
        }

        info += " found input devices <br/>";
        op.uiAttr({ "info": info });
        op.uiAttr({ "warning": "" });
        if (window.gui) op.refreshParams();

        // document.getElementById("glcanvas").ondblclick = requestVrFullscreen;
        // onTouchstart = requestVrFullscreen;

        document.getElementById("glcanvas").addEventListener("touchstart", requestVrFullscreen);
    });
}
else
{
    op.uiAttr({ "warning": "browser has no webvr api" });
}

webvrbutton();
