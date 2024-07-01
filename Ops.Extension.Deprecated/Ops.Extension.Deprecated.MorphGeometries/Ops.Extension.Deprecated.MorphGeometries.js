const
    render = op.inTrigger("Render"),
    next = op.outTrigger("Next"),
    inGeomA = op.inObject("Geometry 1"),
    inGeomB = op.inObject("Geometry 2"),
    inFade = op.inValueSlider("Fade"),
    inNormals = op.inValueBool("Normals");

let cgl = op.patch.cgl;
let shader = null;
let mesh = null;
let geom = null;
let module = null;
let fadeUni = null;
let needsRebuild = true;
let needsRebuildShader = true;

op.onDelete = render.onLinkChanged = removeModule;
inGeomA.onChange =
    inGeomB.onChange =
    inNormals.onChange = rebuildShaderLater;

let srcBodyVert = attachments.morph_geometries_vert;
let srcHeadVert = ""
    .endl() + "IN vec3 MOD_targetPosition;"
    .endl() + "IN vec3 MOD_targetNormal;"
    .endl() + "IN vec3 MOD_targetTangent;"
    .endl() + "IN vec3 MOD_targetBiTangent;"
    .endl() + "UNI float MOD_fade;"
    .endl();

function removeModule()
{
    if (shader && module)
    {
        shader.removeModule(module);
        shader = null;
    }
}

render.onTriggered = function ()
{
    if (cgl.getShader() != shader || needsRebuildShader) rebuildShader();
    if (needsRebuild) rebuild();
    if (!mesh) return;

    mesh.render(cgl.getShader());
    next.trigger();
};

function rebuildShader()
{
    if (shader) removeModule();
    shader = cgl.getShader();
    module = shader.addModule(
        {
            "priority": -11,
            "title": op.objName,
            "name": "MODULE_VERTEX_POSITION",
            "srcHeadVert": srcHeadVert,
            "srcBodyVert": srcBodyVert
        });

    fadeUni = new CGL.Uniform(shader, "f", module.prefix + "fade", inFade);

    shader.toggleDefine("MORPH_NORMALS", inNormals.get());

    needsRebuild = true;
    needsRebuildShader = false;
}

function rebuildLater()
{
    needsRebuild = true;
}

function rebuildShaderLater()
{
    needsRebuildShader = true;
    needsRebuild = true;
}

function rebuild()
{
    if (inGeomB.get() && inGeomA.get() && module)
    {
        if (geom)
        {
            geom.clear();
            geom = null;
        }
        if (mesh)mesh.dispose();
        geom = inGeomA.get().copy();
        mesh = new CGL.Mesh(cgl, geom);
        mesh.addVertexNumbers = true;
        mesh.addAttribute(module.prefix + "targetPosition", inGeomB.get().vertices, 3);

        if (inNormals.get())
        {
            mesh.addAttribute(module.prefix + "targetNormal", inGeomB.get().vertexNormals, 3);
            mesh.addAttribute(module.prefix + "targetTangent", inGeomB.get().tangents, 3);
            mesh.addAttribute(module.prefix + "targetBiTangent", inGeomB.get().biTangents, 3);
        }

        needsRebuild = false;
    }
    else
    {
        if (mesh)mesh.dispose();
        mesh = null;
        needsRebuild = true;
    }
}
