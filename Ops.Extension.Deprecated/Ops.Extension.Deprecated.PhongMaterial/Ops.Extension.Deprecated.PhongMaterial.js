this.name = "PhongMaterial";
let cgl = this.patch.cgl;

// adapted from:
// http://www.tomdalling.com/blog/modern-opengl/07-more-lighting-ambient-specular-attenuation-gamma/

let render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
let gammeCorrect = this.addInPort(new CABLES.Port(this, "gamma correction", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
const trigger = op.outTrigger("trigger");
let shaderOut = this.addOutPort(new CABLES.Port(this, "shader", CABLES.OP_PORT_TYPE_OBJECT));
shaderOut.ignoreValueSerialize = true;
let MAX_LIGHTS = 16;

gammeCorrect.set(false);
let updateGammeCorrect = function ()
{
    if (gammeCorrect.get()) shader.define("DO_GAMME_CORRECT");
    else shader.removeDefine("DO_GAMME_CORRECT");
};
gammeCorrect.onChange = updateGammeCorrect;

var shader = new CGL.Shader(cgl, "PhongMaterial");
shader.setModules(["MODULE_VERTEX_POSITION", "MODULE_COLOR", "MODULE_NORMAL", "MODULE_BEGIN_FRAG"]);
let srcFrag = attachments.shader_frag;
shader.setSource(attachments.shader_vert, srcFrag);
shaderOut.set(shader);

let lights = [];

let depthTex = new CGL.Uniform(shader, "t", "depthTex", 5);
let uniShadowPass = new CGL.Uniform(shader, "f", "shadowPass", 0);

for (var i = 0; i < MAX_LIGHTS; i++)
{
    let count = i;
    lights[count] = {};
    lights[count].pos = new CGL.Uniform(shader, "3f", "lights[" + count + "].pos", [0, 11, 0]);
    lights[count].target = new CGL.Uniform(shader, "3f", "lights[" + count + "].target", [0, 0, 0]);
    lights[count].color = new CGL.Uniform(shader, "3f", "lights[" + count + "].color", [1, 1, 1]);
    lights[count].attenuation = new CGL.Uniform(shader, "f", "lights[" + count + "].attenuation", 0.1);
    lights[count].type = new CGL.Uniform(shader, "f", "lights[" + count + "].type", 0);
    lights[count].cone = new CGL.Uniform(shader, "f", "lights[" + count + "].cone", 0.8);
    lights[count].mul = new CGL.Uniform(shader, "f", "lights[" + count + "].mul", 1);
    // lights[count].depthMVP=new CGL.Uniform(shader,'m4','lights['+count+'].depthMVP',mat4.create());
}

let shiny = this.addInPort(new CABLES.Port(this, "Shiny", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
shiny.onChange = function ()
{
    if (shiny.get()) shader.define("DO_RENDER_SPECULAR");
    else shader.removeDefine("DO_RENDER_SPECULAR");
};

let shininess = this.addInPort(new CABLES.Port(this, "Shininess", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
shininess.onChange = function ()
{
    let shi = 200 - (shininess.get() * 199);
    // var shi=(shininess.get());
    if (!shininess.uniform) shininess.uniform = new CGL.Uniform(shader, "f", "shininess", shi);
    else shininess.uniform.setValue(shi);
};

shininess.set(0.001);

let normIntensity = this.addInPort(new CABLES.Port(this, "Normal Texture Intensity", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
normIntensity.onChange = function ()
{
    if (!normIntensity.uniform) normIntensity.uniform = new CGL.Uniform(shader, "f", "normalTexIntensity", normIntensity.get());
    else normIntensity.uniform.setValue(normIntensity.get());
};

normIntensity.set(1);

{
    // diffuse color

    let r = this.addInPort(new CABLES.Port(this, "diffuse r", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
    r.onChange = function ()
    {
        if (!r.uniform) r.uniform = new CGL.Uniform(shader, "f", "r", r.get());
        else r.uniform.setValue(r.get());
    };

    let g = this.addInPort(new CABLES.Port(this, "diffuse g", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
    g.onChange = function ()
    {
        if (!g.uniform) g.uniform = new CGL.Uniform(shader, "f", "g", g.get());
        else g.uniform.setValue(g.get());
    };

    let b = this.addInPort(new CABLES.Port(this, "diffuse b", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
    b.onChange = function ()
    {
        if (!b.uniform) b.uniform = new CGL.Uniform(shader, "f", "b", b.get());
        else b.uniform.setValue(b.get());
    };

    let a = this.addInPort(new CABLES.Port(this, "diffuse a", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
    a.onChange = function ()
    {
        if (!a.uniform) a.uniform = new CGL.Uniform(shader, "f", "a", a.get());
        else a.uniform.setValue(a.get());
    };

    r.set(Math.random());
    g.set(Math.random());
    b.set(Math.random());
    a.set(1.0);
}

{
    let colorizeTex = this.addInPort(new CABLES.Port(this, "colorize texture", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
    colorizeTex.onChange = function ()
    {
        if (colorizeTex.get()) shader.define("COLORIZE_TEXTURE");
        else shader.removeDefine("COLORIZE_TEXTURE");
    };
}

{
    // diffuse texture

    var diffuseTexture = this.addInPort(new CABLES.Port(this, "texture", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true, "display": "createOpHelper" }));
    let diffuseTextureUniform = null;
    shader.bindTextures = bindTextures;

    diffuseTexture.onChange = function ()
    {
        if (diffuseTexture.get())
        {
            if (diffuseTextureUniform !== null) return;
            shader.removeUniform("tex");
            shader.define("HAS_TEXTURE_DIFFUSE");
            diffuseTextureUniform = new CGL.Uniform(shader, "t", "tex", 0);
        }
        else
        {
            shader.removeUniform("tex");
            shader.removeDefine("HAS_TEXTURE_DIFFUSE");
            diffuseTextureUniform = null;
        }
    };

    var aoTexture = this.addInPort(new CABLES.Port(this, "AO Texture", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true, "display": "createOpHelper" }));
    let aoTextureUniform = null;
    aoTexture.ignoreValueSerialize = true;
    shader.bindTextures = bindTextures;

    aoTexture.onChange = function ()
    {
        if (aoTexture.get())
        {
            if (aoTextureUniform !== null) return;
            shader.removeUniform("texAo");
            shader.define("HAS_TEXTURE_AO");
            aoTextureUniform = new CGL.Uniform(shader, "t", "texAo", 1);
        }
        else
        {
            shader.removeUniform("texAo");
            shader.removeDefine("HAS_TEXTURE_AO");
            aoTextureUniform = null;
        }
    };

    var specTexture = this.addInPort(new CABLES.Port(this, "Specular Texture", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true, "display": "createOpHelper" }));
    let specTextureUniform = null;

    specTexture.onChange = function ()
    {
        if (specTexture.get())
        {
            if (specTextureUniform !== null) return;
            shader.removeUniform("texSpec");
            shader.define("HAS_TEXTURE_SPEC");
            specTextureUniform = new CGL.Uniform(shader, "t", "texSpec", 2);
        }
        else
        {
            shader.removeUniform("texSpec");
            shader.removeDefine("HAS_TEXTURE_SPEC");
            specTextureUniform = null;
        }
    };

    var normalTexture = this.addInPort(new CABLES.Port(this, "Normal Texture", CABLES.OP_PORT_TYPE_TEXTURE, { "preview": true, "display": "createOpHelper" }));
    let normalTextureUniform = null;

    normalTexture.onChange = function ()
    {
        if (normalTexture.get())
        {
            if (normalTextureUniform !== null) return;
            shader.removeUniform("texNormal");
            shader.define("HAS_TEXTURE_NORMAL");
            normalTextureUniform = new CGL.Uniform(shader, "t", "texNormal", 3);
        }
        else
        {
            shader.removeUniform("texNormal");
            shader.removeDefine("HAS_TEXTURE_NORMAL");
            normalTextureUniform = null;
        }
    };

    let diffuseRepeatX = this.addInPort(new CABLES.Port(this, "diffuseRepeatX", CABLES.OP_PORT_TYPE_VALUE));
    let diffuseRepeatY = this.addInPort(new CABLES.Port(this, "diffuseRepeatY", CABLES.OP_PORT_TYPE_VALUE));
    diffuseRepeatX.set(1);
    diffuseRepeatY.set(1);

    diffuseRepeatX.onChange = function ()
    {
        diffuseRepeatXUniform.setValue(diffuseRepeatX.get());
    };

    diffuseRepeatY.onChange = function ()
    {
        diffuseRepeatYUniform.setValue(diffuseRepeatY.get());
    };

    var diffuseRepeatXUniform = new CGL.Uniform(shader, "f", "diffuseRepeatX", diffuseRepeatX.get());
    var diffuseRepeatYUniform = new CGL.Uniform(shader, "f", "diffuseRepeatY", diffuseRepeatY.get());
}

{
    let texturedPoints = this.addInPort(new CABLES.Port(this, "textured points", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
    texturedPoints.onChange = function ()
    {
        if (texturedPoints.get()) shader.define("TEXTURED_POINTS");
        else shader.removeDefine("TEXTURED_POINTS");
    };
}

{
    // lights

    let numLights = -1;

    var updateLights = function ()
    {
        let count = 0;
        let i = 0;
        let num = 0;
        if (!cgl.tempData.phong || !cgl.tempData.phong.lights)
        {
            num = 0;
        }
        else
        {
            for (i in cgl.tempData.phong.lights)
            {
                num++;
            }
        }
        if (num != numLights)
        {
            numLights = num;
            shader.define("NUM_LIGHTS", "" + Math.max(numLights, 1));
        }

        // console.log('lights...',numLights,num);

        //         if(num!=numLights)
        //         {

        //             if(shader)
        //             {

        //                 console.log('reset lights...');

        //                 count=0;
        //                 // lights.length=0;

        //                 // for(i=0;i<16;i++)
        //                 // {

        //                 //     new CGL.Uniform(shader,'3f','lights['+count+'].pos',[0,11,0]);
        //                 //     new CGL.Uniform(shader,'3f','lights['+count+'].target',[0,0,0]);
        //                 //     new CGL.Uniform(shader,'3f','lights['+count+'].color',[0,0,0]);
        //                 //     new CGL.Uniform(shader,'f','lights['+count+'].attenuation',0);
        //                 //     new CGL.Uniform(shader,'f','lights['+count+'].type',0);
        //                 //     new CGL.Uniform(shader,'f','lights['+count+'].cone',0.8);

        //                 //     count++;
        //                 // }
        //                 // count=0;

        //                 numLights=count;
        //                 shader.define('NUM_LIGHTS',''+Math.max(numLights,1));
        //             }
        //         }

        if (!cgl.tempData.phong || !cgl.tempData.phong.lights)
        {
            // numLights=1;
            // lights[0].pos.setValue([1,2,0]);
            // lights[0].target.setValue([0,0,0]);
            // lights[0].color.setValue([1,1,1]);
            // lights[0].attenuation.setValue(0);
            // lights[0].type.setValue(0);
            // lights[0].cone.setValue(0.8);

        }
        else
        {
            count = 0;
            // console.log(cgl.tempData.phong.lights);
            if (shader)
                for (i in cgl.tempData.phong.lights)
                {
                    lights[count].pos.setValue(cgl.tempData.phong.lights[i].pos);
                    // if(cgl.tempData.phong.lights[i].changed)
                    {
                        cgl.tempData.phong.lights[i].changed = false;
                        if (cgl.tempData.phong.lights[i].target) lights[count].target.setValue(cgl.tempData.phong.lights[i].target);
                        lights[count].color.setValue(cgl.tempData.phong.lights[i].color);
                        lights[count].attenuation.setValue(cgl.tempData.phong.lights[i].attenuation);
                        lights[count].type.setValue(cgl.tempData.phong.lights[i].type);
                        if (cgl.tempData.phong.lights[i].cone) lights[count].cone.setValue(cgl.tempData.phong.lights[i].cone);
                        // if(cgl.tempData.phong.lights[i].depthMVP) lights[count].depthMVP.setValue(cgl.tempData.phong.lights[i].depthMVP);
                        if (cgl.tempData.phong.lights[i].depthTex) lights[count].texDepthTex = cgl.tempData.phong.lights[i].depthTex;

                        lights[count].mul.setValue(cgl.tempData.phong.lights[i].mul);
                    }

                    count++;
                }
            // console.log(count,'lights');
            // cgl.tempData.phong.lights.length=0;
        }
    };
}

var bindTextures = function ()
{
    if (diffuseTexture.get())
    {
        cgl.setTexture(0, diffuseTexture.get().tex);
        // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, diffuseTexture.get().tex);
    }

    if (aoTexture.get())
    {
        cgl.setTexture(1, aoTexture.get().tex);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, aoTexture.get().tex);
    }

    if (specTexture.get())
    {
        cgl.setTexture(2, specTexture.get().tex);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, specTexture.get().tex);
    }

    if (normalTexture.get())
    {
        cgl.setTexture(3, normalTexture.get().tex);
        cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, normalTexture.get().tex);
    }

    uniShadowPass.setValue(0);
    if (cgl.tempData.phong && cgl.tempData.phong.lights)
        for (i in cgl.tempData.phong.lights)
        {
            if (cgl.tempData.phong.lights[i].shadowPass == 1.0)uniShadowPass.setValue(1);
        }

    // for(var i in lights)
    // {
    // if(lights[i].type.getValue()==1.0)
    // {
    // cgl.setTexture(5);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, lights[i].texDepthTex);
    // }
    // }

    // cgl.setTexture(5);
    // cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, null);

    // if(self.textureOpacity.get())
    // {
    //     cgl.setTexture(1);
    //     cgl.gl.bindTexture(cgl.gl.TEXTURE_2D, self.textureOpacity.val.tex);
    // }
};

let doRender = function ()
{
    if (!shader) return;

    cgl.pushShader(shader);
    updateLights();
    shader.bindTextures();
    trigger.trigger();
    cgl.popShader();
};

shader.bindTextures = bindTextures;
shader.define("NUM_LIGHTS", "1");
updateGammeCorrect();

render.onTriggered = doRender;

doRender();
