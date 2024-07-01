let exe = op.addInPort(new CABLES.Port(op, "exe", CABLES.OP_PORT_TYPE_FUNCTION));

let transformations = op.inArray("array 3x");
let geom = op.addInPort(new CABLES.Port(op, "geom", CABLES.OP_PORT_TYPE_OBJECT));
geom.ignoreValueSerialize = true;

let matrices = [];

let mod = null;
let mesh = null;
let shader = null;
let uniDoInstancing = null;
let recalc = true;
let cgl = op.patch.cgl;

geom.onChange = reset;
exe.onTriggered = doRender;
exe.onLinkChanged = removeModule;

let srcHeadVert = ""
    .endl() + "uniform float do_instancing;"

    .endl() + "#ifdef INSTANCING"
    .endl() + "   IN mat4 instMat;"
    .endl() + "#endif";

let srcBodyVert = ""
    .endl() + "#ifdef INSTANCING"
    .endl() + "   if( do_instancing==1.0 )"
    .endl() + "   {"
    .endl() + "       mMatrix*=instMat;"

    .endl() + "   }"
    .endl() + "#endif"
    .endl();

function reset()
{
    if (shader)shader.removeDefine("INSTANCING");
    recalc = true;
    if (!geom.get())
    {
        mesh = null;
        return;
    }
    mesh = new CGL.Mesh(cgl, geom.get());
    removeModule();
}

// geom.onChange=function()
// {

// };

function removeModule()
{
    if (shader && mod)
    {
        shader.removeDefine("INSTANCING");
        shader.removeModule(mod);
        shader = null;
    }
}

let matrixArray = new Float32Array(1);
let m = mat4.create();

transformations.onChange = function ()
{
    recalc = true;
};

function setupArray()
{
    let transforms = transformations.get();
    if (!transforms) return;
    let num = Math.floor(transforms.length / 3);

    if (matrixArray.length != num * 16)
    {
        matrixArray = new Float32Array(num * 16);
    }

    for (let i = 0; i < num; i++)
    {
        mat4.identity(m);
        mat4.translate(m, m,
            [
                transforms[i * 3],
                transforms[i * 3 + 1],
                transforms[i * 3 + 2]
            ]);

        for (let a = 0; a < 16; a++)
        {
            matrixArray[i * 16 + a] = m[a];
        }
    }

    mesh.numInstances = num;
    mesh.addAttribute("instMat", matrixArray, 16);
    recalc = false;
}

function doRender()
{
    if (!mesh) return;
    if (recalc)setupArray();
    if (matrixArray.length <= 1) return;

    if (cgl.getShader() && cgl.getShader() != shader)
    {
        if (shader && mod)
        {
            shader.removeModule(mod);
            shader = null;
        }

        shader = cgl.getShader();
        if (!shader.hasDefine("INSTANCING"))
        {
            mod = shader.addModule(
                {
                    "name": "MODULE_VERTEX_POSITION",
                    "srcHeadVert": srcHeadVert,
                    "srcBodyVert": srcBodyVert
                });

            shader.define("INSTANCING");
            uniDoInstancing = new CGL.Uniform(shader, "f", "do_instancing", 0);

            // updateTransforms();
        }
        else
        {
            uniDoInstancing = shader.getUniform("do_instancing");
        }
    }

    if (shader)
    {
        uniDoInstancing.setValue(1);
        mesh.render(shader);
        uniDoInstancing.setValue(0);
    }
}
