const filename = op.addInPort(new CABLES.Port(op, "file", CABLES.OP_PORT_TYPE_VALUE, { "display": "file", "type": "string", "filter": "json" }));
const result = op.outArray("Result");
const isLoading = op.outValue("Is Loading", false);
const jsonp = op.inValueBool("JsonP", false);

result.ignoreValueSerialize = true;

filename.onChange = delayedReload;
jsonp.onChange = delayedReload;

let loadingId = 0;
let reloadTimeout = 0;

function delayedReload()
{
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(reload, 100);
}

let jsonpCounter = null;
CABLES.jsonp = function (url, cb)
{
    jsonpCounter = jsonpCounter || 0;
    jsonpCounter++;
    const jsonPID = jsonpCounter;

    CABLES["jsonpFunc" + jsonPID] = function (data)
    {
        cb(false, data);
    };

    let paramChar = "?";
    if (url.indexOf(paramChar) > -1) paramChar = "&";

    const s = document.createElement("script");
    s.setAttribute("src", url + paramChar + "callback=CABLES.jsonpFunc" + jsonPID);
    // s.onload=function()
    // {
    // };
    document.body.appendChild(s);
};

function reload()
{
    if (!filename.get()) return;

    op.patch.loading.finished(loadingId);

    loadingId = op.patch.loading.start("jsonFile", "" + filename.get());
    isLoading.set(true);

    let f = CABLES.ajax;
    if (jsonp.get())f = CABLES.jsonp;

    f(
        op.patch.getFilePath(filename.get()),
        function (err, _data, xhr)
        {
            try
            {
                let data = _data;
                if (typeof data === "string") data = JSON.parse(_data);

                if (result.get())result.set(null);
                result.set(data);
                op.uiAttr({ "error": "" });
                op.patch.loading.finished(loadingId);
                isLoading.set(false);
            }
            catch (e)
            {
                op.uiAttr({ "error": "error loading json" });
                op.patch.loading.finished(loadingId);
                isLoading.set(false);
            }
        });
}
