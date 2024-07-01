const exe = op.inTrigger("exe");
let trigger = op.outTrigger("trigger");

let x = op.addInPort(new CABLES.Port(op, "x", CABLES.OP_PORT_TYPE_VALUE));
let y = op.addInPort(new CABLES.Port(op, "y", CABLES.OP_PORT_TYPE_VALUE));
let z = op.addInPort(new CABLES.Port(op, "z", CABLES.OP_PORT_TYPE_VALUE));

let forceObject = {};

exe.onTriggered = function ()
{
    // updateAll();

    vec3.transformMat4(mpos, [x.get(), y.get(), z.get()], cgl.mvMatrix);
    cgl.frameStore.phong.lights[id] = cgl.frameStore.phong.lights[id] || {};
    cgl.frameStore.phong.lights[id].pos = mpos;
    cgl.frameStore.phong.lights[id].mul = mul.get();
    cgl.frameStore.phong.lights[id].type = 0;

    if (attachment.isLinked())
    {
        cgl.pushModelMatrix();
        mat4.translate(cgl.mvMatrix, cgl.mvMatrix,
            [x.get(),
                y.get(),
                z.get()]);
        attachment.trigger();
        cgl.popModelMatrix();
    }

    trigger.trigger();
};
