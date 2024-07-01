const
    render = op.inTrigger("render"),
    trigger = op.outTrigger("trigger"),
    depth = op.inTexture("depth texture"),
    zNear = op.inValue("Frustum Near", 0.1),
    zFar = op.inValue("Frustum Far", 20),
    samples = op.inValueInt("Samples", 4),
    aoRadius = op.inValue("Ao Radius", 3),
    aoClamp = op.inValueSlider("Ao Clamp", 0.25),
    lumInfluence = op.inValueSlider("Luminance Influence", 0.7),
    noise = op.inValueBool("Enable noise", false),
    noiseamount = op.inValueFloat("Noise amount", 0.0008);

const cgl = op.patch.cgl;
const shader = new CGL.Shader(cgl, op.name, op);

shader.setSource(shader.getDefaultVertexShader(), attachments.ssao_frag);
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
let textureAlpha = new CGL.Uniform(shader, "t", "texDepth", 1);

aoRadius.uniform = new CGL.Uniform(shader, "f", "radius", aoRadius);
aoClamp.uniform = new CGL.Uniform(shader, "f", "aoclamp", aoClamp);
lumInfluence.uniform = new CGL.Uniform(shader, "f", "lumInfluence", lumInfluence);
// samples.uniform=new CGL.Uniform(shader,'i','samples',samples);

zNear.uniform = new CGL.Uniform(shader, "f", "znear", zNear);
zFar.uniform = new CGL.Uniform(shader, "f", "zfar", zFar);

noiseamount.uniform = new CGL.Uniform(shader, "f", "noiseamount", noiseamount);

noise.onChange = function ()
{
    shader.toggleDefine("NOISE", noise.get());
};

samples.onChange = function ()
{
    shader.define("SAMPLES", samples.get());
};

let uniWidth = new CGL.Uniform(shader, "f", "width", 1024);
let uniHeight = new CGL.Uniform(shader, "f", "height", 512);

shader.define("SAMPLES", samples.get());
aoClamp.uniform = new CGL.Uniform(shader, "f", "aoclamp", aoClamp);

render.onTriggered = function ()
{
    if (!CGL.TextureEffect.checkOpInEffect(op)) return;
    if (!depth.get()) return;

    uniWidth.setValue(depth.get().width);
    uniHeight.setValue(depth.get().height);

    cgl.pushShader(shader);

    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    if (depth.get() && depth.get().tex)
    {
        cgl.setTexture(1, depth.get().tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, depth.get().tex );
    }

    cgl.currentTextureEffect.finish();

    cgl.popShader();
    trigger.trigger();
};
