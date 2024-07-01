let exe = op.inTrigger("Render");
let geom = op.inObject("Geometry");

let num = op.inValueInt("Count", 1000);
let size = op.inValue("size", 10);
let spread = op.inValue("Spread", 0);

let shape = op.inValueSelect("Shape", ["Cube", "Sphere", "Torus"]);

let seed = op.inValue("random seed", 1);

let scaleX = op.inValueSlider("Scale X", 1);
let scaleY = op.inValueSlider("Scale Y", 1);
let scaleZ = op.inValueSlider("Scale Z", 1);

let rotX = op.inValueSlider("Rotate X", 1);
let rotY = op.inValueSlider("Rotate Y", 1);
let rotZ = op.inValueSlider("Rotate Z", 1);

spread.onChange =
    shape.onChange =
    num.onChange =
    size.onChange =
    geom.onChange =
    scaleX.onChange =
    scaleZ.onChange =
    scaleY.onChange =
    rotY.onChange =
    rotX.onChange =
    rotZ.onChange =
    geom.onChange =
    seed.onChange = prepareLater;

let randoms = [];
let randomsRot = [];

let cgl = op.patch.cgl;

let anim = op.inValue("time");

let transVec = vec3.create();

let transformations = [];
let mod = null;
let mesh = null;
let shader = null;
let uniTime = null;
exe.onLinkChanged = removeModule;
exe.onTriggered = doRender;
let needsPrepare = true;

function prepareLater()
{
    needsPrepare = true;
}

function prepare()
{
    if (geom.get())
    {
        reset();

        let num = transformations.length;
        let arrs = [].concat.apply([], transformations);
        let matrices = new Float32Array(arrs);

        mesh = new CGL.Mesh(cgl, geom.get());
        mesh.numInstances = num;
        mesh.setAttribute("instMat", matrices, 16);
        needsPrepare = false;
    }
}

function removeModule()
{
    if (shader)
    {
        shader.removeModule(mod);
        shader.removeDefine("INSTANCING");
    }
    shader = null;
}

function doRender()
{
    if (needsPrepare || !mesh) prepare();

    if (mesh)
    {
        if (cgl.getShader() && cgl.getShader() != shader)
        {
            if (shader && mod)
            {
                removeModule();
                shader = null;
            }

            shader = cgl.getShader();

            mod = shader.addModule(
                {
                    "title": op.objName,
                    "name": "MODULE_VERTEX_POSITION",
                    "srcHeadVert": attachments.rinstancer_head_vert,
                    "srcBodyVert": attachments.rinstancer_body_vert
                });

            shader.define("INSTANCING");

            if (mod)uniTime = new CGL.Uniform(shader, "f", mod.prefix + "_time", anim);
        }

        mesh.render(shader);
    }
}

function reset()
{
    let i = 0;
    randoms.length = 0;
    randomsRot.length = 0;

    Math.randomSeed = seed.get();

    if (shape.get() == "Sphere")
    {
        let tempv = vec3.create();
        for (i = 0; i < num.get(); i++)
        {
            let rndq = [Math.seededRandom(), Math.seededRandom(), Math.seededRandom(), Math.seededRandom()];
            quat.normalize(rndq, rndq);

            if (i % 2 === 0) tempv[0] = -size.get() / 2;
            else tempv[0] = size.get() / 2;

            tempv[0] *= Math.seededRandom();
            tempv[1] = 0;
            tempv[2] = 0;

            vec3.transformQuat(tempv, tempv, rndq);
            randoms.push(vec3.fromValues(tempv[0], tempv[1], tempv[2]));
        }
    }
    else
    if (shape.get() == "Torus")
    {
        for (i = 0; i < num.get(); i++)
        {
            let rad = (Math.seededRandom() * 360) * CGL.DEG2RAD;
            let posx = Math.cos(rad) * size.get();
            let posy = Math.sin(rad) * size.get();
            let posz = 0;

            randoms.push(vec3.fromValues(posx, posy, posz));
        }
    }
    else
    {
        // CUBE
        for (i = 0; i < num.get(); i++)
        {
            randoms.push(vec3.fromValues(
                scaleX.get() * ((Math.seededRandom()) * size.get() - (size.get() / 2)),
                scaleY.get() * ((Math.seededRandom()) * size.get() - (size.get() / 2)),
                scaleZ.get() * ((Math.seededRandom()) * size.get() - (size.get() / 2))
            ));
        }
    }

    for (i = 0; i < num.get(); i++)
    {
        randomsRot.push(vec3.fromValues(
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotX.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotY.get(),
            Math.seededRandom() * 360 * CGL.DEG2RAD * rotZ.get()
        ));
    }

    transformations.length = 0;

    let m = mat4.create();
    for (i = 0; i < randoms.length; i++)
    {
        randoms[i][0] += (2 * (0.5 - Math.seededRandom())) * spread.get();
        randoms[i][1] += (2 * (0.5 - Math.seededRandom())) * spread.get();
        randoms[i][2] += (2 * (0.5 - Math.seededRandom())) * spread.get();

        mat4.identity(m);

        mat4.translate(m, m, randoms[i]);

        let vScale = vec3.create();
        let sc = Math.seededRandom();
        vec3.set(vScale, sc, sc, sc);
        mat4.scale(m, m, vScale);

        mat4.rotateX(m, m, randomsRot[i][0]);
        mat4.rotateY(m, m, randomsRot[i][1]);
        mat4.rotateZ(m, m, randomsRot[i][2]);

        transformations.push(Array.prototype.slice.call(m));
    }
}
