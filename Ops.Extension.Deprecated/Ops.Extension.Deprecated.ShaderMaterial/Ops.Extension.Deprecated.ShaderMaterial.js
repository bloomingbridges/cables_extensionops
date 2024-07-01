let render = op.inTrigger("render");
let fragmentShader = op.addInPort(new CABLES.Port(op, "fragment", CABLES.OP_PORT_TYPE_VALUE, { "display": "editor", "editorSyntax": "glsl" }));
let vertexShader = op.addInPort(new CABLES.Port(op, "vertex", CABLES.OP_PORT_TYPE_VALUE, { "display": "editor", "editorSyntax": "glsl" }));

let trigger = op.outTrigger("trigger");
let outShader = op.outObject("Shader");
let cgl = op.patch.cgl;
let uniformInputs = [];
let uniformTextures = [];

let shader = new CGL.Shader(cgl, "shaderMaterial");
shader.glslVersion = 0;

fragmentShader.set(shader.getDefaultFragmentShader());
vertexShader.set(shader.getDefaultVertexShader());

fragmentShader.onChange = updateLater;
vertexShader.onChange = updateLater;
render.onTriggered = doRender;

let needsUpdate = true;

function updateLater()
{
    needsUpdate = true;
    updateShader();
}

function doRender()
{
    if (needsUpdate)updateShader();
    cgl.pushShader(shader);

    bindTextures();
    trigger.trigger();
    cgl.popShader();
}

function bindTextures()
{
    for (let i = 0; i < uniformTextures.length; i++)
    {
        cgl.setTexture(0 + i + 3);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, uniformTextures[i].get().tex);
    }
}

function hasUniformInput(name)
{
    let i = 0;
    for (i = 0; i < uniformInputs.length; i++) if (uniformInputs[i].name == name) return true;
    for (i = 0; i < uniformTextures.length; i++) if (uniformTextures[i].name == name) return true;
    return false;
}

function updateShader()
{
    needsUpdate = false;

    // shader.glslVersion=0;
    shader.bindTextures = bindTextures;

    shader.setSource(vertexShader.get(), fragmentShader.get());
    shader.compile();

    let activeUniforms = cgl.gl.getProgramParameter(shader.getProgram(), cgl.gl.ACTIVE_UNIFORMS);

    let i = 0;
    let countTexture = 0;
    for (i = 0; i < activeUniforms; i++)
    {
        let uniform = cgl.gl.getActiveUniform(shader.getProgram(), i);

        if (!hasUniformInput(uniform.name))
        {
            if (uniform.type == 0x1406)
            {
                var newInput = op.inValue(uniform.name, newInput, 0);
                newInput.onChange = function (p)
                {
                    // console.log('change',p.get());
                    p.uniform.needsUpdate = true;
                    p.uniform.setValue(p.get());
                };

                uniformInputs.push(newInput);
                newInput.uniform = new CGL.Uniform(shader, "f", uniform.name, newInput);
            }
            else
            if (uniform.type == 0x8B5E)
            {
                let newInputTex = op.inObject(uniform.name);
                newInputTex.uniform = new CGL.Uniform(shader, "t", uniform.name, 3 + countTexture);
                uniformTextures.push(newInputTex);
                countTexture++;
            }
            else
            {
                console.log("unknown uniform type", uniform.type, uniform);
            }
        }
    }

    for (i = 0; i < uniformInputs.length; i++)
    {
        uniformInputs[i].uniform.needsUpdate = true;
    }

    op.refreshParams();

    outShader.set(null);
    outShader.set(shader);
}

// 0x8B50: 'FLOAT_VEC2',
// 0x8B51: 'FLOAT_VEC3',
// 0x8B52: 'FLOAT_VEC4',
// 0x8B53: 'INT_VEC2',
// 0x8B54: 'INT_VEC3',
// 0x8B55: 'INT_VEC4',
// 0x8B56: 'BOOL',
// 0x8B57: 'BOOL_VEC2',
// 0x8B58: 'BOOL_VEC3',
// 0x8B59: 'BOOL_VEC4',
// 0x8B5A: 'FLOAT_MAT2',
// 0x8B5B: 'FLOAT_MAT3',
// 0x8B5C: 'FLOAT_MAT4',
// 0x8B5E: 'SAMPLER_2D',
// 0x8B60: 'SAMPLER_CUBE',
// 0x1400: 'BYTE',
// 0x1401: 'UNSIGNED_BYTE',
// 0x1402: 'SHORT',
// 0x1403: 'UNSIGNED_SHORT',
// 0x1404: 'INT',
// 0x1405: 'UNSIGNED_INT',
// 0x1406: 'FLOAT'

updateShader();
