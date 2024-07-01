op.name = "TextureText";
let text = op.addInPort(new CABLES.Port(op, "text", CABLES.OP_PORT_TYPE_VALUE, { "type": "string", "display": "editor" }));
let inFontSize = op.addInPort(new CABLES.Port(op, "fontSize"));
let maximize = op.addInPort(new CABLES.Port(op, "Maximize Size", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" }));
let texWidth = op.addInPort(new CABLES.Port(op, "texture width"));
let texHeight = op.addInPort(new CABLES.Port(op, "texture height"));
let align = op.addInPort(new CABLES.Port(op, "align", CABLES.OP_PORT_TYPE_VALUE, { "display": "dropdown", "values": ["left", "center", "right"] }));
let valign = op.addInPort(new CABLES.Port(op, "vertical align", CABLES.OP_PORT_TYPE_VALUE, { "display": "dropdown", "values": ["top", "center", "bottom"] }));
let font = op.addInPort(new CABLES.Port(op, "font", CABLES.OP_PORT_TYPE_VALUE, { "type": "string" }));
let lineDistance = op.addInPort(new CABLES.Port(op, "line distance"));
let border = op.addInPort(new CABLES.Port(op, "border"));
let doRefresh = op.inTrigger("Refresh");

// var textureOut=op.addOutPort(new CABLES.Port(op,"texture",CABLES.OP_PORT_TYPE_TEXTURE));
let textureOut = op.outTexture("texture");
let outRatio = op.addOutPort(new CABLES.Port(op, "Ratio", CABLES.OP_PORT_TYPE_VALUE));
let cgl = op.patch.cgl;

doRefresh.onTriggered = refresh;

border.set(0);
texWidth.set(512);
texHeight.set(512);
lineDistance.set(1);
inFontSize.set(30);
font.set("Arial");
align.set("center");
valign.set("center");

let fontImage = null;
let ctx = null;
CABLES.OpTextureTextCanvas = CABLES.OpTextureTextCanvas || {};

function checkCanvas()
{
    let id = "canv" + texWidth.get() + "_" + texHeight.get();
    if (!CABLES.OpTextureTextCanvas.hasOwnProperty(id))
    {
        if (fontImage)
        {
            console.log("remove fontimage");
            fontImage.remove();
        }
        fontImage = document.createElement("canvas");
        fontImage.id = "texturetext_" + CABLES.generateUUID();
        fontImage.style.display = "none";
        let body = document.getElementsByTagName("body")[0];
        body.appendChild(fontImage);
        CABLES.OpTextureTextCanvas[id] = fontImage;

        ctx = null;
        textureOut.set(null);
    }

    if (!ctx)
    {
        ctx = fontImage.getContext("2d");
    }
}

function reSize()
{
    if (textureOut.get())
    {
        textureOut.get().setSize(texWidth.get(), texHeight.get());
        ctx.canvas.width = fontImage.width = texWidth.get();
        ctx.canvas.height = fontImage.height = texHeight.get();
    }
    refresh();
}

function refresh()
{
    if (op.instanced(refresh)) return;

    checkCanvas();
    ctx.clearRect(0, 0, fontImage.width, fontImage.height);
    // ctx.fillStyle = 'rgba(255,255,255,0)';
    // ctx.fillRect(0,0,fontImage.width,fontImage.height);

    ctx.fillStyle = "white";
    let fontSize = parseFloat(inFontSize.get());
    ctx.font = fontSize + "px \"" + font.get() + "\",\"Arial\"";
    ctx.textAlign = align.get();

    if (border.get() > 0)
    {
        ctx.beginPath();
        ctx.lineWidth = "" + border.get();
        ctx.strokeStyle = "white";
        ctx.rect(
            0,
            0,
            texWidth.get(),
            texHeight.get()
        );
        ctx.stroke();
    }

    // if(text.get())
    {
        let txt = (text.get() + "").replace(/<br\/>/g, "\n");
        let strings = txt.split("\n");
        let posy = 0, i = 0;

        if (maximize.get())
        {
            fontSize = texWidth.get();
            let count = 0;
            let maxWidth = 0;
            let maxHeight = 0;

            do
            {
                count++;
                if (count > 300) break;
                fontSize -= 10;
                ctx.font = fontSize + "px \"" + font.get() + "\"";
                maxWidth = 0;
                maxHeight = strings.length * fontSize * 1.1;
                for (i = 0; i < strings.length; i++)
                {
                    maxWidth = Math.max(maxWidth, ctx.measureText(strings[i]).width);
                }
            }
            while (maxWidth > ctx.canvas.width || maxHeight > ctx.canvas.height);
        }

        if (valign.get() == "center")
        {
            let maxy = (strings.length - 1.5) * fontSize + parseFloat(lineDistance.get());
            posy = ctx.canvas.height / 2 - maxy / 2;
        }
        else if (valign.get() == "top") posy = fontSize;
        else if (valign.get() == "bottom") posy = ctx.canvas.height - (strings.length) * (parseFloat(fontSize.get()) + parseFloat(lineDistance.get()));

        for (i = 0; i < strings.length; i++)
        {
            if (align.get() == "center") ctx.fillText(strings[i], ctx.canvas.width / 2, posy);
            if (align.get() == "left") ctx.fillText(strings[i], 0, posy);
            if (align.get() == "right") ctx.fillText(strings[i], ctx.canvas.width, posy);
            posy += fontSize + parseFloat(lineDistance.get());
        }
    }

    ctx.restore();

    outRatio.set(ctx.canvas.height / ctx.canvas.width);

    if (textureOut.get()) textureOut.get().initTexture(fontImage, CGL.Texture.FILTER_MIPMAP);
    else textureOut.set(new CGL.Texture.createFromImage(cgl, fontImage, { "filter": CGL.Texture.FILTER_MIPMAP }));

    textureOut.get().unpackAlpha = false;
}

align.onChange = refresh;
valign.onChange = refresh;
text.onChange = refresh;
inFontSize.onChange = refresh;
font.onChange = refresh;
lineDistance.onChange = refresh;
maximize.onChange = refresh;

texWidth.onChange = reSize;
texHeight.onChange = reSize;

border.onChange = refresh;

text.set("cables");
reSize();
