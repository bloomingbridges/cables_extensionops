// use this: https://dl.dropboxusercontent.com/u/11542084/ssao_nohalo_1.2

let self = this;
let cgl = this.patch.cgl;

this.name = "SSAO";

this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
this.farPlane = this.addInPort(new CABLES.Port(this, "farplane", CABLES.OP_PORT_TYPE_VALUE));
this.nearPlane = this.addInPort(new CABLES.Port(this, "nearplane", CABLES.OP_PORT_TYPE_VALUE));
this.amount = this.addInPort(new CABLES.Port(this, "amount", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
this.dist = this.addInPort(new CABLES.Port(this, "dist", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

this.image = this.addInPort(new CABLES.Port(this, "image", CABLES.OP_PORT_TYPE_TEXTURE));
this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));

let shader = new CGL.Shader(cgl, op.name, op);
// this.onLoaded=shader.compile;

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "#ifdef HAS_TEXTURES"
    .endl() + "  IN vec2 texCoord;"
    .endl() + "  uniform sampler2D image;"
    .endl() + "  uniform sampler2D colTex;"
    .endl() + "#endif"
    .endl() + "uniform float amount;"
    .endl() + "uniform float dist;"

    .endl() + "uniform float near;"
    .endl() + "uniform float far;"
    .endl() + ""

    .endl() + "#define samples 8.0"
    .endl() + "#define rings 4.0"
    .endl() + "#define PI    3.14159265"
    .endl() + ""

    .endl() + "float readDepth(vec2 coord)"
    .endl() + "{"
    .endl() + "    return (2.0 * near) / (far + near - texture2D(image, coord ).x * (far-near));"
    .endl() + "}"

    .endl() + "float compareDepths( in float depth1, in float depth2 )"
    .endl() + "{"
    .endl() + "    float aoCap = 1.9;"
    .endl() + "    float aoMultiplier =20.0;"
    .endl() + "    float depthTolerance = 0.001;"
    .endl() + "    float aorange = 100.0;"// units in space the AO effect extends to (this gets divided by the camera far range
    .endl() + "    float diff = sqrt(clamp(1.0-(depth1-depth2) / (aorange/(far-near)),0.0,1.0));"
    .endl() + "    float ao = min(aoCap,max(0.0,depth1-depth2-depthTolerance) * aoMultiplier) * diff;"
    .endl() + "    return ao;"
    .endl() + "}"

    .endl() + "void main()"
    .endl() + "{"

    .endl() + "float d;float ao=1.0;    float depth = readDepth(texCoord);"

    .endl() + "float w=1.0/1280.0;"
    .endl() + "float h=1.0/720.0;"

    .endl() + "float pw;"
    .endl() + "float ph;"

    .endl() + "float s=0.0;"
    .endl() + "float fade = 1.0;"

    .endl() + "for (float i = 0.0 ; i < rings; i += 1.0)"
    .endl() + "{"
    .endl() + "   fade *= 0.5;"
    .endl() + "   for (float j = 0.0 ; j < samples; j += 1.0)"
    .endl() + "   {"
    .endl() + "       float step = PI*2.0 / (samples*i);"
    .endl() + "       float jj=j*2.0*i*2.0;"

    .endl() + "       pw = (cos(jj*step)*i);"
    .endl() + "       ph = (sin(jj*step)*i)*2.0;"

    .endl() + "       pw*=dist;"
    .endl() + "       ph*=dist;"

    .endl() + "       d = readDepth( vec2(texCoord.s+pw*w,texCoord.t+ph*h));"

    // .endl()+'       if(d<0.9999){'
    .endl() + "           ao += compareDepths(depth,d)*fade;"
    .endl() + "           s += 1.0*fade*1.0;"
    // .endl()+'       } else ao=0.0;'
    .endl() + "   }"
    .endl() + "}"

    .endl() + "ao /= s;"
    .endl() + "ao = 1.0-ao;"
    // .endl()+'ao *= amount;'
    .endl() + "ao = 1.0-ao;"

    .endl() + "vec4 col=vec4(ao,ao,ao,1.0);"
    // .endl()+'col.r=0.0;'
    .endl() + "col=texture2D(colTex,texCoord)-col*amount;"
    .endl() + "       col.a=1.0;"

    .endl() + "   gl_FragColor = col;"
    .endl() + "}";

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
let textureUniform = new CGL.Uniform(shader, "t", "image", 0);
let textureColorUniform = new CGL.Uniform(shader, "t", "colTex", 1);

let uniFarplane = new CGL.Uniform(shader, "f", "far", 1.0);
let uniNearplane = new CGL.Uniform(shader, "f", "near", 1.0);
let uniAmount = new CGL.Uniform(shader, "f", "amount", 1.0);
let uniDist = new CGL.Uniform(shader, "f", "dist", 1.0);

this.dist.onChange = function ()
{
    uniDist.setValue(self.dist.val * 5);
};
self.dist.val = 0.2;

this.amount.onChange = function ()
{
    uniAmount.setValue(self.amount.val);
};
self.amount.val = 1.0;

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

this.render.onTriggered = function ()
{
    if (!cgl.currentTextureEffect) return;

    if (self.image.val && self.image.val.tex)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, self.image.val.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

        cgl.setTexture(1, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

        cgl.currentTextureEffect.finish();
        cgl.popShader();
    }

    self.trigger.trigger();
};
