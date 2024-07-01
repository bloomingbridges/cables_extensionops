let cgl = op.patch.cgl;

op.render = op.inTrigger("render");
op.trigger = op.outTrigger("trigger");

const inStrength = op.inValue("Amount", 1),
    inStart = op.inValue("Start Index", 0),
    inWidth = op.inValue("Width", 20),
    inHasEnd = op.inValueBool("Ending", true),
    inTransDist = op.inValue("Transition Distance", 50),
    inPosX = op.inValue("Pos X", 0),
    inPosY = op.inValue("Pos Y", 0),
    inPosZ = op.inValue("Pos Z", 0),
    inRotX = op.inValue("Rot X", 0),
    inRotY = op.inValue("Rot Y", 0),
    inRotZ = op.inValue("Rot Z", 0),
    inScaleX = op.inValue("Scale X", 1),
    inScaleY = op.inValue("Scale Y", 1),
    inScaleZ = op.inValue("Scale Z", 1);

let shader = null;

// var srcHeadVert=attachments.perlin_instposition_vert||'';

let srcBodyVert = attachments.transform_instanced_vert || "";
let srcHeadVert = attachments.transform_instanced_head_vert || "";

//     .endl()+'instanceIndexFrag=instanceIndex;'
//     .endl();

// .endl()+'IN float instanceIndex;'
// .endl()+'OUT float instanceIndexFrag;'
// .endl();

let moduleVert = null;
let moduleFrag = null;
function removeModule()
{
    if (shader && moduleVert) shader.removeModule(moduleVert);
    shader = null;
}

op.render.onLinkChanged = removeModule;

inHasEnd.onChange = updateEnding;

function updateEnding()
{
    if (shader)
        if (inHasEnd.get())shader.define(moduleVert.prefix + "HAS_ENDING");
        else shader.removeDefine(moduleVert.prefix + "HAS_ENDING");
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

        op.uniRotX = new CGL.Uniform(shader, "f", moduleVert.prefix + "rotX", inRotX);
        op.uniRotY = new CGL.Uniform(shader, "f", moduleVert.prefix + "rotY", inRotY);
        op.uniRotZ = new CGL.Uniform(shader, "f", moduleVert.prefix + "rotZ", inRotZ);

        op.uniposX = new CGL.Uniform(shader, "f", moduleVert.prefix + "posX", inPosX);
        op.uniposY = new CGL.Uniform(shader, "f", moduleVert.prefix + "posY", inPosY);
        op.uniposZ = new CGL.Uniform(shader, "f", moduleVert.prefix + "posZ", inPosZ);

        op.uniscaleX = new CGL.Uniform(shader, "f", moduleVert.prefix + "scaleX", inScaleX);
        op.uniscaleY = new CGL.Uniform(shader, "f", moduleVert.prefix + "scaleY", inScaleY);
        op.uniscaleZ = new CGL.Uniform(shader, "f", moduleVert.prefix + "scaleZ", inScaleZ);

        op.uniStart = new CGL.Uniform(shader, "f", moduleVert.prefix + "start", inStart);
        op.uniEnd = new CGL.Uniform(shader, "f", moduleVert.prefix + "width", inWidth);
        op.uniTrans = new CGL.Uniform(shader, "f", moduleVert.prefix + "transDist", inTransDist);

        inStrength.uniform = new CGL.Uniform(shader, "f", moduleVert.prefix + "strength", inStrength);
        updateEnding();
    }

    if (!shader) return;

    op.trigger.trigger();
};
