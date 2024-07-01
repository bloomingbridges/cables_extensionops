op.name = "ArcBall";

let render = op.inTrigger("render");

let useWheel = op.inValueBool("Use Mouse Wheel", true);
let minRadius = op.inValue("Min Radius", 0.1);

let trigger = op.outTrigger("trigger");
let outRadius = op.outValue("Radius");

let cgl = op.patch.cgl;
let vScale = vec3.create();
let mouseDown = false;
let radius = 0.0;

let startX = -1;
let startY = -1;
let lastMouseX = -1;
let lastMouseY = -1;

let finalRotMatrix = mat4.create();

render.onTriggered = function ()
{
    cgl.pushViewMatrix();

    let r = radius * 30.0 + minRadius.get();

    if (r < minRadius.get())
    {
        r = minRadius.get();
        radius = 0;
    }
    outRadius.set(r);
    vec3.set(vScale, vOffset[1], -vOffset[0], -r);

    // vec3.set(vScale, 0,0,-r );

    mat4.translate(cgl.vMatrix, cgl.vMatrix, vScale);
    mat4.multiply(cgl.vMatrix, cgl.vMatrix, finalRotMatrix);

    // vec3.set(vScale, -vOffset[1],-vOffset[0],0 );
    // mat4.translate(cgl.vMatrix,cgl.vMatrix, vScale);

    trigger.trigger();
    cgl.popViewMatrix();
};

function touchToMouse(event)
{
    event.offsetX = event.pageX - event.target.offsetLeft;
    event.offsetY = event.pageY - event.target.offsetTop;
    event.which = 1;

    if (startX == -1 && startY == -1 && event.offsetX == event.offsetX && event.offsetY == event.offsetY)
    {
        lastMouseX = startX = event.offsetX;
        lastMouseY = startY = event.offsetY;
    }

    if (event.offsetX != event.offsetX)event.offsetX = 0;
    if (event.offsetY != event.offsetY)event.offsetY = 0;

    return event;
}

function onTouchMove(event)
{
    // console.log(event);

    for (let i = 0; i < event.touches.length; i++)
    {
        let e = touchToMouse(event.touches[i]);

        if (e.offsetX == e.offsetX && e.offsetY == e.offsetY)
            onmousemove(e);
        // console.log(e);
    }
    event.preventDefault();
    // onmousemove('event',event);
}

var vOffset = [0, 0];

function onmousemove(event)
{
    if (!mouseDown) return;

    if (lastMouseX == -1 && lastMouseY == -1) return;

    let x = event.offsetX;
    let y = event.offsetY;

    if (event.which == 3)
    {
        vOffset[1] += (x - lastMouseX) * 0.01;
        vOffset[0] += (y - lastMouseY) * 0.01;
    }

    if (event.which == 1)
    {
        let deltaX = x - lastMouseX;

        let newRotationMatrix = mat4.create();
        mat4.identity(newRotationMatrix);
        // vec3.set(vScale, -vOffset[1],-vOffset[0],0 );
        // mat4.translate(newRotationMatrix,newRotationMatrix, vScale);

        mat4.rotate(newRotationMatrix, newRotationMatrix, CGL.DEG2RAD * (deltaX / 10), [0, 1, 0]);

        let deltaY = y - lastMouseY;
        mat4.rotate(newRotationMatrix, newRotationMatrix, CGL.DEG2RAD * (deltaY / 10), [1, 0, 0]);

        mat4.multiply(finalRotMatrix, newRotationMatrix, finalRotMatrix);

        lastMouseX = x;
        lastMouseY = y;
    }

    lastMouseX = x;
    lastMouseY = y;
}

function onMouseDown(event)
{
    startX = event.offsetX;
    startY = event.offsetY;

    lastMouseX = event.offsetX;
    lastMouseY = event.offsetY;

    mouseDown = true;
}

function onMouseUp(event)
{
    mouseDown = false;
}

function onMouseEnter(event)
{
}

let onMouseWheel = function (event)
{
    if (useWheel.get())
    {
        let delta = CGL.getWheelSpeed(event) * 0.001;
        radius += (parseFloat(delta));
        event.preventDefault();
    }
};

function touchStart(event)
{
    mouseDown = true;
    event.preventDefault();
}

function touchEnd(event)
{
    mouseDown = false;
    startX = -1;
    startY = -1;
    event.preventDefault();
}

cgl.canvas.addEventListener("touchmove", onTouchMove);
cgl.canvas.addEventListener("touchstart", touchStart);
cgl.canvas.addEventListener("touchend", touchEnd);

cgl.canvas.addEventListener("mousemove", onmousemove);
cgl.canvas.addEventListener("mousedown", onMouseDown);
cgl.canvas.addEventListener("mouseup", onMouseUp);
cgl.canvas.addEventListener("mouseleave", onMouseUp);
cgl.canvas.addEventListener("mouseenter", onMouseEnter);
cgl.canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });
cgl.canvas.addEventListener("wheel", onMouseWheel);

op.onDelete = function ()
{
    cgl.canvas.removeEventListener("touchmove", onTouchMove);
    cgl.canvas.removeEventListener("touchstart", touchStart);
    cgl.canvas.removeEventListener("touchend", touchEnd);

    cgl.canvas.removeEventListener("mousemove", onmousemove);
    cgl.canvas.removeEventListener("mousedown", onMouseDown);
    cgl.canvas.removeEventListener("mouseup", onMouseUp);
    cgl.canvas.removeEventListener("mouseleave", onMouseUp);
    cgl.canvas.removeEventListener("mouseenter", onMouseUp);
    cgl.canvas.removeEventListener("wheel", onMouseWheel);
    cgl.canvas.style.cursor = "auto";
};
