const render = op.inTrigger("render");
const inShader = op.inObject("Shader");
const blendMode = CGL.TextureEffect.AddBlendSelect(op, "Blend Mode", "normal");
const amount = op.inValueSlider("Amount", 0.25);
const trigger = op.outTrigger("trigger");

const cgl = op.patch.cgl;
let shader = new CGL.Shader(cgl, op.name, op);

let textureUniform = null;
let amountUniform = null;

inShader.onChange = function ()
{
    shader = inShader.get();
    if (!shader) return;

    shader.setSource(shader.srcVert, shader.srcFrag);
    textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

    amountUniform = new CGL.Uniform(shader, "f", "amount", amount);
};

CGL.TextureEffect.setupBlending(op, shader, blendMode, amount);

render.onTriggered = function ()
{
    if (!shader) return;
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;

    cgl.pushShader(shader);
    cgl.currentTextureEffect.bind();

    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    if (shader.bindTextures)shader.bindTextures();

    cgl.currentTextureEffect.finish();
    cgl.popShader();

    trigger.trigger();
};
