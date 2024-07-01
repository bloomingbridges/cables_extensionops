let cgl = op.patch.cgl;

let render = op.inTrigger("render");
let trigger = op.outTrigger("trigger");

let screenSpace = op.addInPort(new CABLES.Port(op, "screen space", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
let direction = op.addInPort(new CABLES.Port(op, "direction", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
screenSpace.set(false);
direction.set(true);

let r = op.addInPort(new CABLES.Port(op, "r1", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
let g = op.addInPort(new CABLES.Port(op, "g1", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let b = op.addInPort(new CABLES.Port(op, "b1", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let a = op.addInPort(new CABLES.Port(op, "a1", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

let r2 = op.addInPort(new CABLES.Port(op, "r2", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
let g2 = op.addInPort(new CABLES.Port(op, "g2", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let b2 = op.addInPort(new CABLES.Port(op, "b2", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let a2 = op.addInPort(new CABLES.Port(op, "a2", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

let r3 = op.addInPort(new CABLES.Port(op, "r3", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
let g3 = op.addInPort(new CABLES.Port(op, "g3", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let b3 = op.addInPort(new CABLES.Port(op, "b3", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
let a3 = op.addInPort(new CABLES.Port(op, "a3", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

r.set(0.2);
g.set(0.2);
b.set(0.2);
a.set(1.0);

r2.set(0.73);
g2.set(0.73);
b2.set(0.73);
a2.set(1.0);

r3.set(1.0);
g3.set(1.0);
b3.set(1.0);
a3.set(1.0);

let colA = [];
let colB = [];
let colC = [];

let w = 0, h = 0;

let doRender = function ()
{
    if (w != cgl.getViewPort()[2] || h != cgl.getViewPort()[3])
    {
        w = cgl.getViewPort()[2];
        h = cgl.getViewPort()[3];
    }

    uniformWidth.setValue(w);
    uniformHeight.setValue(h);

    cgl.pushShader(shader);
    trigger.trigger();
    cgl.popShader();
};

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "IN vec2 texCoord;"
    .endl() + "UNI vec4 colA;"
    .endl() + "UNI vec4 colB;"
    .endl() + "UNI vec4 colC;"
    .endl() + "UNI float width,height;"

    .endl() + ""
    .endl() + "void main()"
    .endl() + "{"

    .endl() + "   #ifdef USE_TEXCOORDS"
    .endl() + "       vec2 coords=texCoord;"
    .endl() + "   #endif"

    .endl() + "   #ifdef USE_FRAGCOORDS"
    .endl() + "       vec2 coords=vec2(gl_FragCoord.x/width,gl_FragCoord.y/height);"
    .endl() + "   #endif"

    .endl() + "   #ifdef DIRECTION_VERTICAL"
    .endl() + "   if(coords.y<=0.5)"
    .endl() + "       gl_FragColor = vec4(mix(colA, colB, coords.y*2.0));"
    .endl() + "   else"
    .endl() + "       gl_FragColor = vec4(mix(colB, colC, (coords.y-0.5)*2.0));"
    .endl() + "   #endif"

    .endl() + "   #ifndef DIRECTION_VERTICAL"
    .endl() + "       if(coords.x<=0.5)"
    .endl() + "           gl_FragColor = vec4(mix(colA, colB, coords.x*2.0));"
    .endl() + "       else"
    .endl() + "           gl_FragColor = vec4(mix(colB, colC, (coords.x-0.5)*2.0));"
    .endl() + "   #endif"

    .endl() + "}";

var shader = new CGL.Shader(cgl, "GradientMaterial");
shader.setSource(shader.getDefaultVertexShader(), srcFrag);
shader.define("USE_TEXCOORDS");
var uniformWidth = new CGL.Uniform(shader, "f", "width", w);
var uniformHeight = new CGL.Uniform(shader, "f", "height", h);

r.onChange = g.onChange = b.onChange = a.onChange = function ()
{
    colA = [r.get(), g.get(), b.get(), a.get()];
    if (!r.uniform) r.uniform = new CGL.Uniform(shader, "4f", "colA", colA);
    else r.uniform.setValue(colA);
};

r2.onChange = g2.onChange = b2.onChange = a2.onChange = function ()
{
    colB = [r2.get(), g2.get(), b2.get(), a2.get()];
    if (!r2.uniform) r2.uniform = new CGL.Uniform(shader, "4f", "colB", colB);
    else r2.uniform.setValue(colB);
};

r3.onChange = g3.onChange = b3.onChange = a3.onChange = function ()
{
    colC = [r3.get(), g3.get(), b3.get(), a3.get()];
    if (!r3.uniform) r3.uniform = new CGL.Uniform(shader, "4f", "colC", colC);
    else r3.uniform.setValue(colC);
};

screenSpace.onChange = function ()
{
    if (screenSpace.get())
    {
        shader.define("USE_FRAGCOORDS");
        shader.removeDefine("USE_TEXCOORDS");
    }
    else
    {
        shader.define("USE_TEXCOORDS");
        shader.removeDefine("USE_FRAGCOORDS");
    }
};

direction.onChange = function ()
{
    if (direction.get()) shader.removeDefine("DIRECTION_VERTICAL");
    else shader.define("DIRECTION_VERTICAL");
};

// r3.onValueChanged();
// r2.onValueChanged();
// r.onValueChanged();
render.onTriggered = doRender;
doRender();
