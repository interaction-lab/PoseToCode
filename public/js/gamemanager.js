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


function minToMilSec(min) {
    return min * 60000;
}
var timeoutTimeMS = 10000;//minToMilSec(15);

// unique id passed around via urls
var userSTUID = uuidv4();
var firstAct = ActEnum.POSETOCODE; // TODO: set up for each student

function uuidv4() {
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

var child_wnd = null;
function openURL(url, isP2CURL) {
    child_wnd = window.open(url +
        "?" + idFieldString + "=" + userSTUID +
        "&" + firstActFieldString + "=" + firstAct);

    if (isP2CURL) {
        setTimeout(function () {
            child_wnd.uploadAndClose();
        }, timeoutTimeMS);
    }
    return false;
}

function closeChildWindow(){
    if(child_wnd && !child_wnd.closed){
        child_wnd.close();
    }
}

function main() {
    openURL(poseToCodeURL, true);
}
window.onload = main;
