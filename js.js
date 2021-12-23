// More API functions here:
// https://github.com/googlecreativelab/teachablemachine-community/tree/master/libraries/image

// the link to your model provided by Teachable Machine export panel
const URL = "./my_model/";

let model, webcam, labelContainer, maxPredictions;



// Load the image model and setup the webcam
window.onload = async function init() {
    //const modelURL = URL + "model.json";
    //const metadataURL = URL + "metadata.json";

    const modelURL = "https://show-sen.github.io/blink/my_model/model.json";
    const metadataURL = "https://show-sen.github.io/blink/my_model/metadata.json";


    // load the model and metadata
    // Refer to tmImage.loadFromFiles() in the API to support files from a file picker
    // or files from your local hard drive
    // Note: the pose library adds "tmImage" object to your window (window.tmImage)
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();

    // Convenience function to setup a webcam
    const flip = true; // whether to flip the webcam
    webcam = new tmImage.Webcam(300, 300, flip); // width, height, flip
    await webcam.setup(); // request access to the webcam
    await webcam.play();
    window.requestAnimationFrame(loop);

    // append elements to the DOM
    document.getElementById("webcam-container").appendChild(webcam.canvas);
    labelContainer = document.getElementById("label-container");
    for (let i = 0; i < maxPredictions; i++) { // and class labels
        labelContainer.appendChild(document.createElement("div"));
    }
}

let LPF = [0.0, 0.0], lastLPF = [0.0, 0.0], k = 0.8;
let countBLINK = 0, playnow = 0, BLINKtimer, tontimer, tsutimer, close, Morsetimer;
var audio = new Audio("t.mp3");
let morsecode = "";
let decodemap = {
    "・－": "A",
    "－・・・": "B",
    "－・－・": "C",
    "－・・": "D",
    "・": "E",
    "・・－・": "F",
    "－－・": "G",
    "・・・・": "H",
    "・・": "I",
    "・－－－": "J",
    "－・－": "K",
    "・－・・": "L",
    "－－": "M",
    "－・": "N",
    "－－－": "O",
    "・－－・": "P",
    "－－・－": "Q",
    "・－・": "R",
    "・・・": "S",
    "－": "T",
    "・・－": "U",
    "・・・－": "V",
    "・－－": "W",
    "－・・－": "X",
    "－・－－": "Y",
    "－－・・": "Z",
    "・・・・・・": "delete"
};

function recogMorse() {
    window.clearTimeout(Morsetimer);
    Morsetimer = setTimeout(function () {
        if (decodemap[morsecode] == "delete") document.getElementById("text").value = document.getElementById("text").value.slice(0, -1);
        else if (decodemap[morsecode] != undefined) document.getElementById("text").value += decodemap[morsecode];
        document.getElementById("test").innerHTML = "last morse decode ---->" + morsecode + "   to   " + decodemap[morsecode];
        document.getElementById("morse").innerHTML = "";
        morsecode = "";
    }, 1000);
}

function printBLINK() {
    countBLINK++;
    window.clearTimeout(BLINKtimer);
    document.getElementById("BLINK").innerHTML = "BLINK :" + countBLINK;
    if (countBLINK == 2) document.getElementById("doubleBLINK").innerHTML = "DOUBLE BLINK !!";
    BLINKtimer = setTimeout(function () {
        document.getElementById("BLINK").innerHTML = "";
        document.getElementById("doubleBLINK").innerHTML = "";

        countBLINK = 0;
    }, 500);
}

function dot() {
    audio.play();
    recogMorse();
    tontimer = setTimeout(function () {
        audio.pause();
        audio.currentTime = 0;
        morsecode += '・';
        document.getElementById("morse").innerHTML = morsecode;

    }, 100);
}

function dash() {
    audio.play();
    recogMorse();
    tontimer = setTimeout(function () {
        audio.pause();
        audio.currentTime = 0;
        morsecode += '－';
        document.getElementById("morse").innerHTML = morsecode;
    }, 400);
}

function dotAndDash() {
    audio.play();
    playnow = 1;
    recogMorse();
    tontimer = setTimeout(function () {
        if (close == 0) {
            audio.pause();
            audio.currentTime = 0;
            document.getElementById("morse").innerHTML += "・";
            morsecode += '・';
            playnow = 0;
        } else {
            tsutimer = setTimeout(function () {
                audio.pause();
                audio.currentTime = 0;
                document.getElementById("morse").innerHTML += "－";
                morsecode += '－';
                playnow = 0;
            }, 200);
        }
    }, 100);
}

async function loop() {
    webcam.update(); // update the webcam frame
    await predict();

    window.requestAnimationFrame(loop);//goto loop
}

// run the webcam image through the image model
async function predict() {
    // predict can take in an image, video or canvas html element
    const prediction = await model.predict(webcam.canvas);

    for (let i = 0; i < maxPredictions; i++) {
        lastLPF[i] = LPF[i];
        LPF[i] = (1 - k) * lastLPF[i] + k * prediction[i].probability.toFixed(2);

        const classPrediction =
            prediction[i].className + ": " + prediction[i].probability.toFixed(2);

        if (LPF[i].toPrecision(2) > 0.01) labelContainer.childNodes[i].innerHTML = prediction[i].className + ": " + LPF[i].toPrecision(2);
        else labelContainer.childNodes[i].innerHTML = prediction[i].className + ": " + 0.00;

    }

    if (LPF[1] >= 0.80 && lastLPF[1] < 0.70) {
        //printBLINK();
        if (playnow == 0) {
            dotAndDash();
            close = 1;
        }
    }

    if (LPF[1] < 0.80 && lastLPF[1] >= 0.70) {
        close = 0;
    }
}