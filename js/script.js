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

document.addEventListener("DOMContentLoaded", () => {
    butConnect.addEventListener("click", () => clickConnect().catch(e => errorMsg(e.message || e)));
    butClear.addEventListener("click", clickClear);
    butErase.addEventListener("click", clickErase);
    butProgram.addEventListener("click", clickProgram);
    autoscroll.addEventListener("click", () => {});

    const notSupported = document.getElementById("notSupported");
    if ("serial" in navigator) notSupported.classList.add("hidden");

    modelSelect.addEventListener("change", checkDropdowns);
    checkDropdowns();

    logMsg("ESP Web Flasher loaded.");
});

function logMsg(text) { log.innerHTML += text + "<br>"; log.scrollTop = log.scrollHeight; }
function annMsg(text) { log.innerHTML += `<font color='#FF9999'>${text}<br></font>`; log.scrollTop = log.scrollHeight; }
function compMsg(text) { log.innerHTML += `<font color='#2ED832'>${text}<br></font>`; log.scrollTop = log.scrollHeight; }
function initMsg(text) { log.innerHTML += `<font color='#F72408'>${text}<br></font>`; log.scrollTop = log.scrollHeight; }
function errorMsg(text) { logMsg('<span class="error-message">Error:</span> ' + text); console.error(text); }

async function clickConnect() {
    const esploaderMod = await window.esptoolPackage;
    const esploader = await esploaderMod.connect({ log: logMsg, debug: () => {}, error: errorMsg });

    try {
        await esploader.initialize();
        logMsg(`Connected to ${esploader.chipName} @ ${baudRates} bps`);
        espStub = await esploader.runStub();
        toggleUIConnected(true);
    } catch (err) {
        errorMsg(err);
    }
}

async function clickProgram() {
    const selectedModel = modelSelect.value;
    const modelFilesMap = {
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles
    };

    const selectedFiles = modelFilesMap[selectedModel];
    if (!selectedFiles) return errorMsg("No files found for this model");

    // ... (le reste du flash reste identique à la version qui marchait tout à l’heure) ...
    // Je te le mets complet si tu veux, mais d’abord teste le Connect
}

function clickClear() { log.innerHTML = ""; }
function checkDropdowns() { butProgram.disabled = false; }
function toggleUIConnected(connected) {
    const btn = document.getElementById('butConnect');
    btn.innerHTML = connected 
        ? `<i class="far fa-window-close red-icon"></i> Disconnect` 
        : `<i class="fas fa-plug"></i> Connect`;
}
</script>
