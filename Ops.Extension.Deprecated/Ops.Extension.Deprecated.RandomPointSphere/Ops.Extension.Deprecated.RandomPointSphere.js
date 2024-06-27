const
    exe = op.inTrigger("Render"),
    num = op.inValueInt("Num", 1000),
    size = op.inValue("Size", 1),
    seed = op.inValue("Seed", 0),
    distRand = op.inValueSlider("Distance Random", 0),
    distrib = op.inValueSelect("Distribution", ["Uniform", "Poles", "Half"]),
    inDoRender = op.inBool("Draw", true),
    outTrigger = op.outTrigger("Trigger out");

let outGeom = op.outObject("Geometry");
const outArr = op.outArray("Points");

let cgl = op.patch.cgl;
let mesh = null;

seed.onChange = reset;
num.onChange = reset;
size.onChange = reset;
distrib.onChange = reset;
distRand.onChange = reset;

exe.onTriggered = doRender;

reset();

function doRender()
{
    outTrigger.trigger();
    if (inDoRender.get() && mesh) mesh.render(cgl.getShader());
}

function reset()
{
    let geom = new CGL.Geometry();
    let verts = [];
    let texCoords = [];
    let vertColors = [];

    let n = Math.max(0, Math.round(num.get()));

    verts.length = n * 3;
    texCoords.length = n * 2;
    vertColors.length = n * 3;

    Math.randomSeed = seed.get();

    let sizeMul = size.get();
    let rndq = quat.create();
    let tempv = vec3.create();

    let dist = 0;
    if (distrib.get() == "Poles")dist = 1;
    if (distrib.get() == "Half")dist = 2;

    let dRand = distRand.get();

    for (let i = 0; i < num.get(); i++)
    {
        if (dist == 1 || dist == 2)
        {
            rndq[0] = Math.seededRandom();
            rndq[1] = Math.seededRandom();
            rndq[2] = Math.seededRandom();
            rndq[3] = Math.seededRandom();
        }
        else
        {
            rndq[0] = Math.seededRandom() * 2.0 - 1.0;
            rndq[1] = Math.seededRandom() * 2.0 - 1.0;
            rndq[2] = Math.seededRandom() * 2.0 - 1.0;
            rndq[3] = Math.seededRandom() * 2.0 - 1.0;
        }

        quat.normalize(rndq, rndq);

        if (dist == 2)
        {
            tempv[0] = size.get();
        }
        else
        {
            if (i % 2 === 0) tempv[0] = -size.get();
            else tempv[0] = size.get();
        }

        tempv[1] = 0;
        tempv[2] = 0;

        if (dRand !== 0) tempv[0] -= Math.random() * dRand;

        vec3.transformQuat(tempv, tempv, rndq);
        verts[i * 3] = tempv[0];
        verts[i * 3 + 1] = tempv[1];
        verts[i * 3 + 2] = tempv[2];

        texCoords[i * 2] = Math.seededRandom();
        texCoords[i * 2 + 1] = Math.seededRandom();
    }
    geom.vertices = verts;
    geom.vertColors = vertColors;
    geom.texCoords = texCoords;
    outGeom.set(null);
    outGeom.set(geom);
    outArr.set(null);
    outArr.set(verts);

    // if(mesh) mesh.addVertexNumbers=true;
    // if(mesh) mesh.setGeom(geom);
    if (mesh)mesh.dispose();
    mesh = new CGL.Mesh(cgl, geom, { "glPrimitive": cgl.gl.POINTS });
    mesh.addVertexNumbers = true;
    // mesh.setGeom(geom);
}
