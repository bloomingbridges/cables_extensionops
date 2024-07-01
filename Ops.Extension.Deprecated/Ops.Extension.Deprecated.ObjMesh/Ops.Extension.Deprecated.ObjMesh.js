// Op.apply(this, arguments);
let self = this;
let cgl = this.patch.cgl;

this.name = "OBJ Mesh";
this.render = this.addInPort(new CABLES.Port(this, "render", CABLES.OP_PORT_TYPE_FUNCTION));
this.trigger = this.addOutPort(new CABLES.Port(this, "trigger", CABLES.OP_PORT_TYPE_FUNCTION));
this.calcNormals = this.addInPort(new CABLES.Port(this, "calcNormals", CABLES.OP_PORT_TYPE_VALUE, { "display": "dropdown", "values": ["no", "face", "vertex"] }));
this.calcNormals.val = "no";

this.filename = this.addInPort(new CABLES.Port(this, "file", CABLES.OP_PORT_TYPE_VALUE, { "display": "file", "type": "string", "filter": "mesh" }));

this.mesh = null;

this.render.onTriggered = function ()
{
    if (self.mesh) self.mesh.render(cgl.getShader());

    self.trigger.trigger();
};

// ----------------------------------------------------------------

function ajaxRequest(url, callback)
{
    console.log("deptecated? ajaxrequest!");
    let request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function (e)
    {
        callback(e.target.response);
    };
    request.send();
}

let reloadObj = function ()
{
    let loadingId = cgl.patch.loading.start("obj mesh", self.filename.get(), op);

    if (self.filename.val === 0)
    {
        cgl.patch.loading.finished(loadingId);
        return;
    }

    ajaxRequest(self.patch.getFilePath(self.filename.val), function (response)
    {
        console.log("parse obj");
        let r = parseOBJ(response);

        unwrap = function (ind, crd, cpi)
        {
            let ncrd = new Array(Math.floor(ind.length / 3) * cpi);
            for (let i = 0; i < ind.length; i++)
            {
                for (let j = 0; j < cpi; j++)
                {
                    ncrd[i * cpi + j] = crd[ind[i] * cpi + j];
                }
            }
            return ncrd;
        };

        let l = r.verticesIndices.length;
        r.vertices = unwrap(r.verticesIndices, r.vertices, 3);
        r.texCoords = unwrap(r.texCoordsIndices || [], r.texCoords, 2);
        r.vertexNormals = unwrap(r.vertexNormalIndices, r.vertexNormals, 3);
        r.verticesIndices = [];
        for (let i = 0; i < l; i++) r.verticesIndices.push(i);

        if (self.calcNormals.val == "face")r.calcNormals();
        else if (self.calcNormals.val == "vertex")r.calcNormals(true);

        self.mesh = new CGL.Mesh(cgl, r);

        cgl.patch.loading.finished(loadingId);
    });
};

this.filename.onChange = reloadObj;
this.calcNormals.onChange = function ()
{
    reloadObj();
};
