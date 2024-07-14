With this op you can trigger one of multiple scenes depending on the value of `Select`. When `Select` is `0` `Trigger 0` will be triggered, when it is `1` `Trigger 1` and so on.
With `Overlap` you can control when the previous / next trigger should be triggered. When set to `0` only one will be triggered at a time, when set to `1` the previous / next will be triggered as well. Setting it to a value in between will trigger the second one in between.
The op operates in a circular manner – this means that it will start at the beginning when the end is reached. 
It knows how many triggers are connected, e.g. when you connect something to `Trigger 0`, `Trigger 1`, and `Trigger 2` only these three will be triggered when you change `Select`, not the not-connected ones after.
To understand this op it is best to connect `Execute` to Ops.Gl.MainLoop and connect a few of the trigger ports to e.g. Ops.Trigger.TriggerExtender. Then activate flow mode by pressing `cmd + p` and entering «flow» and choosing «toggle flow visualisation». When changing the value of `Select` now you will see which output ports are triggered and which are not.