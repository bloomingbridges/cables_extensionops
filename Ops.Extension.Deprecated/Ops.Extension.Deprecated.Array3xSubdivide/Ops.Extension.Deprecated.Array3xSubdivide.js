const inArr = op.inArray("Points");
const subDivs = op.inValue("Num Subdivs", 5);
const bezier = op.inValueBool("Smooth", true);

const result = op.outArray("Result");

subDivs.onChange = calc;
bezier.onChange = calc;
inArr.onChange = calc;

function ip(x0, x1, x2, t)// Bezier
{
    let r = (x0 * (1 - t) * (1 - t) + 2 * x1 * (1 - t) * t + x2 * t * t);
    return r;
}

let arr = [];

function calc()
{
    if (!inArr.get())
    {
        result.set(null);
        return;
    }
    let subd = Math.floor(subDivs.get());
    let inPoints = inArr.get();

    if (inPoints.length < 3) return;

    let i = 0;
    let j = 0;
    let k = 0;

    if (subd > 0 && !bezier.get())
    {
        var newLen = (inPoints.length - 3) * (subd);
        if (newLen != arr.length)
        {
            op.log("resize subdiv arr");
            arr.length = newLen;
        }

        var count = 0;
        for (i = 0; i < inPoints.length - 3; i += 3)
        {
            for (j = 0; j < subd; j++)
            {
                for (k = 0; k < 3; k++)
                {
                    arr[count] =
                        inPoints[i + k] +
                            (inPoints[i + k + 3] - inPoints[i + k]) *
                            j / subd;
                    count++;
                }
            }
        }
    }
    else
    if (subd > 0 && bezier.get())
    {
        var newLen = (inPoints.length - 3) * (subd - 1);
        if (newLen != arr.length) arr.length = newLen;
        var count = 0;

        for (i = 3; i < inPoints.length - 6; i += 3)
        {
            for (j = 0; j < subd; j++)
            {
                for (k = 0; k < 3; k++)
                {
                    let p = ip(
                        (inPoints[i + k - 3] + inPoints[i + k]) / 2,
                        inPoints[i + k + 0],
                        (inPoints[i + k + 3] + inPoints[i + k + 0]) / 2,
                        j / subd
                    );

                    // points.push(p);
                    arr[count] = p;
                    count++;
                }
            }
        }
    }

    // op.log('subdiv ',inPoints.length,arr.length);
    // op.log(arr);
    result.set(null);
    result.set(arr);
}
