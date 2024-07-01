let exec = op.inTrigger("Render");
let inBlend = op.inValueSelect("Blendmode",
    [
        "None",
        "Normal",
        "Add",
        "Subtract",
        "Multiply"
    ], "Normal");
let inPremul = op.inValueBool("Premultiplied");

let next = op.outTrigger("Next");

let cgl = op.patch.cgl;

let BLEND_NONE = 0;
let BLEND_NORMAL = 1;
let BLEND_ADD = 2;
let BLEND_SUB = 3;
let BLEND_MUL = 4;

let blendMode = 0;

inBlend.onChange = update;
update();

function update()
{
    if (inBlend.get() == "Normal")blendMode = BLEND_NORMAL;
    else if (inBlend.get() == "Add")blendMode = BLEND_ADD;
    else if (inBlend.get() == "Subtract")blendMode = BLEND_SUB;
    else if (inBlend.get() == "Multiply")blendMode = BLEND_MUL;
    else blendMode = BLEND_NONE;
}

exec.onTriggered = function ()
{
    if (blendMode == BLEND_ADD)
    {
        if (inPremul.get())
        {
            cgl.gl.blendEquationSeparate(cgl.gl.FUNC_ADD, cgl.gl.FUNC_ADD);
            cgl.gl.blendFuncSeparate(cgl.gl.ONE, cgl.gl.ONE, cgl.gl.ONE, cgl.gl.ONE);
        }
        else
        {
            cgl.gl.blendEquation(cgl.gl.FUNC_ADD);
            cgl.gl.blendFunc(cgl.gl.SRC_ALPHA, cgl.gl.ONE);
        }
    }

    if (blendMode == BLEND_SUB)
    {
        if (inPremul.get())
        {
            cgl.gl.blendEquationSeparate(cgl.gl.FUNC_ADD, cgl.gl.FUNC_ADD);
            cgl.gl.blendFuncSeparate(cgl.gl.ZERO, cgl.gl.ZERO, cgl.gl.ONE_MINUS_SRC_COLOR, cgl.gl.ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            cgl.gl.blendEquation(cgl.gl.FUNC_ADD);
            cgl.gl.blendFunc(cgl.gl.ZERO, cgl.gl.ONE_MINUS_SRC_COLOR);
        }
    }

    if (blendMode == BLEND_MUL)
    {
        if (inPremul.get())
        {
            cgl.gl.blendEquationSeparate(cgl.gl.FUNC_ADD, cgl.gl.FUNC_ADD);
            cgl.gl.blendFuncSeparate(cgl.gl.ZERO, cgl.gl.SRC_COLOR, cgl.gl.ZERO, cgl.gl.SRC_ALPHA);
        }
        else
        {
            cgl.gl.blendEquation(cgl.gl.FUNC_ADD);
            cgl.gl.blendFunc(cgl.gl.ZERO, cgl.gl.SRC_COLOR);
        }
    }

    if (blendMode == BLEND_NORMAL)
    {
        if (inPremul.get())
        {
            cgl.gl.blendEquationSeparate(cgl.gl.FUNC_ADD, cgl.gl.FUNC_ADD);
            cgl.gl.blendFuncSeparate(cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA, cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);
        }
        else
        {
            cgl.gl.blendEquationSeparate(cgl.gl.FUNC_ADD, cgl.gl.FUNC_ADD);
            cgl.gl.blendFuncSeparate(cgl.gl.SRC_ALPHA, cgl.gl.ONE_MINUS_SRC_ALPHA, cgl.gl.ONE, cgl.gl.ONE_MINUS_SRC_ALPHA);
        }
    }

    if (blendMode == BLEND_NONE)
    {
        cgl.gl.disable(cgl.gl.BLEND);
    }

    next.trigger();
};
