op.name = "ToneTime";

// see https://github.com/Tonejs/Tone.js/wiki/Time

// constants
let DEFAULT_TIME_SUFFIX = "n";
let TIME_SUFFIXES = {};
TIME_SUFFIXES.Note = "n";
TIME_SUFFIXES.Triplet = "t";
TIME_SUFFIXES.Measure = "m";
TIME_SUFFIXES.Second = "";
TIME_SUFFIXES.Frequency = "hz";
TIME_SUFFIXES.Tick = "i";
let TIME_SUFFIX_KEYS = Object.keys(TIME_SUFFIXES);

// input ports
let timeInputPort = op.inValue("Time");
let timeTypePort = this.addInPort(
    new CABLES.Port(this, "Time Type", CABLES.OP_PORT_TYPE_VALUE,
        { "display": "dropdown", "values": TIME_SUFFIX_KEYS }
    )
);
let nowRelativePort = op.addInPort(
    new CABLES.Port(this, "Relative To Now", CABLES.OP_PORT_TYPE_VALUE, { "display": "bool" })
);

// output port
let toneTimePort = op.outValue("Tone Time");

// vars
let currentTimeSuffix = DEFAULT_TIME_SUFFIX;
let prefix = ""; // either "+" or "", used for now-relative-time

let getTimeSuffix = function (key)
{
    if (key && key in TIME_SUFFIXES)
    {
        return TIME_SUFFIXES[key];
    }
    return DEFAULT_TIME_SUFFIX;
};

timeTypePort.onChange = function ()
{
    currentTimeSuffix = getTimeSuffix(timeTypePort.get());
    setToneTimePort();
};

timeInputPort.onChange = setToneTimePort;

function setToneTimePort()
{
    if (timeInputPort.get())
    {
        toneTimePort.set(prefix + timeInputPort.get() + currentTimeSuffix);
    }
    else
    {
        toneTimePort.set("");
    }
}

nowRelativePort.onChange = function ()
{
    prefix = nowRelativePort.get() ? "+" : "";
    setToneTimePort();
};

// set defaults
timeTypePort.set(DEFAULT_TIME_SUFFIX);
nowRelativePort.set(false);
