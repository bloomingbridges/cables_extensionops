const
    filename = op.inUrl("Font File", [".otf", ".ttf", ".woff", ".woff2"]),
    outFont = op.outObject("Opentype Font", null, "opentype");

filename.onChange = async function ()
{
    const fontFile = op.patch.getFilePath(String(filename.get()));
    const font = await opentype.load(fontFile);
    outFont.set(font);
};
