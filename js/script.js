<script>
let espStub;
const baudRates = 115200;
const maxLogLength = 100;

const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const butClear = document.getElementById("butClear");
const butErase = document.getElementById("butErase");
const butProgram = document.getElementById("butProgram");
const autoscroll = document.getElementById("autoscroll");
const modelSelect = document.getElementById("modelSelect");
const versionSelect = document.getElementById("versionSelect");

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
    console.error(text);
}

async function clickErase() {
    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!! CAUTION!!! THIS WILL ERASE THE FIRMWARE !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    if (window.confirm("Erase entire flash?")) {
        butErase.disabled = true;
        butProgram.disabled = true;
        try {
            logMsg("Erasing flash...");
            await espStub.eraseFlash();
            compMsg(" ---> ERASING COMPLETED!");
        } catch (e) { errorMsg(e); }
        finally { butProgram.disabled = false; }
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

    const modelFilesMap = {
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles
    };

    const selectedFiles = modelFilesMap[selectedModel];
    if (!selectedFiles) {
        errorMsg(`No files found for model: ${selectedModel}`);
        return;
    }

    const progressBarDialog = createProgressBarDialog();
    const flashMessages = document.getElementById("flashMessages");

    butErase.disabled = true;
    butProgram.disabled = true;

    initMsg(` `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` !!! FLASHING STARTED! DO NOT UNPLUG !!! `);
    initMsg(` !!! UNTIL FLASHING IS COMPLETE!! !!! `);
    initMsg(` !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! `);
    initMsg(` `);

    const fileTypes = ['bootloader', 'partitions', 'firmware'];
    const offsetsMap = {
        "CYD2USB_MARAUDER": [0x1000, 0x8000, 0x10000],
        "CYD2USB_HALEHOUND": [0x1000, 0x8000, 0x10000],
        "CYD2USB_BRUCE": [0x1000, 0x8000, 0x10000]
    };

    const updateProgressBar = (cumulativeFlashedSize) => {
        const progress = document.getElementById("progress");
        if (progress) progress.style.width = "100%";
    };

    for (let i = 0; i < fileTypes.length; i++) {
        const fileType = fileTypes[i];
        const fileResource = selectedFiles[fileType];
        const offset = offsetsMap[selectedModel][i];

        try {
            let binFile = new File([await fetch(fileResource).then(r => r.blob())], fileType + ".bin");
            let contents = await readUploadedFileAsArrayBuffer(binFile);
            await espStub.flashData(contents, updateProgressBar, offset);
            annMsg(` ---> Finished flashing ${fileType}.`);
            await sleep(100);
        } catch (e) {
            errorMsg(e);
        }
    }

    progressBarDialog.remove();
    butErase.disabled = false;
    butProgram.disabled = false;
    compMsg(" ---> FLASHING PROCESS COMPLETED!");
    logMsg("Restart the board or disconnect to use the device.");
}

function createProgressBarDialog() {
    const div = document.createElement("div");
    div.id = "progressBarDialog";
    div.style.position = "fixed";
    div.style.left = "50%";
    div.style.top = "50%";
    div.style.transform = "translate(-50%, -50%)";
    div.style.padding = "40px";
    div.style.backgroundColor = "#333333";
    div.style.border = "2px solid #6272a4";
    div.style.borderRadius = "10px";
    div.style.color = "white";
    div.style.zIndex = "1000";
    div.style.fontSize = "1.5em";
    div.innerHTML = `
        <div style="margin-bottom: 10px; color: #f8f8f2;">Flashing...</div>
        <div style="width: 100%; background-color: #44475a; border: 1px solid #e0e0e0; border-radius: 4px;">
            <div id="progress" style="width: 0%; height: 20px; background-color: #6272a4; border-radius: 4px; transition: width 0.5s ease;"></div>
        </div>
    `;
    document.body.appendChild(div);
    return div;
}

async function clickConnect() {
    // ton code original de connexion (garde-le si tu l'as déjà)
}

async function clickClear() {
    log.innerHTML = "";
}

function checkDropdowns() {
    butProgram.disabled = false;
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
</script>
