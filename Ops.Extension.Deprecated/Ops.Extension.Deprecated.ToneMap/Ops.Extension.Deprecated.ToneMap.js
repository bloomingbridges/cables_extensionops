op.name = "ToneMap";

let render = op.inTrigger("Render");
let trigger = op.outTrigger("Trigger");
let method = op.inValueSelect("Method", ["Linear", "Reinhard", "Hejl Dawson", "Uncharted"], "Linear");
let exposure = op.inValue("Exposure", 3);
let cgl = op.patch.cgl;

let shader = new CGL.Shader(cgl, op.name, op);

method.onChange = function ()
{
    if (method.get() == "Hejl Dawson") shader.define("METHOD_HEJLDAWSON");
    else shader.removeDefine("METHOD_HEJLDAWSON");

    if (method.get() == "Uncharted") shader.define("METHOD_UNCHARTED");
    else shader.removeDefine("METHOD_UNCHARTED");

    if (method.get() == "Reinhard") shader.define("METHOD_REINHARD");
    else shader.removeDefine("METHOD_REINHARD");

    if (method.get() === "" || method.get() == "Linear") shader.define("METHOD_LINEAR");
    else shader.removeDefine("METHOD_LINEAR");
};

let srcFrag = ""
    .endl() + "precision highp float;"
    .endl() + "IN vec2 texCoord;"
    .endl() + "uniform sampler2D tex;"
    .endl() + "uniform sampler2D text;"
    .endl() + "uniform float exposure;"

    .endl() + "#ifdef METHOD_LINEAR"
    .endl() + "   void main()"
    .endl() + "   {"
    .endl() + "      vec4 col = texture2D(text, texCoord );"
    .endl() + "     gl_FragColor = vec4( pow(col.rgb*exposure,vec3(1.0/2.2)) ,col.a);"
    .endl() + "   }"
    .endl() + "#endif"

    .endl() + "#ifdef METHOD_REINHARD"
    .endl() + "   void main()"
    .endl() + "   {"
    .endl() + "      vec4 col = texture2D(text, texCoord );"
    .endl() + "      col.rgb*=exposure;"
    .endl() + "      col.rgb = col.rgb/(1.0+col.rgb);"
    .endl() + "      gl_FragColor = vec4( pow(col.rgb,vec3(1.0/2.2)) ,col.a);"
    .endl() + "   }"
    .endl() + "#endif"

    .endl() + "#ifdef METHOD_HEJLDAWSON"
    .endl() + "   void main()"
    .endl() + "   {"
    .endl() + "       vec4 col = texture2D(text, texCoord );"
    .endl() + "       col.rgb*=exposure;"
    .endl() + "       vec3 x=max(vec3(0.0),col.rgb-0.004);"
    .endl() + "       gl_FragColor = vec4( (x*(6.2*x+.5))/(x*(6.2*x+1.7)+0.06) ,col.a);"
    .endl() + "   }"
    .endl() + "#endif"

    .endl() + "#ifdef METHOD_UNCHARTED"
    .endl() + "   float A = 0.15;"
    .endl() + "   float B = 0.50;"
    .endl() + "   float C = 0.10;"
    .endl() + "   float D = 0.20;"
    .endl() + "   float E = 0.02;"
    .endl() + "   float F = 0.30;"
    .endl() + "   float W = 11.2;"

    .endl() + "   vec3 uncharted2Tonemap(vec3 x)"
    .endl() + "   {"
    .endl() + "     return ((x*(A*x+C*B)+D*E)/(x*(A*x+B)+D*F))-E/F;"
    .endl() + "   }"

    .endl() + "   void main()"
    .endl() + "   {"
    .endl() + "      vec4 col = texture2D(text, texCoord );"
    .endl() + "      col.rgb*=exposure;"

    .endl() + "     float exposureBias = 2.0;"
    .endl() + "     vec3 curr = uncharted2Tonemap(exposureBias*col.rgb);"

    .endl() + "     vec3 whiteScale = 1.0/uncharted2Tonemap(vec3(W));"
    .endl() + "     vec3 color = curr*whiteScale;"

    .endl() + "     vec3 retColor = pow(color,vec3(1.0/2.2));"
    .endl() + "     gl_FragColor = vec4(retColor,col.a);"
    .endl() + "   }"
    .endl() + "#endif";

shader.setSource(shader.getDefaultVertexShader(), srcFrag);
shader.define("METHOD_LINEAR");
let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);

let uniExposure = new CGL.Uniform(shader, "f", "exposure", exposure);

render.onTriggered = function ()
{
    if (!cgl.currentTextureEffect) return;

    cgl.pushShader(shader);

    cgl.currentTextureEffect.bind();
    cgl.setTexture(0, cgl.currentTextureEffect.getCurrentSourceTexture().tex);

    cgl.currentTextureEffect.finish();

    cgl.popShader();
    trigger.trigger();
};
