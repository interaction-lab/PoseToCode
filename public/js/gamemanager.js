// Query string params
const urlSearchParams = new URLSearchParams(window.location.search);
const queryStringParams = Object.fromEntries(urlSearchParams.entries());

var idFieldString = "STUID";
var firstActFieldString = "FIRAC";
const ActEnum = {
    POSETOCODE: 0,
    CODEDORG: 1,
}

var poseToCodeURL = "./tutorial.html";
var freePlayURL = "./freeplay.html";
var codeDotOrgURL = "https://studio.code.org/s/dance-2019/lessons/1/levels/1";
var preSurveyURL = "https://usc.qualtrics.com/jfe/form/SV_eX58L8r5vPCpamy";
var postSurveyP2CURL = "https://usc.qualtrics.com/jfe/form/SV_8IEYpsjgZXxy00S";
var postSurveyCDOURL = "https://usc.qualtrics.com/jfe/form/SV_8bNo1pXiILq7rBI";
var junkSurveyURL = "https://usc.qualtrics.com/jfe/form/SV_exQl4oNMqBuT6gm";
var postPostSurveyURL = "https://usc.qualtrics.com/jfe/form/SV_8qcr7Ft7NReceWO";


function minToMilSec(min) {
    return min * 60000;
}
var timeoutTimeMS = minToMilSec(10);

// unique id passed around via urls
var userSTUID = uuidv4();
var firstAct = ActEnum.POSETOCODE;
if (queryStringParams[firstActFieldString] != null) {
    firstAct = queryStringParams[firstActFieldString];
}

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

function isSurveyURL(url) {
    return url.includes("qualtrics");
}

function isCodeDotOrgURL(url) {
    return url.includes("code.org");
}

function isP2CURL(url) {
    return !isSurveyURL(url) && !isCodeDotOrgURL(url);
}

var child_wnd = null;
function openURL(url) {
    child_wnd = window.open(url +
        "?" + idFieldString + "=" + userSTUID +
        "&" + firstActFieldString + "=" + firstAct);
    if (!isSurveyURL(url)) {
        setTimeout(function () {
            if (isP2CURL(url)) {
                child_wnd.uploadAndClose();
            }
            else {
                child_wnd.close();
            }
        }, timeoutTimeMS);
    }
    return false;
}

function closeChildWindow() {
    if (child_wnd && !child_wnd.closed) {
        child_wnd.close();
    }
}

var cycleIndex = 0;
var urlArr = [preSurveyURL, poseToCodeURL, postSurveyP2CURL, codeDotOrgURL, postSurveyCDOURL, postPostSurveyURL];
var p2cFirstCondition = [0, 1, 2, 3, 4, 5];
var cdoFirstCondition = [0, 3, 4, 1, 2, 5];


var colors = ["#9400D3", "#0000FF", "#48A14D", "#FF7F00", "#FF0000", "#000000"];
function cycleUrl() {
    if (cycleIndex < urlArr.length) {
        var exerciseIndex = firstAct == ActEnum.POSETOCODE ?
            p2cFirstCondition[cycleIndex] : cdoFirstCondition[cycleIndex];

        openURL(urlArr[exerciseIndex]);
        cycleIndex++;
        if (cycleIndex < urlArr.length) {
            document.getElementById("next_button").style.background = colors[cycleIndex];
        }
        else {
            document.getElementById("next_button").innerHTML = "Done!";
        }
    }
    else {
        alert("Completed everything!")
    }
}

function main() {
    document.getElementById("next_button").style.background = colors[0];
    document.getElementById("next_button").onclick = cycleUrl;
}
window.onload = main;
