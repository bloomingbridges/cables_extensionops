let cgl = op.patch.cgl;

let render = op.inTrigger("render");
let trigger = op.outTrigger("trigger");

let clear = op.addInPort(new CABLES.Port(op, "clear depth", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
let enable = op.addInPort(new CABLES.Port(op, "enable depth testing", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
let write = op.addInPort(new CABLES.Port(op, "write to depth buffer", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));

let depthFunc = op.addInPort(new CABLES.Port(op, "ratio", CABLES.OP_PORT_TYPE_VALUE, { "display": "dropdown", "values": ["never", "always", "less", "less or equal", "greater", "greater or equal", "equal", "not equal"] }));
let theDepthFunc = cgl.gl.LEQUAL;

depthFunc.onChange = updateFunc;
depthFunc.set("less or equal");
clear.set(false);
enable.set(true);
write.set(true);

function updateFunc()
{
    if (depthFunc.get() == "never") theDepthFunc = cgl.gl.NEVER;
    if (depthFunc.get() == "always") theDepthFunc = cgl.gl.ALWAYS;
    if (depthFunc.get() == "less") theDepthFunc = cgl.gl.LESS;
    if (depthFunc.get() == "less or equal") theDepthFunc = cgl.gl.LEQUAL;
    if (depthFunc.get() == "greater") theDepthFunc = cgl.gl.GREATER;
    if (depthFunc.get() == "greater or equal") theDepthFunc = cgl.gl.GEQUAL;
    if (depthFunc.get() == "equal") theDepthFunc = cgl.gl.EQUAL;
    if (depthFunc.get() == "not equal") theDepthFunc = cgl.gl.NOTEQUAL;
}

render.onTriggered = function ()
{
    if (clear.get()) cgl.gl.clear(cgl.gl.DEPTH_BUFFER_BIT);

    if (!enable.get()) cgl.gl.disable(cgl.gl.DEPTH_TEST);
    else cgl.gl.enable(cgl.gl.DEPTH_TEST);

    if (!write.get()) cgl.gl.depthMask(false);
    else cgl.gl.depthMask(true);

    cgl.gl.depthFunc(theDepthFunc);

    trigger.trigger();

    cgl.gl.enable(cgl.gl.DEPTH_TEST);
    cgl.gl.depthMask(true);
    cgl.gl.depthFunc(cgl.gl.LEQUAL);
};
