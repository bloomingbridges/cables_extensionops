op.name = "SimpleAnimWithoutPingpong";

let exe = op.addInPort(new CABLES.Port(op, "exe", CABLES.OP_PORT_TYPE_FUNCTION));

let reset = op.inTriggerButton("reset");
let rewind = op.inTriggerButton("rewind");

let inStart = op.addInPort(new CABLES.Port(op, "start"));
let inEnd = op.addInPort(new CABLES.Port(op, "end"));
let duration = op.addInPort(new CABLES.Port(op, "duration"));

let loop = op.addInPort(new CABLES.Port(op, "loop", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
let pingpong = op.inValueBool("Ping Pong", true);

let result = op.addOutPort(new CABLES.Port(op, "result"));
let finished = op.addOutPort(new CABLES.Port(op, "finished", CABLES.OP_PORT_TYPE_VALUE));

let resetted = false;
let waitForReset = op.inValueBool("Wait for Reset", false);

let anim = new CABLES.Anim();

anim.createPort(op, "easing", init);

let currentEasing = -1;
function init()
{
    if (pingpong.get())
    {
        if (anim.keys.length != 3)
        {
            console.log("reinit pingpong!");
            anim.keys = [];
            // anim.keys.length=3;
            // console.log("reinit!");
            anim.setValue(0, 0);
            anim.setValue(1, 0);
            anim.setValue(2, 0);
        }
    }
    else
    {
        // if(anim.keys.length!=2)
        {
            // anim.keys.length=2;
            anim.keys = [];
            console.log("reinit no pingpong!");
            anim.setValue(0, 0);
            anim.setValue(1, 0);
        }
    }

    console.log(anim.keys);

    anim.keys[0].time = CABLES.now() / 1000.0;
    anim.keys[0].value = inStart.get();
    if (anim.defaultEasing != currentEasing) anim.keys[0].setEasing(anim.defaultEasing);

    anim.keys[1].time = duration.get() + CABLES.now() / 1000.0;
    anim.keys[1].value = inEnd.get();
    if (anim.defaultEasing != currentEasing) anim.keys[1].setEasing(anim.defaultEasing);

    if (pingpong.get())
    {
        anim.loop = loop.get();
        if (anim.loop)
        {
            anim.keys[2].time = (2.0 * duration.get()) + CABLES.now() / 1000.0;
            anim.keys[2].value = inStart.get();
            if (anim.defaultEasing != currentEasing) anim.keys[2].setEasing(anim.defaultEasing);
        }
        else
        {
            anim.keys[2].time = anim.keys[1].time;
            anim.keys[2].value = anim.keys[1].value;
            if (anim.defaultEasing != currentEasing) anim.keys[2].setEasing(anim.defaultEasing);
        }
    }
    finished.set(false);

    currentEasing = anim.defaultEasing;
}

loop.onChange = init;
reset.onTriggered = function ()
{
    resetted = true;
    init();
};

rewind.onTriggered = function ()
{
    // anim.clear();
    // anim.setValue(CABLES.now()/1000,inStart.get());

    anim.keys[0].time = CABLES.now() / 1000.0;
    anim.keys[0].value = inStart.get();

    anim.keys[1].time = CABLES.now() / 1000.0;
    anim.keys[1].value = inStart.get();

    if (pingpong.get())
    {
        anim.keys[2].time = CABLES.now() / 1000.0;
        anim.keys[2].value = inStart.get();
    }
};

exe.onTriggered = function ()
{
    if (waitForReset.get() && !resetted)
    {
        result.set(inStart.get());
        return;
    }
    let t = CABLES.now() / 1000;
    let v = anim.getValue(t);
    if (anim.hasEnded(t))
    {
        finished.set(true);
    }
    result.set(v);
};

inStart.set(0.0);
inEnd.set(1.0);
duration.set(0.5);
init();

duration.onChange = init;
pingpong.onChange = init;
