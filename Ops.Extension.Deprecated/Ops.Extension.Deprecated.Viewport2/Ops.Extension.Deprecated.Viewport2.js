const
    render = op.inTrigger("render"),
    ratio = op.inDropDown("ratio", [0.5, 0.5625, 0.75, 1, 1.25, 1.3333333333, 1.777777777778, 2.33333333333333, 3, 4]),
    trigger = op.outTrigger("trigger");

ratio.set(1.777777777778);

const posX = op.inValueSelect("Pos X", ["Left", "Right", "Center"], "Center");

const cgl = op.patch.cgl;

let w = 1000, h = 1000;

function resize()
{
    let _w = cgl.canvasHeight * ratio.get();
    let _h = cgl.canvasHeight;
    let _x = 0;
    let _y = 0;

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

        const vp = cgl.getViewPort();

        // cgl.setViewPort(0,vp[2]-h,w,h);

        for (let i = 0; i < op.patch.ops.length; i++)
        {
            if (op.patch.ops[i].onResize)op.patch.ops[i].onResize();
        }
    }
}

op.onDelete = function ()
{
    cgl.resetViewPort();
};

const prevViewPort = [];

render.onTriggered = function ()
{
    resize();

    w = Math.round(w);
    h = Math.round(h);

    cgl.gl.enable(cgl.gl.SCISSOR_TEST);
    const vp = cgl.getViewPort();
    prevViewPort[0] = vp[0];
    prevViewPort[1] = vp[1];
    prevViewPort[2] = vp[2];
    prevViewPort[3] = vp[3];

    vp[2] = cgl.canvasWidth;
    vp[3] = cgl.canvasHeight;
    vp[0] = 0;
    vp[1] = 0;

    let x = 0;
    if (posX.get() == "Right") x = vp[2] - w;
    if (posX.get() == "Center") x = (vp[2] - w) / 2;

    x = Math.round(x);

    cgl.gl.scissor(x, vp[3] - h, w, h);
    cgl.setViewPort(x, vp[3] - h, w, h);

    mat4.perspective(cgl.pMatrix, 45, ratio.get(), 0.1, 1100.0);

    trigger.trigger();
    cgl.gl.disable(cgl.gl.SCISSOR_TEST);
    cgl.setViewPort(prevViewPort[0], prevViewPort[1], prevViewPort[2], prevViewPort[3]);
};
