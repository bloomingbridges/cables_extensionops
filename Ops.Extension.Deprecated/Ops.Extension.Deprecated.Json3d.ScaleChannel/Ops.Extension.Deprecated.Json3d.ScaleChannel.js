const render = op.inTrigger("render");
const trigger = op.outTrigger("trigger");
const outNumKeys = op.outValue("Num Keys");

let channel = this.addInPort(new CABLES.Port(this, "channel"));

let q = quat.create();
let qMat = mat4.create();
let cgl = op.patch.cgl;

let fps = 30;

function dataGetAnimation(data, name)
{
    if (!data || !data.hasOwnProperty("animations")) return false;

    for (let iAnims in data.animations)
    {
        if (data.animations[iAnims].tickspersecond) fps = data.animations[iAnims].tickspersecond;

        for (let iChannels in data.animations[iAnims].channels)
            if (data.animations[iAnims].channels[iChannels].name == name && data.animations[iAnims].channels[iChannels].scalingkeys.length > 0)
                return data.animations[iAnims].channels[iChannels];
    }
    return false;
}

// function dataGetAnimation(data,name)
// {
//     if(!data || !data.hasOwnProperty('animations')) return false;

//     for(var iAnims in data.animations)
//         for(var iChannels in data.animations[iAnims].channels)
//             if(data.animations[iAnims].channels[iChannels].name==name)
//                 return data.animations[iAnims].channels[iChannels];
//     return false;
// }

let animX = null;
let animY = null;
let animZ = null;

function readAnim()
{
    let an = dataGetAnimation(cgl.frameStore.currentScene.getValue(), channel.get());

    if (an)
    {
        animX = new CABLES.Anim();
        animY = new CABLES.Anim();
        animZ = new CABLES.Anim();

        for (let k in an.scalingkeys)
        {
            animX.setValue(an.scalingkeys[k][0], an.scalingkeys[k][1][0]);
            animY.setValue(an.scalingkeys[k][0], an.scalingkeys[k][1][1]);
            animZ.setValue(an.scalingkeys[k][0], an.scalingkeys[k][1][2]);
        }
        outNumKeys.set(an.scalingkeys.length);
    }
}

let vec = vec3.create();

render.onTriggered = function ()
{
    if (!cgl.frameStore.currentScene) return;

    cgl.pushModelMatrix();

    if (animX)
    {
        let time = op.patch.timer.getTime();
        vec[0] = animX.getValue(time);
        vec[1] = animY.getValue(time);
        vec[2] = animZ.getValue(time);

        mat4.scale(cgl.mMatrix, cgl.mMatrix, vec);
    }
    else readAnim();

    trigger.trigger();
    cgl.popModelMatrix();
};
