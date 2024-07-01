// Op.apply(this, arguments);
let self = this;
let cgl = this.patch.cgl;

this.name = "DepthOfField";
this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));
this.depthTex = this.addInPort(new CABLES.Port(this, "depth map", CABLES.OP_PORT_TYPE_TEXTURE));

let tex1 = this.addInPort(new CABLES.Port(this, "tex", CABLES.OP_PORT_TYPE_TEXTURE));
let tex2 = this.addInPort(new CABLES.Port(this, "tex 1", CABLES.OP_PORT_TYPE_TEXTURE));
let tex3 = this.addInPort(new CABLES.Port(this, "tex 2", CABLES.OP_PORT_TYPE_TEXTURE));
let tex4 = this.addInPort(new CABLES.Port(this, "tex 3", CABLES.OP_PORT_TYPE_TEXTURE));

this.farPlane = this.addInPort(new CABLES.Port(this, "farplane", CABLES.OP_PORT_TYPE_VALUE));
this.nearPlane = this.addInPort(new CABLES.Port(this, "nearplane", CABLES.OP_PORT_TYPE_VALUE));

// var distNear=this.addInPort(new CABLES.Port(this,"distance near",CABLES.OP_PORT_TYPE_VALUE,{'display':'range'}));
let distFar = this.addInPort(new CABLES.Port(this, "distance far", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

let stepWidth = this.addInPort(new CABLES.Port(this, "step width", CABLES.OP_PORT_TYPE_VALUE, {}));

let showDistances = this.addInPort(new CABLES.Port(this, "showDistances", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
showDistances.set(false);

let shader = new CGL.Shader(cgl, op.name, op);
// this.onLoaded=shader.compile;

let srcFrag = ""
    .endl() + "precision mediump float;"
    .endl() + "IN vec2 texCoord;"
    .endl() + "uniform sampler2D tex1;"
    .endl() + "uniform sampler2D tex2;"
    .endl() + "uniform sampler2D tex3;"
    .endl() + "uniform sampler2D tex4;"

    .endl() + "uniform sampler2D depthTex;"
    .endl() + "uniform float f;"
    .endl() + "uniform float n;"

    .endl() + "uniform float stepWidth;"

    .endl() + "uniform float distNear;"
    .endl() + "uniform float distFar;"

    .endl() + "float getDepth(vec2 tc)"
    .endl() + "{"
    .endl() + "    float z=texture2D(depthTex,tc).r*1.1;"
    .endl() + "    float c=(2.0*n)/(f+n-z*(f-n));"
    .endl() + "    return c;"
    .endl() + "}"

    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 col=vec4(1.0,0.0,0.0,1.0);"
    .endl() + "   col=texture2D(tex1, texCoord);"
    .endl() + "   float d=getDepth(texCoord);"

// .endl()+'   if(d<0.05) col=texture2D(tex4, texCoord);'
// .endl()+'   else if(d<0.1) col=texture2D(tex2, texCoord);'
// .endl()+'   else if(d<0.7)col=texture2D(tex1, texCoord);'
// .endl()+'   else if(d<0.8) col=texture2D(tex2, texCoord);'
// .endl()+'   else if(d<0.9) col=texture2D(tex3, texCoord);'
// .endl()+'   else col=texture2D(tex4, texCoord);'

    // .endl()+'   if(d>distFar) col=texture2D(tex4, texCoord);'
    .endl() + "   if(d>=distFar)"
    .endl() + "   {"
    .endl() + "       float df=distFar;"

    .endl() + "       float step=(1.0-df)/stepWidth;"
    .endl() + "       float blend=step/2.0;"
    .endl() + "       vec4 newCol;;"

    .endl() + "       if(d>=df && d<df+step)"
    .endl() + "       {"
    .endl() + "           newCol=texture2D(tex2, texCoord);"
    .endl() + "           #ifdef SHOWAREAS".endl() + "newCol.r+=1.0;".endl() + "#endif"
    .endl() + "       }"
    .endl() + "       else"
    .endl() + "       {"
    .endl() + "           df+=step;"
    .endl() + "           if(d>=df && d<df+step*1.2  )"
    .endl() + "           {"
    .endl() + "               col=texture2D(tex2, texCoord);"
    .endl() + "               newCol=texture2D(tex3, texCoord);"
    .endl() + "               #ifdef SHOWAREAS".endl() + "newCol.g+=1.0;".endl() + "#endif"
    .endl() + "           }"
    .endl() + "           else"
    .endl() + "           {"
    .endl() + "               df+=step*1.2;"
    .endl() + "               if(d>=df)"
    .endl() + "               {"
    .endl() + "                   col=texture2D(tex3, texCoord);"
    .endl() + "                   newCol=texture2D(tex4, texCoord);"
    .endl() + "                   #ifdef SHOWAREAS".endl() + "newCol.b+=1.0;".endl() + "#endif"
    .endl() + "               }"
    .endl() + "           }"
    .endl() + "       }"

    .endl() + "       blend=1.0-min(1.0,(d-df)/blend);"
    .endl() + "       col=col*blend+( (1.0-blend)*newCol);"
    .endl() + "   }"

    .endl() + "   col.a=1.0;"

    .endl() + "   gl_FragColor = col;"
    .endl() + "}";

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
let textureUniform = new CGL.Uniform(shader, "t", "tex1", 0);
let depthTexUniform = new CGL.Uniform(shader, "t", "depthTex", 1);

let textureUniform2 = new CGL.Uniform(shader, "t", "tex2", 2);
let textureUniform3 = new CGL.Uniform(shader, "t", "tex3", 3);
let textureUniform4 = new CGL.Uniform(shader, "t", "tex4", 4);

let uniFarplane = new CGL.Uniform(shader, "f", "f", self.farPlane.get());
let uniNearplane = new CGL.Uniform(shader, "f", "n", self.nearPlane.get());

// var uniDistNear=new CGL.Uniform(shader,'f','distNear',distNear.get());
let uniDistFar = new CGL.Uniform(shader, "f", "distFar", distFar.get());
let uniStepWidth = new CGL.Uniform(shader, "f", "stepWidth", stepWidth.get());

this.farPlane.onChange = function ()
{
    uniFarplane.setValue(self.farPlane.val);
};
self.farPlane.val = 5.0;

this.nearPlane.onChange = function ()
{
    uniNearplane.setValue(self.nearPlane.val);
};
self.nearPlane.val = 0.01;

showDistances.onValueChange(
    function ()
    {
        if (showDistances.get()) shader.define("SHOWAREAS");
        else shader.removeDefine("SHOWAREAS");
    });

// distNear.onValueChange(function(){ uniDistNear.setValue(distNear.get()); });
distFar.onValueChange(function () { uniDistFar.setValue(distFar.get()); });
stepWidth.onValueChange(function () { uniStepWidth.setValue(stepWidth.get()); });
// distNear.set(0.2);
distFar.set(0.5);
stepWidth.set(10);

this.render.onTriggered = function ()
{
    if (!cgl.currentTextureEffect) return;
    cgl.pushShader(shader);

    // first pass

    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, tex1.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex1.get().tex );

    cgl.setTexture(1, self.depthTex.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.depthTex.get().tex );

    cgl.setTexture(2, tex2.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex2.get().tex );

    cgl.setTexture(3, tex3.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex3.get().tex );

    cgl.setTexture(4, tex4.get().tex);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, tex4.get().tex );

    cgl.currentTextureEffect.finish();

    cgl.popShader();
    self.trigger.trigger();
};
