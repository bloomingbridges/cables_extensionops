// Op.apply(this, arguments);
let self = this;
let cgl = this.patch.cgl;

this.name = "MixImage";

this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
this.amount = this.addInPort(new CABLES.Port(this, "amount", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
this.image = this.addInPort(new CABLES.Port(this, "image", CABLES.OP_PORT_TYPE_TEXTURE));
this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));

let shader = new CGL.Shader(cgl, op.name, op);
// this.onLoaded=shader.compile;

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "#ifdef HAS_TEXTURES"
    .endl() + "  IN vec2 texCoord;"
    .endl() + "  uniform sampler2D tex;"
    .endl() + "  uniform sampler2D image;"
    .endl() + "#endif"
    .endl() + "uniform float amount;"
    .endl() + ""
    .endl() + ""
    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 col=vec4(0.0,0.0,0.0,1.0);"
    .endl() + "   #ifdef HAS_TEXTURES"
    .endl() + "       col=texture2D(tex,texCoord)*(1.0-amount);"
    .endl() + "       col+=texture2D(image,texCoord)*amount;"
    .endl() + "   #endif"
    // .endl()+'   col.a=1.0;'
    .endl() + "   gl_FragColor = col;"
    .endl() + "}";

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
let textureDisplaceUniform = new CGL.Uniform(shader, "t", "image", 1);

let amountUniform = new CGL.Uniform(shader, "f", "amount", 1.0);

this.amount.onChange = function ()
{
    amountUniform.setValue(self.amount.val);
};
self.amount.val = 1.0;

this.render.onTriggered = function ()
{
    if (!cgl.currentTextureEffect) return;

    if (self.image.val && self.image.val.tex)
    {
        cgl.pushShader(shader);
        cgl.currentTextureEffect.bind();

        cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

        cgl.setTexture(1, self.image.val.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.image.val.tex );

        cgl.currentTextureEffect.finish();
        cgl.popShader();
    }

    self.trigger.trigger();
};
