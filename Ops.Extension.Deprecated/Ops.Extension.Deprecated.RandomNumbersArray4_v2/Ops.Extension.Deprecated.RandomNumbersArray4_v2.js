const
    numValues = op.inValueInt("numValues", 100),
    min = op.inValueFloat("Min", 0),
    max = op.inValueFloat("Max", 1),
    seed = op.inValueFloat("random seed"),
    closed = op.inValueBool("Last == First"),
    inInteger = op.inValueBool("Integer", false),
    values = op.outArray("values", null, 4),
    outTotalPoints = op.outNumber("Tuple Amount"),
    outArrayLength = op.outNumber("Array length");

op.setPortGroup("Value Range", [min, max]);
op.setPortGroup("", [seed, closed]);

values.ignoreValueSerialize = true;

closed.onChange = max.onChange =
    min.onChange =
    numValues.onChange =
    seed.onChange =
    values.onLinkChanged =
    inInteger.onChange = init;

let arr = [];
init();

function init()
{
    Math.randomSeed = seed.get();

    let isInteger = inInteger.get();

    let arrLength = arr.length = Math.floor(Math.abs(numValues.get() * 4));
    if (arrLength === 0)
    {
        values.set(null);
        outTotalPoints.set(0);
        outArrayLength.set(0);
        return;
    }

    let minIn = min.get();
    let maxIn = max.get();

    for (let i = 0; i < arrLength; i += 4)
    {
        if (!isInteger)
        {
            arr[i + 0] = Math.seededRandom() * (maxIn - minIn) + minIn;
            arr[i + 1] = Math.seededRandom() * (maxIn - minIn) + minIn;
            arr[i + 2] = Math.seededRandom() * (maxIn - minIn) + minIn;
            arr[i + 3] = Math.seededRandom() * (maxIn - minIn) + minIn;
        }
        else
        {
            arr[i + 0] = Math.floor(Math.seededRandom() * ((maxIn - minIn) + 1) + minIn);
            arr[i + 1] = Math.floor(Math.seededRandom() * ((maxIn - minIn) + 1) + minIn);
            arr[i + 2] = Math.floor(Math.seededRandom() * ((maxIn - minIn) + 1) + minIn);
            arr[i + 3] = Math.floor(Math.seededRandom() * ((maxIn - minIn) + 1) + minIn);
        }
    }

    if (closed.get() && arrLength > 4)
    {
        arr[arrLength - 4 + 0] = arr[0];
        arr[arrLength - 4 + 1] = arr[1];
        arr[arrLength - 4 + 2] = arr[2];
        arr[arrLength - 4 + 3] = arr[2];
    }

    values.set(null);
    values.set(arr);
    outTotalPoints.set(arrLength / 4);
    outArrayLength.set(arrLength);
}
