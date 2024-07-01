let p = op.patch;
op.name = "set var array";
let exe = op.addInPort(new CABLES.Port(op, "exe", CABLES.OP_PORT_TYPE_FUNCTION));

let val = op.addInPort(new CABLES.Port(op, "val", CABLES.OP_PORT_TYPE_ARRAY, {}));
let varname = op.addInPort(new CABLES.Port(op, "name", CABLES.OP_PORT_TYPE_VALUE, { "type": "string" }));

function updateVar()
{
    if (!p.vars)p.vars = [];
    p.vars[varname.get()] = val.get();
}

varname.onValueChange(updateVar);
val.onValueChange(updateVar);
exe.onTriggered = updateVar;
