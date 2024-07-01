// Op.apply(this, arguments);
let self = this;
let cgl = this.patch.cgl;

this.name = "ColorOverlay";

this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));

this.r = this.addInPort(new CABLES.Port(this, "r", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
this.g = this.addInPort(new CABLES.Port(this, "g", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
this.b = this.addInPort(new CABLES.Port(this, "b", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
this.a = this.addInPort(new CABLES.Port(this, "a", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

let shader = new CGL.Shader(cgl, op.name, op);
// this.onLoaded=shader.compile;

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "#ifdef HAS_TEXTURES"
    .endl() + "  IN vec2 texCoord;"
    .endl() + "  UNI sampler2D tex;"
    .endl() + "  UNI float r;"
    .endl() + "  UNI float g;"
    .endl() + "  UNI float b;"
    .endl() + "  UNI float a;"
    .endl() + "#endif"
    .endl() + ""
    .endl() + ""
    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 col=vec4(1.0,0.0,0.0,1.0);"
    .endl() + "   #ifdef HAS_TEXTURES"
    .endl() + "       col=texture2D(tex,texCoord);"
    // .endl()+'       col.a=1.0;'
    .endl() + "   #endif"

    .endl() + "   vec4 overCol=vec4(r,g,b,col.a);"
    .endl() + "   col=mix(col,overCol, a);"

    .endl() + "   gl_FragColor = col;"
    .endl() + "}";

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

this.render.onTriggered = function ()
{
    if (!cgl.currentTextureEffect) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    self.trigger.trigger();
};

let uniformR = new CGL.Uniform(shader, "f", "r", 1.0);
let uniformG = new CGL.Uniform(shader, "f", "g", 1.0);
let uniformB = new CGL.Uniform(shader, "f", "b", 1.0);
let uniformA = new CGL.Uniform(shader, "f", "a", 1.0);

this.r.onChange = function ()
{
    uniformR.setValue(self.r.val);
};

this.g.onChange = function ()
{
    uniformG.setValue(self.g.val);
};

this.b.onChange = function ()
{
    uniformB.setValue(self.b.val);
};

this.a.onChange = function ()
{
    uniformA.setValue(self.a.val);
};

this.a.val = 1.0;
this.r.val = 1.0;
this.g.val = 0.0;
this.b.val = 0.0;
