let render = op.addInPort(new CABLES.Port(op, "render", CABLES.OP_PORT_TYPE_FUNCTION));
let shaderId = op.addInPort(new CABLES.Port(op, "ShaderToy ID", CABLES.OP_PORT_TYPE_VALUE, { "type": "string" }));

let trigger = op.outTrigger("trigger");
let result = op.addOutPort(new CABLES.Port(op, "Result", CABLES.OP_PORT_TYPE_OBJECT));
let shaderOut = op.addOutPort(new CABLES.Port(op, "shader", CABLES.OP_PORT_TYPE_OBJECT));

let cgl = op.patch.cgl;
let appKey = "Nt8KwM";
shaderId.set("lsGSDG");
// ldtGDr
shaderOut.ignoreValueSerialize = true;
shaderId.onChange = setId;
let uniTime = null;
let uniTime2 = null;
let startTime = Date.now();
setId();

render.onTriggered = function ()
{
    if (shader && uniTime)
    {
        uniTime.setValue((Date.now() - startTime) / 1000);
        uniTime2.setValue((Date.now() - startTime) / 1000);
        cgl.pushShader(shader);
        trigger.trigger();
        cgl.popShader();
    }
};

var shader = null;

function setId()
{
    CABLES.ajax(
        "https://www.shadertoy.com/api/v1/shaders/" + shaderId.get() + "?key=" + appKey,
        function (err, _data, xhr)
        {
            try
            {
                let data = JSON.parse(_data);

                if (data.Shader && data.Shader.renderpass)
                {
                    let code = ""

                        .endl() + "IN vec2 texCoord;"

                        .endl() + "UNI float iGlobalTime;"
                        .endl() + "UNI float iTime;"
                        .endl() + "vec2 iResolution=vec2(1.0,1.0);"
                        .endl();
                    code += data.Shader.renderpass[0].code;
                    code.endl();
                    code += "void main()"
                        .endl() + "{"
                        .endl() + "   vec4 col=vec4(0.0,0.0,1.0,1.0);"
                        .endl() + "   mainImage(col, texCoord*1.0);"
                        .endl() + "   gl_FragColor=col;"
                        .endl() + "}"
                        .endl();

                    shader = new CGL.Shader(cgl, "ShaderToyMaterial");
                    uniTime = new CGL.Uniform(shader, "f", "iGlobalTime", 0);
                    uniTime2 = new CGL.Uniform(shader, "f", "iTime", 0);
                    shader.setSource(shader.getDefaultVertexShader(), code);
                    shader.compile();
                    shaderOut.set(shader);
                }

                result.set(data);
            }
            catch (e)
            {
                console.log("could not parse shadertoy response...");
                console.error(e);
            }
        });
}
