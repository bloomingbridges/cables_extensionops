let exe = op.inTrigger("Execute");
let functionInput = op.inTrigger("Function Input");

let valueInput = op.inValueString("Value Input");
valueInput.set("");
let arrayInput = op.inArray("Array Input");
arrayInput.set("");
let objectInput = op.inObject("Object Input");
objectInput.onChange = printObject;

function arraysEqual(arr1, arr2)
{
    if (arr1.length !== arr2.length) return false;
    for (let i = 0, len = arr1.length; i < len; i++)
    {
        if (arr1[i] !== arr2[i])
        {
            return false;
        }
    }
    return true;
}

let oldArr = [];
let oldObj = {};

function printValue()
{
    // console.log('changed... ',valueInput.get());

    if (valueInput.get())
    {
        if (valueInput.links && valueInput.links.length === 1)
        {
            op.log("[" + valueInput.links[0].portOut.parent.name + ": " + valueInput.links[0].portOut.name + "] " + valueInput.get());
        }
        else
        { // multiple links, sender unknown
            op.log("[Value] " + valueInput.get());
        }
    }
}

let printArray = function ()
{
    if (arrayInput.get())
    {
        if (Array.isArray(arrayInput.get()))
        {
            if (arrayInput.links && arrayInput.links.length === 1)
            {
                op.log("[" + arrayInput.links[0].portOut.parent.name + ": " + arrayInput.links[0].portOut.name + "] " + arrayInput.get());
            }
            else
            { // multiple links, no was to say who the sender is
                op.log("[Array] " + arrayInput.get());
            }
            // oldArr =  arrayInput.get().slice();
        }
        else
        {
            op.log("[Array]" + "No array!");
        }
    }
};

function printObject()
{
    if (objectInput.get())
    {
        if (objectInput.links && objectInput.links.length === 1)
        {
            // op.log("[" + objectInput.links[0].portOut.parent.name + ": " + objectInput.links[0].portOut.name + "] " + JSON.stringify(objectInput.get()));
            op.log("[" + objectInput.links[0].portOut.parent.name + ": " + objectInput.links[0].portOut.name + "] ", objectInput.get());
        }
        else
        { // multiple links, we cannot say where it comes from...
            op.log("[Object] ", objectInput.get());
        }
    }
}

exe.onTriggered = function ()
{
    printValue();
    printArray();
};

functionInput.onTriggered = function ()
{
    if (functionInput.links && functionInput.links.length === 0)
    {
        op.log("[" + functionInput.links[0].portOut.parent.name + ": " + functionInput.links[0].portOut.name + "] Triggered");
    }
    else
    {
        op.log("[Function] Triggered");
    }
};

// valueInput.onChange=printValue;
// arrayInput.onChange=printArray;
/* objectInput.onChange=printObject; */

/* objectInput.onChange=function(){
    if(objectInput.links && objectInput.links.length > 0) {
        op.log("[" + objectInput.links[0].portOut.parent.name + ": " + objectInput.links[0].portOut.name + "] " + JSON.stringify(objectInput.get()));
    }
}; */
