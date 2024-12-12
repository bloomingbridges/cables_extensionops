let render = op.addInPort(new CABLES.Port(op, "render", CABLES.OP_PORT_TYPE_FUNCTION));

let expansion = op.addInPort(new CABLES.Port(op, "expansion", CABLES.OP_PORT_TYPE_VALUE));

const next = op.outTrigger("next");

let cgl = op.patch.cgl;
let currentIndex = -1;

render.onTriggered = doRender;
render.onLinkChanged = reload;

let objects = [];

let tempVec = vec3.create();
let tempMat4 = mat4.create();

let empty = [0, 0, 0];

// var startRotation

function doRender()
{
    if (objects.length === 0)reload();

    for (let i = 0; i < objects.length; i++)
    {
        if (objects[i].transformation)
        {
            cgl.pushModelMatrix();
            // tempMat4 = objects[i].transformation;
            // tempMat4.set(objects[i].transformation);
            tempMat4 = mat4.clone(objects[i].transformation);
            vec3.transformMat4(tempVec, empty, tempMat4);

            vec3.normalize(tempVec, tempVec);
            vec3.mul(tempVec, tempVec, [expansion.get(), expansion.get(), expansion.get()]);

            mat4.translate(tempMat4, tempMat4, tempVec);

            mat4.rotateX(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[0]);
            mat4.rotateY(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[1]);
            mat4.rotateZ(tempMat4, tempMat4, expansion.get() * 0.006 * objects[i].rotation[2]);

            mat4.multiply(cgl.mvMatrix, cgl.mvMatrix, tempMat4);

            objects[i].mesh.render(cgl.getShader());
            next.trigger();
            cgl.popModelMatrix();
        }
    }
}

function addObject(obj)
{
    Math.randomSeed = 5711;
    if (obj.meshes)
    {
        let object = {};

        let jsonMesh = cgl.tempData.currentScene.getValue().meshes[obj.meshes[0]];

        let verts = JSON.parse(JSON.stringify(jsonMesh.vertices));
        let geom = new CGL.Geometry();

        geom.vertices = verts;
        geom.vertexNormals = jsonMesh.normals;
        geom.tangents = jsonMesh.tangents;
        geom.biTangents = jsonMesh.bitangents;

        if (jsonMesh.texturecoords) geom.texCoords = jsonMesh.texturecoords[0];
        geom.verticesIndices = [];
        geom.verticesIndices = [].concat.apply([], jsonMesh.faces);

        object.mesh = new CGL.Mesh(cgl, geom);
        object.transformation = JSON.parse(JSON.stringify(obj.transformation));

        object.rotation = [Math.seededRandom(), Math.seededRandom(), Math.seededRandom()];

        mat4.transpose(object.transformation, object.transformation);
        // console.log(object.transformation);
        objects.push(object);
    }

    if (obj.children)
    {
        for (let i in obj.children)
        {
            addObject(obj.children[i]);
        }
    }
}

function reload()
{
    if (!cgl.tempData.currentScene || !cgl.tempData.currentScene.getValue()) return;
    // var omeshes=cgl.tempData.currentScene.getValue().meshes;

    objects.length = 0;

    console.log(cgl.tempData.currentScene.getValue());

    addObject(cgl.tempData.currentScene.getValue().rootnode);
    console.log("got # objects...", objects.length);

    // if(cgl.tempData.currentScene && cgl.tempData.currentScene.getValue())
    // {
    //     op.uiAttr({warning:''});
    //     op.uiAttr({info:''});
    //     var jsonMesh=null;

    //     for(var i=0;i<cgl.tempData.currentScene.getValue().meshes.length;i++)
    //     {

    //     }

    // }
}
