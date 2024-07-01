let exec = op.addInPort(new CABLES.Port(op, "Execute", CABLES.OP_PORT_TYPE_FUNCTION));
let trigger = op.outTrigger("Trigger");

let inId = op.inValueString("id");
let pPointSize = op.inValue("Size Point", 10);

let show = op.inValueBool("show", true);
let index = op.inValue("index");
let title = op.inValueString("Title");

let inText = op.inValueString("Text");

let ignore = op.inValueBool("Ignore Mouse");

let outHovering = op.outValue("Hovering", false);
let outHoverIndex = op.outValue("Hover Index", -1);

let triggerClicked = op.outTrigger("Clicked");

let cgl = op.patch.cgl;
let trans = vec3.create();
let m = mat4.create();
let elements = [];
let elementOver = null;
var textContent = false;

let pointSize = 10;
let currentIndex = 0;
let pos = [0, 0, 0];

show.onChange = updateVisibility;
ignore.onChange = updateListeners;
inText.onChange = updateText;

pPointSize.onChange = function ()
{
    pointSize = pPointSize.get();
    for (let i = 0; i < elements.length; i++)
    {
        if (elements[i])
        {
            elements[i].style.width = pointSize + "px";
            elements[i].style.height = pointSize + "px";
            elements[i].style["border-radius"] = 2 * pointSize + "px";
        }
    }
};

function updateText()
{
    if (elements[currentIndex]) elements[currentIndex].innerHTML = "<span>" + inText.get() + "</span>";
}

function updateVisibility()
{
    let i = 0;

    if (show.get())
    {
        for (i = 0; i < elements.length; i++)
        {
            if (elements[i])
            {
                elements[i].style.opacity = 1;
                elements[i].style["pointer-events"] = "all";
            }
        }
    }
    else
    {
        for (i = 0; i < elements.length; i++)
        {
            if (elements[i])
            {
                elements[i].style.opacity = 0;
                elements[i].style["pointer-events"] = "none";
            }
        }
    }
}

index.onChange = function ()
{
    currentIndex = Math.round(index.get());
    if (currentIndex > elements.length)
    {
        elements.length = currentIndex + 1;
    }

    if (elements[currentIndex]) elements[currentIndex].dataset.index = currentIndex;
};

var textContent = null;

function onMouseClick(e)
{
    triggerClicked.trigger();
}

function onMouseEnter(e)
{
    let index = e.currentTarget.index;

    outHovering.set(true);
    outHoverIndex.set(index);

    if (elementOver)
    {
        elementOver.innerHTML = elements[index].title;
        elementOver.style.top = elements[index].y + pointSize / 2 + "px";
        elementOver.style.left = elements[index].x = (x + pointSize + 15) + "px";
        elementOver.style.opacity = 1;
    }
}

function onMouseLeave(e)
{
    outHovering.set(false);

    let index = e.currentTarget.index;
    if (elementOver) elementOver.style.opacity = 0;
    if (elementOver) elementOver.style["pointer-events"] = "none";
}

function init()
{
    let id = inId.get() + "_";
    let canvas = op.patch.cgl.canvas.parentElement;

    elements[currentIndex] = document.createElement("div");
    elements[currentIndex].style.position = "absolute";
    elements[currentIndex].classList.add("hoverpoint");

    id += currentIndex;

    elements[currentIndex].id = id;
    elements[currentIndex].style.width = pointSize + "px";
    elements[currentIndex].style.height = pointSize + "px";
    elements[currentIndex].style["border-radius"] = 2 * pointSize + "px";
    // elements[currentIndex].style.border="1px solid black";
    elements[currentIndex].style["z-index"] = "99999";
    elements[currentIndex].style["background-color"] = "white";
    elements[currentIndex].style.transition = "opacity 0.3s ease " + Math.random() * 0.2 + "s";
    elements[currentIndex].style.opacity = 0;
    elements[currentIndex].index = currentIndex;

    elements[currentIndex].dataset.index = currentIndex;

    elements[currentIndex].style.opacity = "0.5";

    if (!elementOver)
    {
        elementOver = document.createElement("div");
        elementOver.id = inId.get() + "_hover";
        elementOver.style.position = "absolute";
        elementOver.style.display = "inline-block";
        elementOver.style.opacity = "0";
        elementOver.style.padding = "7px";
        elementOver.style.transform = "translateY(-50%)";
        elementOver.style["padding-left"] = "10px";
        elementOver.style["padding-right"] = "10px";
        elementOver.style.overflow = "hidden";
        elementOver.style["font-family"] = "NB,Arial";
        elementOver.style["z-index"] = "99999999";
        elementOver.style.transition = "opacity 0.3s ease " + Math.random() * 0.2 + "s";
        elementOver.style.color = "white";
        elementOver.style["background-color"] = "rgba(0,0,0,0.7)";
        elementOver.classList.add("hoverpoint-hover");

        textContent = document.createTextNode("");
        elementOver.appendChild(textContent);

        canvas.appendChild(elementOver);
    }

    updateListeners();

    updateVisibility();
    updateText();

    canvas.appendChild(elements[currentIndex]);
}

function addListeners()
{
    if (elements[currentIndex])
    {
        elements[currentIndex].style["pointer-events"] = "all";
        elements[currentIndex].addEventListener("mouseleave", onMouseLeave);
        elements[currentIndex].addEventListener("mouseenter", onMouseEnter);
        elements[currentIndex].addEventListener("click", onMouseClick);
    }
}

function removeListeners()
{
    if (elements[currentIndex])
    {
        elements[currentIndex].style["pointer-events"] = "none";
        elements[currentIndex].removeEventListener("mouseleave", onMouseLeave);
        elements[currentIndex].removeEventListener("mouseenter", onMouseEnter);
        elements[currentIndex].removeEventListener("click", onMouseClick);
    }
}

function updateListeners()
{
    if (ignore.get())removeListeners();
    else addListeners();
}

op.onDelete = function ()
{
    if (elementOver)elementOver.remove();

    for (let i = 0; i < elements.length; i++)
    {
        if (elements[i])elements[i].remove();
        if (elementOver)elementOver.remove();
    }
};

var x = 0;
let y = 0;
function getScreenCoord()
{
    mat4.multiply(m, cgl.vMatrix, cgl.mvMatrix);

    vec3.transformMat4(pos, [0, 0, 0], m);

    vec3.transformMat4(trans, pos, cgl.pMatrix);

    let vp = cgl.getViewPort();

    x = (vp[2] - (vp[2] * 0.5 - trans[0] * vp[2] * 0.5 / trans[2]));
    y = (vp[3] - (vp[3] * 0.5 + trans[1] * vp[3] * 0.5 / trans[2]));
}

exec.onTriggered = function ()
{
    if (!elements[currentIndex])init();

    getScreenCoord();

    x -= pointSize / 2;
    y -= pointSize / 2;

    let offsetTop = op.patch.cgl.canvas.offsetTop;

    if (elements[currentIndex] && (elements[currentIndex].y != y || elements[currentIndex].x != x))
    {
        // elements[currentIndex].title=title.get();
        elements[currentIndex].style.top = offsetTop + y + "px";
        elements[currentIndex].style.left = x + "px";
        elements[currentIndex].y = y;
        elements[currentIndex].x = x;
    }

    trigger.trigger();
};
