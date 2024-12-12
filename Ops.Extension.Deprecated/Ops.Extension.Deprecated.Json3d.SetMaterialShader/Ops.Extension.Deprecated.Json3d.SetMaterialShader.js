const exe = op.inTrigger("exe");
const key = op.inValueString("Key");
const next = op.outTrigger("trigger");

let cgl = op.patch.cgl;
let mat = null;

exe.onTriggered = function ()
{
    if (!cgl.tempData || !cgl.tempData.currentScene || !cgl.tempData.currentScene.replaceMaterials)
    {
        next.trigger();
        return;
    }

    let replMats = cgl.tempData.currentScene.replaceMaterials;
    if (replMats)
    {
        if (!mat)
        {
            mat = replMats[key.get()];
        }

        if (mat)
        {
            cgl.pushShader(mat);
            if (mat.bindTextures) mat.bindTextures();
            next.trigger();
            cgl.popShader();
        }
    }
};
