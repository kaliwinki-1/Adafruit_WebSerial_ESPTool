<script>
// ====================== js/script.js MODIFIÉ ======================

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
//const versionSelect = document.getElementById("versionSelect");
//const variantSelect = document.getElementById("variantSelect");
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
        notSupported.classList.add("hidden");
    } else {
        notSupported.classList.remove("hidden");
    }

    modelSelect.addEventListener("change", checkDropdowns);
    checkDropdowns();

    logMsg("ESP Web Flasher loaded.");
});

function logMsg(text) { ... }          // (tout le reste inchangé)
function annMsg(text) { ... }
function compMsg(text) { ... }
function initMsg(text) { ... }
function debugMsg(...args) { ... }
function errorMsg(text) { ... }
function enableStyleSheet(node, enabled) { ... }
function formatMacAddr(macAddr) { ... }
function updateTheme() { ... }
async function clickAutoscroll() { ... }
async function clickConnect() { ... }
async function changeBaudRate() { ... }
function createProgressBarDialog() { ... }
async function clickDarkMode() { ... }
async function clickErase() { ... }

async function clickProgram() {
    const readUploadedFileAsArrayBuffer = (inputFile) => { ... };   // inchangé

    const selectedModel = modelSelect.value;
    const selectedVersion = versionSelect.value;

    const progressBarDialog = createProgressBarDialog();
    const progress = document.getElementById("progress");
    let selectedFiles;

    // ====================== MODIFICATION 1 : modelFilesMap ======================
    const modelFilesMap = {
        "SYD": MSYDlatestFiles,
        "CYD": MCYDlatestFiles,
        "CYDNOGPS": MCYDNOGPSlatestFiles,
        
        // === TES 3 OPTIONS CYD2USB ===
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles,

        // (les autres modèles restent si tu veux les réactiver plus tard)
        "CYD2USBNOGPS": MCYD2USBNOGPSlatestFiles,
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
        if (!selectedFiles) {
            console.error(`No files found for model: ${selectedModel}`);
            return;
        }
    } else {
        console.error(`Unsupported version: ${selectedVersion}`);
        return;
    }

    // ... (tout le reste du code clickProgram reste IDENTIQUE) ...

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
    let fileTypes;

    if (selectedModel === "SYD") {
        fileTypes = ['bootloader', 'partitions', 'boot_app0', 'firmware'];
    } else {
        fileTypes = ['bootloader', 'partitions', 'firmware'];
    }

    // ... (calcul de la taille et la boucle de flash restent inchangés) ...

    const offsetsMap = {
        "SYD": [0x0, 0x8000, 0xE000, 0x10000],
        "CYD": [0x1000, 0x8000, 0x10000],
        "CYDNOGPS": [0x1000, 0x8000, 0x10000],
        
        // ====================== MODIFICATION 2 : offsetsMap ======================
        "CYD2USB": [0x1000, 0x8000, 0x10000],
        "CYD2USB_MARAUDER": [0x1000, 0x8000, 0x10000],
        "CYD2USB_HALEHOUND": [0x1000, 0x8000, 0x10000],
        "CYD2USB_BRUCE": [0x1000, 0x8000, 0x10000],

        "CYD2USBNOGPS": [0x1000, 0x8000, 0x10000],
        "CYD24NOGPS": [0x1000, 0x8000, 0x10000],
        "CYD24GPS": [0x1000, 0x8000, 0x10000],
        "CYD24GNOGPS": [0x1000, 0x8000, 0x10000],
        "CYD24GGPS": [0x1000, 0x8000, 0x10000],
        "CYD24CAPNOGPS": [0x1000, 0x8000, 0x10000],
        "CYD24CAPGPS": [0x1000, 0x8000, 0x10000],
        "CYD35NOGPS": [0x1000, 0x8000, 0x10000],
        "CYD35GPS": [0x1000, 0x8000, 0x10000],
        "CYD35CAPNOGPS": [0x1000, 0x8000, 0x10000],
        "CYD35CAPGPS": [0x1000, 0x8000, 0x10000],
        "CYD32NOGPS": [0x1000, 0x8000, 0x10000],
        "CYD32GPS": [0x1000, 0x8000, 0x10000],
        "CYD32CAPNOGPS": [0x1000, 0x8000, 0x10000],
        "CYD32CAPGPS": [0x1000, 0x8000, 0x10000]
    };

    // Flash each file in sequence...
    for (let fileType of fileTypes) {
        let fileResource = selectedFiles[fileType];
        let offset = offsetsMap[selectedModel][fileTypes.indexOf(fileType)];

        try {
            let binFile = new File([await fetch(fileResource).then(r => r.blob())], fileType + ".bin");
            let contents = await readUploadedFileAsArrayBuffer(binFile);

            await espStub.flashData(
                contents,
                (cumulativeFlashedSize) => updateProgressBar(cumulativeFlashedSize),
                offset
            );

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

async function clickClear() { ... }           // reste inchangé
function convertJSON(chunk) { ... }
function toggleUIToolbar(show) { ... }
function toggleUIConnected(connected) { ... }
function loadSetting(setting, defaultValue) { ... }
function saveSetting(setting, value) { ... }
function ucWords(text) { ... }
function sleep(ms) { ... }

</script>
