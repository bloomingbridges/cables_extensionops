let cgl = op.patch.cgl;
let id = "mod" + Math.floor(Math.random() * 10000);

op.render = op.inTrigger("render");
op.trigger = op.outTrigger("trigger");

let inAmount = op.inValueSlider("Strength", 1.0);

let castShadows = op.inValueBool("Cast Shadow", true);

let shader = null;

let srcHeadVert = ""
    .endl() + "OUT vec4 MOD_positionFromLight;"
    .endl() + "UNI mat4 MOD_lightMVP;"
    .endl();

let srcBodyVert = ""
    .endl() + "MOD_positionFromLight=MOD_lightMVP*(modelMatrix*pos);"
    .endl();

let srcHeadFrag = attachments.shadow_head_frag;
let srcBodyFrag = attachments.shadow_body_frag;

let moduleFrag = null;
let moduleVert = null;

function removeModule()
{
    if (shader && moduleFrag) shader.removeModule(moduleFrag);
    if (shader && moduleVert) shader.removeModule(moduleVert);
    shader = null;
}

op.render.onLinkChanged = removeModule;

op.render.onTriggered = function ()
{
    if (cgl.frameStore.shadow)
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

            moduleFrag = shader.addModule(
                {
                    "title": op.objName,
                    "name": "MODULE_COLOR",
                    "srcHeadFrag": srcHeadFrag,
                    "srcBodyFrag": srcBodyFrag
                }, moduleVert);

            // moduleFrag.scale=new CGL.Uniform(shader,'f',moduleFrag.prefix+'scale',inScale);
            moduleFrag.amount = new CGL.Uniform(shader, "f", moduleFrag.prefix + "amount", inAmount);
            moduleVert.lightMVP = new CGL.Uniform(shader, "m4", moduleVert.prefix + "lightMVP", mat4.create());
            moduleFrag.shadowMap = new CGL.Uniform(shader, "t", moduleFrag.prefix + "shadowMap", 5);
            moduleFrag.strength = new CGL.Uniform(shader, "f", moduleFrag.prefix + "strength", 0.5);
            moduleFrag.showMapArea = new CGL.Uniform(shader, "f", moduleFrag.prefix + "showMapArea", 1);
            // moduleFrag.samples=new CGL.Uniform(shader,'f',moduleFrag.prefix+'smpls',4);
            moduleFrag.bias = new CGL.Uniform(shader, "f", moduleFrag.prefix + "bias", 0);
            moduleFrag.mapsize = new CGL.Uniform(shader, "f", moduleFrag.prefix + "mapsize", 512);
        }

        // console.log(moduleVert.prefix);
        // console.log(cgl.frameStore.lightMVP[2]);

        moduleVert.lightMVP.setValue(cgl.frameStore.lightMVP);

        if (!shader) return;
        let texSlot = moduleVert.num + 5;

        let shadow = cgl.frameStore.shadow;
        moduleFrag.mapsize.setValue(shadow.mapsize);
        moduleFrag.showMapArea.setValue(shadow.showMapArea ? 0.7 : 0);
        moduleFrag.strength.setValue(shadow.strength);
        // moduleFrag.samples.setValue(shadow.samples);
        if (shadow.samples != moduleFrag.samples)
        {
            moduleFrag.samples = shadow.samples;
            shader.define("SHADOW_NUM_SAMPLES", shadow.samples + 0.01);
        }
        moduleFrag.bias.setValue(shadow.bias);

        cgl.setTexture(5, shadow.shadowMap.tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, shadow.shadowMap.tex);
        op.trigger.trigger();
    }

    if (castShadows.get()) op.trigger.trigger();
};
