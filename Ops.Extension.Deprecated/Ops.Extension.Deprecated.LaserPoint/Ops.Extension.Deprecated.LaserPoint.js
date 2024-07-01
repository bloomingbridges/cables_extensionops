// Op.apply(this, arguments);
let self = this;
let cgl = self.patch.cgl;

this.name = "laserpoint";
this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));

let x = this.addInPort(new CABLES.Port(this, "x", CABLES.OP_PORT_TYPE_VALUE, { }));
let y = this.addInPort(new CABLES.Port(this, "y", CABLES.OP_PORT_TYPE_VALUE, { }));
let z = this.addInPort(new CABLES.Port(this, "z", CABLES.OP_PORT_TYPE_VALUE, { }));

let doSetColor = this.addInPort(new CABLES.Port(this, "set color", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
doSetColor.set(true);

let numPoints = this.addInPort(new CABLES.Port(this, "num points", CABLES.OP_PORT_TYPE_VALUE));

this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));
numPoints.set(1);
{
    // diffuse color

    var r = this.addInPort(new CABLES.Port(this, "diffuse r", CABLES.OP_PORT_TYPE_VALUE, { "display": "range", "colorPick": "true" }));
    var g = this.addInPort(new CABLES.Port(this, "diffuse g", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
    var b = this.addInPort(new CABLES.Port(this, "diffuse b", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));
    let a = this.addInPort(new CABLES.Port(this, "diffuse a", CABLES.OP_PORT_TYPE_VALUE, { "display": "range" }));

    r.set(Math.random());
    g.set(Math.random());
    b.set(Math.random());
}

let vec = vec3.create();
this.render.onTriggered = function ()
{
    if (!cgl.frameStore.SplinePoints) return;

    vec3.set(vec, x.get(), y.get(), z.get());
    cgl.pushModelMatrix();
    mat4.translate(cgl.mvMatrix, cgl.mvMatrix, vec);

    let pos = [0, 0, 0];
    vec3.transformMat4(pos, pos, cgl.mvMatrix);

    let obj = { "x": pos[0], "y": pos[1], "z": pos[2], "num": numPoints.get() };

    if (doSetColor.get())
    {
        obj.colR = r.get();
        obj.colG = g.get();
        obj.colB = b.get();
    }

    cgl.frameStore.laserPoints.push(obj);

    self.trigger.trigger();

    cgl.popModelMatrix();
};
