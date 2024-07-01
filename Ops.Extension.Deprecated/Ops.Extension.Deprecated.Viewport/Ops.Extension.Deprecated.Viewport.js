let render = op.inTrigger("render");
let trigger = op.outTrigger("trigger");

let ratio = op.addInPort(new CABLES.Port(op, "ratio", CABLES.OP_PORT_TYPE_VALUE, { "display": "dropdown",
    "values":
[
    1, 1.25, 1.3333333333, 1.777777777778, 2, 2.33333333333333, 3, 4, 4.2] }));
ratio.set(1.777777777778);

let cgl = op.patch.cgl;

let w = 1000, h = 1000;

function resize()
{
    let _x = 0;
    let _y = 0;
    let _w = cgl.canvasHeight * ratio.get();
    let _h = cgl.canvasHeight;

    if (_w > cgl.canvasWidth)
    {
        _w = cgl.canvasWidth;
        _h = cgl.canvasWidth / ratio.get();
    }

    if (_w < cgl.canvasWidth) _x = (cgl.canvasWidth - _w) / 2;
    if (_h < cgl.canvasHeight) _y = (cgl.canvasHeight - _h) / 2;

    if (_w != w || _h != h)
    {
        w = _w;
        h = _h;

        let vp = cgl.getViewPort();

        // cgl.setViewPort(0,vp[2]-h,w,h);

        for (let i = 0; i < op.patch.ops.length; i++)
        {
            if (op.patch.ops[i].onResize)op.patch.ops[i].onResize();
        }
    }
}

op.onDelete = function ()
{
    // cgl.gl.disable(cgl.gl.SCISSOR_TEST);
    cgl.resetViewPort();
};

render.onTriggered = function ()
{
    // if(blackBars.get())
    // {
    //     cgl.gl.clearColor(0,0,0,1);
    //     cgl.gl.clear(cgl.gl.COLOR_BUFFER_BIT | cgl.gl.DEPTH_BUFFER_BIT);
    // }

    resize();

    w = Math.round(w + 0.5);
    h = Math.round(h + 0.5);

    let vp = cgl.getViewPort();

    cgl.gl.scissor(0, 0, w, h);
    cgl.setViewPort(0, 0, w, h);
    // cgl.setViewPort(0,vp[2]-h,w,h);

    mat4.perspective(cgl.pMatrix, 45, ratio.get(), 0.1, 1100.0);

    trigger.trigger();
};
