// input
let nodePort = op.inObject("Synth");
let notePort = op.inValueString("Note", "C4"); // frequency also works
let timePort = op.inValueString("Time", "+0");

// change listeners
notePort.onChange = setNote;
timePort.onChange = setNote;

// functions
function setNote()
{
    let synth = nodePort.get();
    if (synth && synth.setNote)
    {
        let note = notePort.get();
        let time = timePort.get();

        // check time
        try
        {
            new Tone.TimeBase(time);
        }
        catch (e)
        {
            op.log("Warning: Invalid time, using '+0'");
            time = "+0";
        }

        // check tone
        try
        {
            Tone.Frequency(note);
        }
        catch (e)
        {
            op.uiAttr({ "error": "Invalid note, should be either a tone, e.g. \"C4\" or a frequency, e.g. \"440\"" });
            return;
        }
        synth.setNote(note, time);
        op.uiAttr({ "error": null }); // clear UI error
    }
}
