op.name = "Spline2d";

let render = op.inTrigger("Render");

let inThickness = op.inValue("Thickness", 1);

let inFill = op.inValueBool("Fill");

let next = op.outTrigger("Next");
let inPoints = op.inArray("points");

let geom = null;
let mesh = null;
let cgl = op.patch.cgl;

let shader = new CGL.Shader(cgl, "line2dmaterial");
shader.setSource(attachments.lines_vert, attachments.lines_frag);
shader.glPrimitive = cgl.gl.TRIANGLE_STRIP;
// shader.glPrimitive=cgl.gl.LINE_STRIP;

let uniLineWidth = new CGL.Uniform(shader, "4f", "u_linewidth", [0, 0, 0, 0]);

let uniShift = new CGL.Uniform(shader, "f", "u_shift", [0, 0, 0, 0]);

render.onTriggered = function ()
{
    if (!shader) return;
    if (!mesh) return;

    cgl.pushShader(shader);

    let thickness = inThickness.get();
    let feather = 0;
    let alpha = 1;

    if (thickness < feather)
    {
        // alpha *= thickness / feather;
        feather = thickness * 2;
        thickness = 0;
    }
    else
    {
        thickness -= feather;
    }

    let delta = thickness / 2;

    uniShift.setValue(1);

    if (inFill.get())
    {
        // shader.glPrimitive=cgl.gl.TRIANGLE_STRIP;
        // uniShift.setValue(1);
        // uniLineWidth.setValue([delta, alpha, 2*delta, alpha]);
        // mesh.render(shader);

        // console.log(delta);

        shader.glPrimitive = cgl.gl.TRIANGLE_STRIP;
        uniShift.setValue(1);
        uniLineWidth.setValue([delta, alpha, delta, alpha]);
        mesh.render(shader);
    }
    else
    {
        uniShift.setValue(0);
        uniLineWidth.setValue([1, 0, 0, 1]);
        shader.glPrimitive = cgl.gl.LINE_STRIP;
        mesh.render(shader);
    }

    next.trigger();
    cgl.popShader();
};

inPoints.onChange = function ()
{
    let pointArr = inPoints.get();
    if (!pointArr) return;

    if (!geom)geom = new CGL.Geometry("Spline2d");

    geom.vertices = pointArr;

    if (!mesh)mesh = new CGL.Mesh(cgl, geom);

    let offsets = [];// new Float32Array(2048);
    for (var i = 0; i < 1024; i++)
    {
        offsets.push(1);
        offsets.push(-1);
    }
    mesh.setAttribute("aOffset", offsets, 1, { "type": cgl.gl.FLOAT });

    let lineElements = [];

    lineElements = inPoints.get();

    // // Initialize triangle buffer.
    let triangleElements = [];
    for (var i = 0; i < lineElements.length; i += 3)
    {
        triangleElements.push(lineElements[i], lineElements[i + 1], lineElements[i + 2]);
        triangleElements.push(lineElements[i], lineElements[i + 1], lineElements[i + 2]);
        triangleElements.push(lineElements[i], lineElements[i + 1], lineElements[i + 2]);
    }
    triangleElements.push(lineElements[i], lineElements[i + 1]);

    let vertAttr = mesh.setAttribute("aPrevPos", triangleElements, 3);

    // op.log('triangleElements',triangleElements.length);
    // mesh.setAttributePointer("aPrevPos","aPrevPos",0,0);
    // mesh.setAttributePointer("aPrevPos","aPrevPos",0,4);
    mesh.setAttributePointer("aPrevPos", "aPos", 0, 12);
    mesh.setAttributePointer("aPrevPos", "aNextPos", 0, 24);

    vertAttr.numItems -= 4;
    mesh._bufVertexAttrib = vertAttr;

    // bufferData(splines[indx],pointArr);
};
