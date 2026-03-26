<script>
// ====================== js/script.js - VERSION CORRIGÉE ET SIMPLIFIÉE ======================

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
            if (espStub) await espStub.disconnect();
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
        notSupported.classList.add("hidden");
    } else {
        notSupported.classList.remove("hidden");
    }

    modelSelect.addEventListener("change", checkDropdowns);
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
    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }
    log.scrollTop = log.scrollHeight;
}

function compMsg(text) {
    log.innerHTML += `<font color='#2ED832'>` + text + `<br></font>`;
    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }
    log.scrollTop = log.scrollHeight;
}

function initMsg(text) {
    log.innerHTML += `<font color='#F72408'>` + text + `<br></font>`;
    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }
    log.scrollTop = log.scrollHeight;
}

function debugMsg(...args) { /* garde tel quel si tu veux, sinon vide */ }
function errorMsg(text) {
    logMsg('<span class="error-message">Error:</span> ' + text);
    console.log(text);
}

function enableStyleSheet(node, enabled) { /* non utilisé */ }
function formatMacAddr(macAddr) {
    return macAddr.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join(":");
}

async function clickAutoscroll() { /* non utilisé */ }
async function clickConnect() { /* ton code original */ }
async function changeBaudRate() { /* non utilisé */ }
function createProgressBarDialog() { /* ton code original */ }
async function clickDarkMode() { /* non utilisé */ }

async function clickErase() {
    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; CAUTION!!! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; !!! `);
    initMsg(` !!! &nbsp;&nbsp;THIS WILL ERASE THE FIRMWARE ON&nbsp; !!! `);
    initMsg(` !!! &nbsp;&nbsp;&nbsp;YOUR DEVICE! THIS CAN NOT BE &nbsp;&nbsp; !!! `);
    initMsg(` !!! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; UNDONE! &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` `);
    if (window.confirm("This will erase the entire flash. Click OK to continue.")) {
        butErase.disabled = true;
        butProgram.disabled = true;
        try {
            logMsg("Erasing flash memory. Please wait...");
            let stamp = Date.now();
            await espStub.eraseFlash();
            logMsg(`Finished. Took <font color="yellow">` + (Date.now() - stamp) + `ms</font> to erase.`);
            compMsg(" ");
            compMsg(" ---> ERASING PROCESS COMPLETED!");
            compMsg(" ");
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
            reader.onload = () => resolve(reader.result);
            reader.readAsArrayBuffer(inputFile);
        });
    };

    const selectedModel = modelSelect.value;
    const selectedVersion = versionSelect.value;   // même si le select est commenté, on garde pour compatibilité

    const progressBarDialog = createProgressBarDialog();
    let selectedFiles;

    // ====================== SEULEMENT TES 3 VARIANTS ======================
    const modelFilesMap = {
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles
    };

    if (selectedVersion === "latest") {
        selectedFiles = modelFilesMap[selectedModel];
        if (!selectedFiles) {
            errorMsg(`No files found for model: ${selectedModel}`);
            progressBarDialog.remove();
            return;
        }
    } else {
        errorMsg(`Unsupported version: ${selectedVersion}`);
        progressBarDialog.remove();
        return;
    }

    const flashMessages = document.getElementById("flashMessages");
    butErase.disabled = true;
    butProgram.disabled = true;

    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!! FLASHING STARTED! DO NOT UNPLUG !!! `);
    initMsg(` !!! UNTIL FLASHING IS COMPLETE!! !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` `);

    flashMessages.innerHTML = "";

    let totalSize = 0;
    let flashedSize = 0;
    let fileTypes = ['bootloader', 'partitions', 'firmware'];

    // ====================== SEULEMENT TES 3 VARIANTS ======================
    const offsetsMap = {
        "CYD2USB_MARAUDER": [0x1000, 0x8000, 0x10000],
        "CYD2USB_HALEHOUND": [0x1000, 0x8000, 0x10000],
        "CYD2USB_BRUCE": [0x1000, 0x8000, 0x10000]
    };

    const updateProgressBar = (cumulativeFlashedSize) => {
        flashedSize = cumulativeFlashedSize;
        const progressPercentage = Math.min((flashedSize / totalSize) * 100, 100);
        const progressBar = document.getElementById("progress");
        if (progressBar) progressBar.style.width = `${progressPercentage}%`;
    };

    // Flash each file
    for (let fileType of fileTypes) {
        let fileResource = selectedFiles[fileType];
        let offset = offsetsMap[selectedModel][fileTypes.indexOf(fileType)];

        try {
            let binFile = new File([await fetch(fileResource).then(r => r.blob())], fileType + ".bin");
            let contents = await readUploadedFileAsArrayBuffer(binFile);

            await espStub.flashData(contents, updateProgressBar, offset);

            updateProgressBar(totalSize);
            annMsg(` ---> Finished flashing ${fileType}.`);
            annMsg(` `);
            await sleep(100);
        } catch (e) {
            errorMsg(e);
        }
    }

    progressBarDialog.remove();
    butErase.disabled = false;
    butProgram.disabled = false;
    flashMessages.style.display = "none";
    compMsg(" ---> FLASHING PROCESS COMPLETED!");
    compMsg(" ");
    logMsg("Restart the board or disconnect to use the device.");
}

async function clickClear() {
    log.innerHTML = "";
}

function toggleUIToolbar(show) {
    if (show) appDiv.classList.add("connected");
    else appDiv.classList.remove("connected");
    butErase.disabled = !show;
}

function toggleUIConnected(connected) {
    let label = "Connect";
    let iconClass = "fas fa-plug";
    if (connected) {
        label = "Disconnect";
        iconClass = "far fa-window-close red-icon";
    }
    document.getElementById('butConnect').innerHTML = `<i class="${iconClass}"></i> ${label}`;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function checkDropdowns() {
    butProgram.disabled = false;   // on garde toujours actif
}
</script>
