let render = op.inTrigger("render");
let trigger = op.outTrigger("trigger");

let uniformSelect = op.inValueSelect("Uniform");
let unival = op.inValue("Value", 0);
let cgl = op.patch.cgl;
let uniformInputs = [];
let uniformTextures = [];
let shader = null;

render.onTriggered = doRender;

let needsUpdate = true;
let uniform = null;
let needsUniformSetup = true;

function setupUniform()
{
    if (shader && shader.getProgram())
    {
        uniform = new CGL.Uniform(shader, "f", uniformSelect.get(), unival);
        needsUniformSetup = false;
    }
}

uniformSelect.onChange = function ()
{
    needsUniformSetup = true;
};

function doRender()
{
    if (!cgl.getShader()) return;
    if (needsUpdate)
    {
        updateShader(cgl.getShader());
    }
    if (needsUniformSetup)
    {
        setupUniform();
    }
    trigger.trigger();
}

function updateShader(theShader)
{
    if (shader != theShader && theShader.getProgram())
    {
        shader = theShader;
    }

    let uniformNames = [];

    if (!shader) return;
    needsUpdate = false;
    op.log("shader update!");

    // shader.glslVersion=0;
    // shader.bindTextures=bindTextures.bind(this);

    // shader.setSource(vertexShader.get(),fragmentShader.get());
    // shader.compile();

    let activeUniforms = cgl.gl.getProgramParameter(shader.getProgram(), cgl.gl.ACTIVE_UNIFORMS);

    let i = 0;
    let countTexture = 0;
    for (i = 0; i < activeUniforms; i++)
    {
        let uniform = cgl.gl.getActiveUniform(shader.getProgram(), i);

        // if(!hasUniformInput(uniform.name))
        {
            if (uniform.type == 0x1406)
            {
                console.log(uniform.name);
                uniformNames.push(uniform.name);
                // var newInput=op.inValue(uniform.name,0);
                // newInput.onChange=function(p)
                // {
                //     p.uniform.needsUpdate=true;
                //     p.uniform.setValue(p.get());
                // };

                // uniformInputs.push(newInput);
                // newInput.uniform=new CGL.Uniform(shader,'f',uniform.name,newInput);
            }
            // else
            // if(uniform.type==0x8B5E )
            // {
            //     var newInputTex=op.inObject(uniform.name);
            //     newInputTex.uniform=new CGL.Uniform(shader,'t',uniform.name,3+countTexture);
            //     uniformTextures.push(newInputTex);
            //     countTexture++;
            // }
            else
            {
                console.log("unknown uniform type", uniform.type, uniform);
            }
        }
    }

    // for(i=0;i<uniformInputs.length;i++)
    // {
    //     uniformInputs[i].uniform.needsUpdate=true;
    // }

    uniformNames.sort(function (a, b)
    {
        if (a < b) return -1;
        if (a > b) return 1;
        return 0;
    });

    uniformSelect.setUiAttribs({ "values": uniformNames });

    // outShader.set(null);
    // outShader.set(shader);
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
