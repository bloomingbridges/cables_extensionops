op.name = "voronoi";
let render = op.inTrigger("render");
let pSites = op.inArray("Site Points");

let pRender = op.inValueBool("Render", true);

let pWidth = op.inValue("Width", 2);
let pHeight = op.inValue("Height", 2);

let pExtrCenter = op.inValue("Extrude Cell Center", 0.1);

let next = op.outTrigger("Next");

pExtrCenter.onChange = queueUpdate;

let needsUpdate = true;
let cgl = op.patch.cgl;

let voronoi = new Voronoi();
let bbox = { "xl": -1, "xr": 1, "yt": -1, "yb": 1 }; // xl is x-left, xr is x-right, yt is y-top, and yb is y-bottom
let sites = [];

function updateSize()
{
    bbox.xl = -pWidth.get() / 2;
    bbox.xr = pWidth.get() / 2;
    bbox.yt = -pHeight.get() / 2;
    bbox.yb = pHeight.get() / 2;
    queueUpdate();
}

pWidth.onChange = updateSize;
pHeight.onChange = updateSize;

for (let i = 0; i < 75; i++)
{
    sites.push(
        {
            "x": Math.random() - 0.5,
            "y": Math.random() - 0.5,
        });
}

let diagram = voronoi.compute(sites, bbox);
let meshes = [];
let geoms = [];

pSites.onChange = function ()
{
    if (pSites.get())
    {
        let arr = pSites.get();
        if (arr.length % 2 !== 0)arr.length--;
        sites.length = arr.length / 2;

        for (let i = 0; i < sites.length; i++)
        {
            sites[i] = (
                {
                    "x": arr[i * 2],
                    "y": arr[i * 2 + 1]
                });
        }

        needsUpdate = true;
    }
};

function distance(x1, y1, x2, y2)
{
    let xd = x2 - x1;
    let yd = y2 - y1;
    return Math.sqrt(xd * xd + yd * yd);
}

function queueUpdate()
{
    needsUpdate = true;
}

function updateGeom()
{
    if (!sites) return;
    diagram = voronoi.compute(sites, bbox);

    // todo delete unalloc old mesh objects
    meshes.length = 0;
    needsUpdate = false;

    for (let ic = 0; ic < sites.length; ic++)
    {
        let vid = sites[ic].voronoiId;
        let verts = [];
        let tc = [];
        let cell = diagram.cells[vid];
        if (!cell) return;

        let mX = 0;
        let mY = 0;
        let check = 0;
        let indices = [];

        let w = pWidth.get();
        let h = pHeight.get();

        if (!geoms[vid])geoms[vid] = new CGL.Geometry();

        let minDist = 9999999;

        for (let j = 0; j < cell.halfedges.length; j++)
        {
            let edge = cell.halfedges[j].edge;

            verts.push(cell.site.x);
            verts.push(cell.site.y);
            verts.push(pExtrCenter.get());
            // tc.push((cell.site.x+w/2)/w);
            // tc.push((cell.site.y+h/2)/h);
            // tc.push(cell.site.y/h);
            // tc.push(0);
            // tc.push(0);
            tc.push(cell.site.x / w - 0.5);
            tc.push(cell.site.y / h - 0.5);

            indices.push(verts.length / 3 - 1);

            verts.push(edge.va.x);
            verts.push(edge.va.y);
            verts.push(0);
            // tc.push((edge.va.x+w/2)/w);
            // tc.push((edge.va.y+h/2)/h);
            // tc.push(edge.va.x/w);
            // tc.push(edge.va.y/h);
            // tc.push(1);
            // tc.push(1);
            tc.push(cell.site.x / w - 0.5);
            tc.push(cell.site.y / h - 0.5);
            indices.push(verts.length / 3 - 1);

            verts.push(edge.vb.x);
            verts.push(edge.vb.y);
            verts.push(0);
            // tc.push((edge.vb.x+w/2)/w);
            // tc.push((edge.vb.y+h/2)/h);
            // tc.push(edge.vb.x/w);
            // tc.push(edge.vb.y/h);
            // tc.push(1);
            // tc.push(1);
            tc.push(cell.site.x / w - 0.5);
            tc.push(cell.site.y / h - 0.5);

            indices.push(verts.length / 3 - 1);
        }

        geoms[vid].vertices = verts;
        geoms[vid].verticesIndices = indices;
        geoms[vid].texCoords = new Float32Array(tc);
        geoms[vid].calculateNormals({ "forceZUp": true });

        if (!meshes[vid]) meshes[vid] = new CGL.Mesh(op.patch.cgl, geoms[vid]);
        else meshes[vid].setGeom(geoms[vid]);
        // else meshes[vid].updateVertices(geoms[vid]);

        meshes[vid].pos = [sites[ic].x, sites[ic].y, 0];

        let md = 99999;

        for (let s = 0; s < sites.length; s++)
        {
            let d = distance(
                sites[ic].x, sites[ic].y,
                sites[s].x, sites[s].y);

            if (d !== 0)
            {
                md = Math.min(d, md);
                sites[ic].md = md / 2;
                sites[ic].mdIndex = s;
            }
        }

        // md=md*md;
        meshes[vid].scale = [sites[ic].md, sites[ic].md, sites[ic].md];
    }
}

render.onTriggered = function ()
{
    if (needsUpdate)updateGeom();

    shader = cgl.getShader();
    if (!shader) return;
    oldPrim = shader.glPrimitive;

    for (let i = 0; i < meshes.length; i++)
    {
        if (pRender.get())meshes[i].render(op.patch.cgl.getShader());

        if (next.isLinked())
        {
            cgl.pushModelMatrix();
            mat4.translate(cgl.mvMatrix, cgl.mvMatrix, meshes[i].pos);
            mat4.scale(cgl.mvMatrix, cgl.mvMatrix, meshes[i].scale);

            next.trigger();
            cgl.popModelMatrix();
        }
    }
};
