let espStub;

const baudRates = 115200;

const bufferSize = 512;
const colors = ["#00a7e9", "#f89521", "#be1e2d"];
const measurementPeriodId = "0001";

const maxLogLength = 100;
const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const butClear = document.getElementById("butClear");
const butErase = document.getElementById("butErase");
const butProgram = document.getElementById("butProgram");
const autoscroll = document.getElementById("autoscroll");
const lightSS = document.getElementById("light");
const darkSS = document.getElementById("dark");
const darkMode = document.getElementById("darkmode");
const modelSelect = document.getElementById("modelSelect");
const versionSelect = document.getElementById("versionSelect");
const offsets = [0x1000, 0x8000, 0xE000, 0x10000];
const offsets2 = [0x0, 0x8000, 0xE000, 0x10000];

const appDiv = document.getElementById("app");

document.getElementById('butConnect').addEventListener('click', function() {
    var icon = this.querySelector('i');
    if (icon.classList.contains('green-icon')) {
        icon.classList.remove('green-icon');
    } else {
        icon.classList.add('green-icon');
    }
});

document.addEventListener("DOMContentLoaded", () => {
    butConnect.addEventListener("click", () => {
        clickConnect().catch(async (e) => {
            console.error(e);
            errorMsg(e.message || e);
            if (espStub) {
                await espStub.disconnect();
            }
            toggleUIConnected(false);
        });
    });
    butClear.addEventListener("click", clickClear);
    butErase.addEventListener("click", clickErase);
    butProgram.addEventListener("click", clickProgram);
    autoscroll.addEventListener("click", clickAutoscroll);
    
    window.addEventListener("error", function (event) {
        console.log("Got an uncaught error: ", event.error);
    });

    const notSupported = document.getElementById("notSupported");
    if ("serial" in navigator) {
        if(notSupported) notSupported.classList.add("hidden"); 
    } else {
        if(notSupported) notSupported.classList.remove("hidden");
    }

    modelSelect.addEventListener("change", checkDropdowns);
  
    function checkDropdowns() {
        butProgram.disabled = false;
    }

    checkDropdowns();
    logMsg("ESP Web Flasher loaded.");
});

function logMsg(text) {
    log.innerHTML += text + "<br>";
    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }
    log.scrollTop = log.scrollHeight;
}

function annMsg(text) {
    log.innerHTML += `<font color='#FF9999'>` + text + `<br></font>`;
    log.scrollTop = log.scrollHeight;
}

function compMsg(text) {
    log.innerHTML += `<font color='#2ED832'>` + text + `<br></font>`;
    log.scrollTop = log.scrollHeight;
}

function initMsg(text) {
    log.innerHTML += `<font color='#F72408'>` + text + `<br></font>`;
    log.scrollTop = log.scrollHeight;
}

function errorMsg(text) {
    logMsg('<span class="error-message">Error:</span> ' + text);
    console.log(text);
}

function formatMacAddr(macAddr) {
    return macAddr
        .map((value) => value.toString(16).toUpperCase().padStart(2, "0"))
        .join(":");
}

async function clickAutoscroll() {
  saveSetting("autoscroll", autoscroll.checked);
}

async function clickConnect() {
    if (espStub) {
        await espStub.disconnect();
        await espStub.port.close();
        toggleUIConnected(false);
        espStub = undefined;
        return;
    }

    const esploaderMod = await window.esptoolPackage;
    const esploader = await esploaderMod.connect({
        log: logMsg,
        debug: debugMsg,
        error: errorMsg
    });

    try {
        await esploader.initialize();
        logMsg(`Connected to ${esploader.chipName} @ ${baudRates} bps`);
        logMsg(`MAC Address: ${formatMacAddr(esploader.macAddr())}`);

        espStub = await esploader.runStub();
        toggleUIConnected(true);
        toggleUIToolbar(true);

        espStub.addEventListener("disconnect", () => {
            toggleUIConnected(false);
            espStub = undefined;
        });
    } catch (err) {
        await esploader.disconnect();
        throw err;
    }
}

function createProgressBarDialog() {
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = `
        @keyframes blink { 50% { opacity: 0; } }
        .blinking-text { animation: blink 1s linear infinite; }
    `;
    document.head.appendChild(styleSheet);

    const progressBarDialog = document.createElement("div");
    progressBarDialog.id = "progressBarDialog";
    progressBarDialog.style.position = "fixed";
    progressBarDialog.style.left = "50%";
    progressBarDialog.style.top = "50%";
    progressBarDialog.style.transform = "translate(-50%, -50%)";
    progressBarDialog.style.padding = "40px"; 
    progressBarDialog.style.backgroundColor = "#333333";
    progressBarDialog.style.border = "2px solid #6272a4";
    progressBarDialog.style.borderRadius = "10px";
    progressBarDialog.style.color = "white";
    progressBarDialog.style.zIndex = "1000";
    progressBarDialog.style.fontSize = "1.5em"; 
    progressBarDialog.style.width = "50%";
    progressBarDialog.style.boxSizing = "border-box";
    progressBarDialog.innerHTML = `
        <div class="blinking-text" style="margin-bottom: 10px; color: #f8f8f2;">Flashing...</div>
        <div id="progressBar" style="width: 100%; background-color: #44475a; border: 1px solid #e0e0e0; border-radius: 4px;">
            <div id="progress" style="width: 0%; height: 20px; background-color: #6272a4; border-radius: 4px; transition: width 0.5s ease;"></div>
        </div>
        <div style="margin-top: 10px; color: #FF9999; font-style: italic; font-size: 16px;">Flashing process will take at least 2 minutes.</div>
    `;
    document.body.appendChild(progressBarDialog);
    return progressBarDialog;
}

async function clickErase() {
    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!!             CAUTION!!!             !!! `);
    initMsg(` !!!  THIS WILL ERASE THE FIRMWARE ON  !!! `);
    initMsg(` !!!   YOUR DEVICE! THIS CAN NOT BE    !!! `);
    initMsg(` !!!               UNDONE!             !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    if (window.confirm("This will erase the entire flash. Click OK to continue.")) {
        butErase.disabled = true;
        butProgram.disabled = true;
        try {
            logMsg("Erasing flash memory. Please wait...");
            let stamp = Date.now();
            await espStub.eraseFlash();
            logMsg(`Finished. Took ${(Date.now() - stamp)}ms to erase.`);
            compMsg(" ---> ERASING PROCESS COMPLETED!");
        } catch (e) {
            errorMsg(e);
        } finally {
            butProgram.disabled = false;
        }
    }
}

async function clickProgram() {
    const readUploadedFileAsArrayBuffer = (inputFile) => {
        const reader = new FileReader();
        return new Promise((resolve, reject) => {
            reader.onerror = () => { reader.abort(); reject(new DOMException("Problem parsing input file.")); };
            reader.onload = () => { resolve(reader.result); };
            reader.readAsArrayBuffer(inputFile);
        });
    };

    const selectedModel = modelSelect.value;
    const selectedVersion = versionSelect.value;
    const progressBarDialog = createProgressBarDialog();
    const progress = document.getElementById("progress"); 

    let selectedFiles;
    const modelFilesMap = {
        "SYD": MSYDlatestFiles,
        "CYD": MCYDlatestFiles,
        "CYDNOGPS": MCYDNOGPSlatestFiles,
        "CYD2USB": MCYD2USBlatestFiles,
        "CYD2USBNOGPS": MCYD2USBNOGPSlatestFiles,
        "CYD2USB_BRUCE": MCYD2USB_BRUCElatestFiles,   // AJOUT
        "CYD2USB_MARAUDER": MCYD2USB_MARAUDERlatestFiles, // AJOUT
        "CYD2USB_HALEHOUND": MCYD2USB_HALEHOUNDlatestFiles, // AJOUT
        "CYD24NOGPS": MCYD24NOGPSlatestFiles,
        "CYD24GPS": MCYD24GPSlatestFiles,
        "CYD24GNOGPS": MCYD24GNOGPSlatestFiles,
        "CYD24GGPS": MCYD24GGPSlatestFiles,
        "CYD24CAPNOGPS": MCYD24CAPNOGPSlatestFiles,
        "CYD24CAPGPS": MCYD24CAPGPSlatestFiles,
        "CYD35NOGPS": MCYD35NOGPSlatestFiles,
        "CYD35GPS": MCYD35GPSlatestFiles,
        "CYD35CAPNOGPS": MCYD35CAPNOGPSlatestFiles,
        "CYD35CAPGPS": MCYD35CAPGPSlatestFiles,
        "CYD32NOGPS": MCYD32NOGPSlatestFiles,
        "CYD32GPS": MCYD32GPSlatestFiles,
        "CYD32CAPNOGPS": MCYD32CAPNOGPSlatestFiles,
        "CYD32CAPGPS": MCYD32CAPGPSlatestFiles
    };

    if (selectedVersion === "latest") {
        selectedFiles = modelFilesMap[selectedModel];
        if (!selectedFiles) { return; }
    }

    butErase.disabled = true;
    butProgram.disabled = true;

    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!!   FLASHING STARTED! DO NOT UNPLUG   !!! `);
    initMsg(` !!!    UNTIL FLASHING IS COMPLETE!!     !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);

    let totalSize = 0;
    let flashedSize = 0;
    let fileTypes = (selectedModel === "SYD") ? ['bootloader', 'partitions', 'boot_app0', 'firmware'] : ['bootloader', 'partitions', 'firmware'];

    for (let fileType of fileTypes) {
        let response = await fetch(selectedFiles[fileType], { method: 'HEAD' });
        totalSize += parseInt(response.headers.get('content-length') || 0, 10);
    }

    const updateProgressBar = (cumulativeFlashedSize) => {
        const progressPercentage = Math.min((cumulativeFlashedSize / totalSize) * 100, 100);
        if (progress) progress.style.width = `${progressPercentage}%`;
    };

    const cydOffsets = [0x1000, 0x8000, 0x10000];
    const offsetsMap = {
        "SYD": [0x0, 0x8000, 0xE000, 0x10000],
        "CYD": cydOffsets, "CYDNOGPS": cydOffsets, "CYD2USB": cydOffsets, "CYD2USBNOGPS": cydOffsets,
        "CYD2USB_BRUCE": cydOffsets, "CYD2USB_MARAUDER": cydOffsets, "CYD2USB_HALEHOUND": cydOffsets, // AJOUTS
        "CYD24GPS": cydOffsets, "CYD24NOGPS": cydOffsets, "CYD24GGPS": cydOffsets, "CYD24GNOGPS": cydOffsets,
        "CYD24CAPGPS": cydOffsets, "CYD24CAPNOGPS": cydOffsets, "CYD35GPS": cydOffsets, "CYD35NOGPS": cydOffsets,
        "CYD35CAPGPS": cydOffsets, "CYD35CAPNOGPS": cydOffsets, "CYD32GPS": cydOffsets, "CYD32NOGPS": cydOffsets,
        "CYD32CAPGPS": cydOffsets, "CYD32CAPNOGPS": cydOffsets
    };

    let cumulativeFlashed = 0;
    for (let i = 0; i < fileTypes.length; i++) {
        let fileType = fileTypes[i];
        let offset = offsetsMap[selectedModel][i];
        let binBlob = await fetch(selectedFiles[fileType]).then(r => r.blob());
        let contents = await readUploadedFileAsArrayBuffer(new File([binBlob], "file.bin"));

        await espStub.flashData(contents, (fileProgress) => {
            updateProgressBar(cumulativeFlashed + fileProgress);
        }, offset);

        cumulativeFlashed += contents.byteLength;
        annMsg(` ---> Finished flashing ${fileType}.`);
    }

    progressBarDialog.remove();
    butErase.disabled = false;
    butProgram.disabled = false;
    compMsg(" ---> FLASHING PROCESS COMPLETED!");
}

async function clickClear() { log.innerHTML = ""; }
function toggleUIToolbar(show) { appDiv.classList.toggle("connected", show); butErase.disabled = !show; }
function toggleUIConnected(connected) {
    let icon = connected ? `<i class="far fa-window-close red-icon"></i> Disconnect` : `<i class="fas fa-plug"></i> Connect`;
    butConnect.innerHTML = icon;
    if (!connected) toggleUIToolbar(false);
}
function saveSetting(setting, value) { window.localStorage.setItem(setting, JSON.stringify(value)); }
function debugMsg() {} // Placeholder pour éviter les erreurs si appelé
