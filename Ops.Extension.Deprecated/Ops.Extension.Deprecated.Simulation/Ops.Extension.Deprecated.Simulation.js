op.name = "VectorField";

let render = op.inTrigger("Render");
let next = op.outTrigger("Next");
let shader = null;

function removeModule()
{
    if (shader && module)
    {
        shader.removeModule(module);
        shader = null;
    }
}

let cgl = op.patch.cgl;
let uniTime, uniTexture;

render.onLinkChanged = removeModule;

// simulation...

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "uniform sampler2D tex;"
    .endl() + "uniform sampler2D texField;"
    .endl() + "uniform float time;"
    .endl() + "IN vec2 texCoord;"

    .endl() + "float random(vec2 co)"
    .endl() + "{"
    .endl() + "    return fract(sin(dot(co.xy ,vec2(time+12.9898,78.233))) * 43758.5453);"
    .endl() + "}"

    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 old = texture2D( tex, texCoord );"

    .endl() + "   float c =random((0.2323)*gl_FragCoord.xy);"
    .endl() + "   float c1=random((2.3455)*gl_FragCoord.xy);"
    .endl() + "   float c2=random((1.7623)*gl_FragCoord.xy);"

    .endl() + "   vec4 field = texture2D( tex, vec2(c,c1) )*0.01;"

    .endl() + "   if(time!=0.0)"
    .endl() + "   {"
    .endl() + "       c =old.r;"
    .endl() + "       c1=old.g;"
    .endl() + "       c2=old.b;"
    .endl() + "   }"

// .endl()+'   if(c>15.0)c=random((0.2323)*gl_FragCoord.xy)*0.5;'

    .endl() + "   gl_FragColor = vec4( mod(c+field.r,3.0), mod(c1+field.g,3.0) , mod(c2+field.b*0.001,3.0), 1.0);"
    .endl() + "}";

let simTexture = new CGL.Texture(cgl, { "isFloatingPointTexture": true });
simTexture.setSize(1024, 1024);

let shaderSim = new CGL.Shader(cgl, "sim");
shaderSim.setSource(shaderSim.getDefaultVertexShader(), srcFrag);
// tex.set(simTexture);
let texSimUni = new CGL.Uniform(shaderSim, "t", "tex", 0);
let texFieldUni = new CGL.Uniform(shaderSim, "t", "texField", 1);
let uniTime2 = new CGL.Uniform(shaderSim, "f", "time", 0);
let startTime = CABLES.now() / 1000;

let effect = new CGL.TextureEffect(cgl, { "fp": true });

effect.setSourceTexture(simTexture);
let firstTime = true;

let outTex = op.outObject("simtex", simTexture);

// draw

let srcHeadVert = ""
    .endl() + "UNI float {{mod}}_time;"
    .endl() + "UNI sampler2D {{mod}}_texture;"

    .endl();

let srcBodyVert = ""

    .endl() + "   float size=1024.0;"
    .endl() + "   float tx = mod(attrVertIndex,size)/size;"
    .endl() + "   float ty = float( int((attrVertIndex/size)) )/size;"
// .endl()+'   vec2 vec2(tx,ty);'

    .endl() + "vec4 {{mod}}_col=texture2D( {{mod}}_texture, vec2(tx,ty) );"

    .endl() + "pos.xyz={{mod}}_col.xyz;"
    // .endl()+'pos.z=0.0;'
    .endl();

render.onTriggered = function ()
{
    // if(!textureField.get())return;
    // simulation shader

    let t = effect.getCurrentSourceTexture().tex;
    cgl.pushShader(shaderSim);
    effect.bind();

    cgl.setTexture(0, t);
    // cgl.setTexture(1,textureField.get().tex);

    effect.finish();
    cgl.popShader();

    cgl.resetViewPort();

    if (cgl.getShader() != shader)
    {
        if (shader) removeModule();
        shader = cgl.getShader();
        module = shader.addModule(
            {
                "name": "MODULE_VERTEX_POSITION",
                "srcHeadVert": srcHeadVert,
                "srcBodyVert": srcBodyVert
            });

        uniTime = new CGL.Uniform(shader, "f", module.prefix + "_time", 0);
        uniTexture = new CGL.Uniform(shader, "t", module.prefix + "_texture", 4);
        // setDefines();
    }

    // if(texture.get())
    {
        cgl.setTexture(4, t);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, t);
    }

    uniTime2.setValue(op.patch.freeTimer.get());
    uniTime.setValue(op.patch.freeTimer.get());
    next.trigger();
};
