this.name = "fp material";
let cgl = this.patch.cgl;

let render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
const trigger = op.outTrigger("trigger");
let texture = this.addInPort(new CABLES.Port(this, "texture", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true, "display": "createOpHelper" }));

let srcVert = ""
    .endl() + "IN float attrVertIndex;"
    .endl() + "IN vec2 attrTexCoord;"
    .endl() + "UNI mat4 projMatrix;"
    .endl() + "UNI mat4 mvMatrix;"
    .endl() + "IN vec3 vPosition;"
    .endl() + "OUT float num;"
    .endl() + "OUT vec2 texCoord;"

    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   texCoord=attrTexCoord;"
    .endl() + "   num=attrVertIndex;"
    .endl() + "   gl_Position = projMatrix * mvMatrix * vec4(vPosition,  1.0);"
    .endl() + "}";

let srcFrag = ""
    .endl() + "precision highp float;"

    .endl() + "IN vec2 texCoord;"
    .endl() + "UNI sampler2D tex;"
    .endl() + "IN float num;"
    .endl() + "UNI float numVertices;"

    .endl() + "void main()"
    .endl() + "{"
    .endl() + "   vec4 col=texture2D(tex,vec2(texCoord.x,(1.0-texCoord.y)))/2.0;"
    .endl() + "   col.a=1.0;"
    .endl() + "   gl_FragColor = col;"
    .endl() + "}";

let shader = new CGL.Shader(cgl, "fp preview material");
shader.setSource(srcVert, srcFrag);

let doRender = function ()
{
    cgl.pushShader(shader);

    if (texture.get())
    {
        cgl.setTexture(0, texture.get().tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, texture.get().tex);
    }

    trigger.trigger();
    cgl.popShader();
};

let textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
texture.onChange = function ()
{
    if (texture.get())
    {
        if (textureUniform !== null) return;
        shader.removeUniform("tex");
        // shader.define('HAS_TEXTURE_DIFFUSE');
        textureUniform = new CGL.Uniform(shader, "t", "tex", 0);
    }
};

render.onTriggered = doRender;

doRender();
