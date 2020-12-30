const { desktopCapturer, remote } = require("electron");
const { Menu, dialog } = remote;
const { writeFile } = require("fs");
let mRecorder;
const recordedChunks = [];
const videoSelectBtn = document.getElementById("videoSelectBtn");
videoSelectBtn.onclick = getVidSrcs;
const videoElement = document.querySelector("video");
const startBtn = document.getElementById("startBtn");
startBtn.onclick = (e) => {
  mRecorder.start();
  startBtn.classList.add("is-danger");
  startBtn.innerText = "Recording";
};
const stopBtn = document.getElementById("stopBtn");
stopBtn.onclick = (e) => {
  mRecorder.stop();
  startBtn.classList.remove("is-danger");
  startBtn.innerText = "Start";
};

async function getVidSrcs() {
  const srcs = await desktopCapturer.getSources({
    types: ["window", "screen"],
  });
  const videoOptionsMenu = Menu.buildFromTemplate(
    srcs.map((src) => {
      return {
        label: src.name,
        click: () => selectSrc(src),
      };
    })
  );
  videoOptionsMenu.popup();
}

async function selectSrc(src) {
  videoSelectBtn.innerText = src.name;
  const constraints = {
    audio: false,
    video: {
      mandatory: {
        chromeMediaSource: "desktop",
        chromeMediaSourceId: src.id,
      },
    },
  };
  const stream = await navigator.mediaDevices.getUserMedia(constraints);
  videoElement.srcObject = stream;
  videoElement.play();
  const options = {
    mimeType: "video/webm; codecs=vp9",
  };
  mRecorder = new MediaRecorder(stream, options);
  mRecorder.ondataavailable = hndlDataAvail;
  mRecorder.onstop = hndlStop;
}

function hndlDataAvail(e) {
  console.log("Writing stream data");
  recordedChunks.push(e.data);
}

async function hndlStop(e) {
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    });  
    const buffer = Buffer.from(await blob.arrayBuffer());  
    const { filePath } = await dialog.showSaveDialog({
      buttonLabel: 'Save video',
      defaultPath: `vid-${Date.now()}.webm`
    });  
    if (filePath) {
      writeFile(filePath, buffer, () => console.log('Video saved.'));
    }
}