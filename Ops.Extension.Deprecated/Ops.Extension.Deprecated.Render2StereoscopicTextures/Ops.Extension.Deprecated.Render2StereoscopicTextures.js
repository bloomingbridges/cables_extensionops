let render = op.inTrigger("render");
let pose = op.addInPort(new CABLES.Port(op, "pose matrix", CABLES.OP_PORT_TYPE_OBJECT));
let eyeLeft = op.addInPort(new CABLES.Port(op, "Eye Left", CABLES.OP_PORT_TYPE_OBJECT));
let eyeRight = op.addInPort(new CABLES.Port(op, "Eye Right", CABLES.OP_PORT_TYPE_OBJECT));

let trigger = op.outTrigger("trigger");
let tex0 = op.addOutPort(new CABLES.Port(op, "texture left", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true }));
let tex1 = op.addOutPort(new CABLES.Port(op, "texture right", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true }));

let cgl = op.patch.cgl;

let fb = [new CGL.Framebuffer2(cgl, w, h), new CGL.Framebuffer2(cgl, w, h)];
tex0.set(fb[0].getTextureColor());
tex1.set(fb[1].getTextureColor());

var w = 1024;
var h = 1024;

function renderEye(eye)
{
    cgl.pushPMatrix();
    cgl.pushViewMatrix();

    if (eye)
    {
        mat4.perspectiveFromFieldOfView(cgl.pMatrix, eye.fieldOfView, 0.1, 1024.0);

        if (pose.get()) mat4.fromRotationTranslation(cgl.vMatrix, pose.get().orientation, pose.get().position);
        mat4.translate(cgl.vMatrix, cgl.vMatrix, eye.offset);
        mat4.invert(cgl.vMatrix, cgl.vMatrix);
    }

    // console.log(eye.renderWidth);
    // if(pose.get())mat4.multiply(cgl.vMatrix,cgl.vMatrix,poseMat.get());

    trigger.trigger();
    cgl.popViewMatrix();
    cgl.popPMatrix();
}

render.onTriggered = function ()
{
    if (eyeLeft.get() && (w != eyeLeft.get().renderWidth || h != eyeLeft.get().renderHeight))
    {
        w = eyeLeft.get().renderWidth;
        h = eyeLeft.get().renderHeight;
        fb[0].setSize(w, h);
        fb[1].setSize(w, h);
        cgl.canvas.width = w * 2;
        //   Math.max(leftEye.renderWidth, rightEye.renderWidth) * 2;

        cgl.canvas.height = h;
        console.log("set eye resolution", w, h);
    }

    fb[0].renderStart();
    renderEye(eyeRight.get());
    fb[0].renderEnd();

    cgl.resetViewPort();

    fb[1].renderStart();
    renderEye(eyeLeft.get());
    fb[1].renderEnd();

    cgl.resetViewPort();
};
