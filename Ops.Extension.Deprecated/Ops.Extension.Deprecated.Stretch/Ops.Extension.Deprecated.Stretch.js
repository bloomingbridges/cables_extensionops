let cgl = op.patch.cgl;

op.render = op.inTrigger("render");
op.trigger = op.outTrigger("trigger");

let axis = op.inValueSelect("Axis", ["X", "Y", "Z"], "X");

let min = op.inValue("min", 1);
let max = op.inValue("max", 0);

let inUpdateNormals = op.inValueBool("Update Normals");

let srcHeadVert = attachments.stretchHead_vert || "";
let srcBodyVert = attachments.stretch_vert || "";

let shader = null;
let moduleVert = null;
op.render.onLinkChanged = removeModule;

function removeModule()
{
    if (shader && moduleVert) shader.removeModule(moduleVert);
    shader = null;
}

inUpdateNormals.onChange = updateNormals;
axis.onChange = updateAxis;

function updateNormals()
{
    if (shader)
        if (inUpdateNormals.get()) shader.define("RESTRICT_UPDATENORMALS");
        else shader.removeDefine("RESTRICT_UPDATENORMALS");
}

function updateAxis()
{
    if (shader)
    {
        shader.removeDefine("RESTRICT_AXIS_X");
        shader.removeDefine("RESTRICT_AXIS_Y");
        shader.removeDefine("RESTRICT_AXIS_Z");

        if (axis.get() == "X") shader.define("RESTRICT_AXIS_X");
        if (axis.get() == "Y") shader.define("RESTRICT_AXIS_Y");
        if (axis.get() == "Z") shader.define("RESTRICT_AXIS_Z");
    }
}

op.render.onTriggered = function ()
{
    if (!cgl.getShader())
    {
        op.trigger.trigger();
        return;
    }

    if (cgl.getShader() != shader)
    {
        if (shader) removeModule();
        shader = cgl.getShader();

        moduleVert = shader.addModule(
            {
                "title": op.objName,
                "name": "MODULE_VERTEX_POSITION",
                "srcHeadVert": srcHeadVert,
                "srcBodyVert": srcBodyVert
            });

        min.uniform = new CGL.Uniform(shader, "f", moduleVert.prefix + "min", min);
        max.uniform = new CGL.Uniform(shader, "f", moduleVert.prefix + "max", max);
        updateAxis();
        updateNormals();
    }

    if (!shader) return;

    op.trigger.trigger();
};
