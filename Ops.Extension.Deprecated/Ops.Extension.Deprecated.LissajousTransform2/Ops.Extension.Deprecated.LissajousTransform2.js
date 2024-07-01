op.name = "lissajous transform";

let render = op.inTrigger("render");
let x = op.addInPort(new CABLES.Port(op, "x", CABLES.OP_PORT_TYPE_VALUE));
let y = op.addInPort(new CABLES.Port(op, "y", CABLES.OP_PORT_TYPE_VALUE));
let z = op.addInPort(new CABLES.Port(op, "z", CABLES.OP_PORT_TYPE_VALUE));
let pointSkip = op.addInPort(new CABLES.Port(op, "skip", CABLES.OP_PORT_TYPE_VALUE));
let numPoints = op.addInPort(new CABLES.Port(op, "num points", CABLES.OP_PORT_TYPE_VALUE));

let mulX = op.addInPort(new CABLES.Port(op, "mul x", CABLES.OP_PORT_TYPE_VALUE));
let mulY = op.addInPort(new CABLES.Port(op, "mul y", CABLES.OP_PORT_TYPE_VALUE));
let mulZ = op.addInPort(new CABLES.Port(op, "mul z", CABLES.OP_PORT_TYPE_VALUE));

x.set(2);
y.set(4);
z.set(8);

mulX.set(1);
mulY.set(1);
mulZ.set(1);
pointSkip.set(40);
numPoints.set(3200);

let cgl = op.patch.cgl;
let trigger = op.outTrigger("trigger");
let vec = vec3.create();

function doRender()
{
    let step = parseFloat(pointSkip.get()) || 1;
    if (step < 1)step = 1;

    for (let i = 0; i < numPoints.get(); i += step)
    {
        vec3.set(
            vec,
            mulX.get() * Math.sin((i * x.get()) * 0.001),
            mulY.get() * Math.cos((i * y.get()) * 0.001),
            mulZ.get() * Math.sin((i * z.get()) * 0.001)
        );

        cgl.pushModelMatrix();

        mat4.translate(cgl.mvMatrix, cgl.mvMatrix, vec);
        trigger.trigger();

        cgl.popModelMatrix();
    }
}

render.onTriggered = doRender;
