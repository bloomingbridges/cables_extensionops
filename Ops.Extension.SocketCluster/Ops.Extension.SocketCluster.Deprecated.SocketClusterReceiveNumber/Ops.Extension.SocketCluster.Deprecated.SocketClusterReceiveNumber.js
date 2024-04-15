const inSocket = op.inObject("socket", null, "socketcluster");
const inTopic = op.inString("topic", "main");
const clientIdOut = op.outString("client id");
const outData = op.outNumber("data");
const outTrigger = op.outTrigger("received");

const init = () =>
{
    const socket = inSocket.get();
    if (socket)
    {
        (async () =>
        {
            const channel = socket.subscribe(socket.channelName + "/numbers");
            for await (const obj of channel)
            {
                if (obj.clientId != socket.clientId && obj.topic == inTopic.get())
                {
                    outData.set(obj.payload);
                    clientIdOut.set(obj.clientId);
                    outTrigger.trigger();
                }
            }
        })();
    }
};

inSocket.onChange = init;
