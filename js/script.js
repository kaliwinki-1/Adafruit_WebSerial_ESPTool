let espStub;
const baudRates = 115200;
const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const butDisconnect = document.getElementById("butDisconnect");
const butProgram = document.getElementById("butProgram");
const butErase = document.getElementById("butErase");
const modelSelect = document.getElementById("modelSelect");
const versionSelect = document.getElementById("versionSelect");
const appDiv = document.getElementById("app");

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function logMsg(text) {
    log.innerHTML += text + "<br>";
    log.scrollTop = log.scrollHeight;
}

function formatMacAddr(macAddr) {
    return macAddr.map((value) => value.toString(16).toUpperCase().padStart(2, "0")).join(":");
}

async function clickConnect() {
    if (espStub) {
        await espStub.disconnect();
        toggleUIConnected(false);
        espStub = undefined;
        return;
    }

    const esploaderMod = await window.esptoolPackage;
    const esploader = await esploaderMod.connect({
        log: logMsg,
        debug: () => {},
        error: (err) => logMsg("Erreur: " + err)
    });

    try {
        await esploader.initialize();
        logMsg(`Connecté à ${esploader.chipName} | MAC: ${formatMacAddr(esploader.macAddr())}`);
        espStub = await esploader.runStub();
        toggleUIConnected(true);
    } catch (err) {
        logMsg("Échec de connexion : " + err);
        await esploader.disconnect();
    }
}

async function clickProgram() {
    const selectedModel = modelSelect.value;
    const modelMap = {
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles
    };

    const files = modelMap[selectedModel];
    if (!files || selectedModel === "NULL") {
        alert("Veuillez d'abord sélectionner un modèle dans la liste.");
        return;
    }

    butProgram.disabled = true;
    butErase.disabled = true;
    logMsg("<br><b>--- LANCEMENT DU FLASHAGE ---</b>");

    // Offsets standards pour ESP32
    const fileTypes = ['bootloader', 'partitions', 'firmware'];
    const offsets = [0x1000, 0x8000, 0x10000];

    for (let i = 0; i < fileTypes.length; i++) {
        const type = fileTypes[i];
        const url = files[type];
        const offset = offsets[i];

        try {
            logMsg(`Chargement de ${type} (${url})...`);
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Fichier introuvable sur le serveur (Erreur ${response.status})`);
            }

            const buffer = await response.arrayBuffer();
            
            logMsg(`Écriture à l'adresse 0x${offset.toString(16)}...`);
            await espStub.flashData(buffer, (progress) => {
                // Barre de progression simplifiée dans le log
            }, offset);
            
            logMsg(`<font color="#2ED832">Succès pour ${type}</font>`);
            await sleep(100);
        } catch (e) {
            logMsg(`<font color="red">ERREUR CRITIQUE : ${e.message}</font>`);
            logMsg("Vérifiez que le nom du fichier sur GitHub correspond exactement à variables.js");
            break;
        }
    }

    logMsg("<b>--- OPÉRATION TERMINÉE ---</b>");
    butProgram.disabled = false;
    butErase.disabled = false;
}

async function clickErase() {
    if (confirm("Voulez-vous vraiment effacer TOUTE la mémoire de l'ESP32 ?")) {
        try {
            logMsg("Effacement en cours, veuillez patienter...");
            await espStub.eraseFlash();
            logMsg("<font color="#2ED832">Mémoire flash effacée avec succès.</font>");
        } catch (e) {
            logMsg("Erreur lors de l'effacement : " + e);
        }
    }
}

function toggleUIConnected(connected) {
    if (connected) {
        butConnect.style.display = "none";
        butDisconnect.style.display = "inline-block";
        appDiv.classList.add("connected");
    } else {
        butConnect.style.display = "inline-block";
        butDisconnect.style.display = "none";
        appDiv.classList.remove("connected");
    }
}

// Listeners
butConnect.addEventListener("click", clickConnect);
butDisconnect.addEventListener("click", clickConnect);
butProgram.addEventListener("click", clickProgram);
butErase.addEventListener("click", clickErase);
document.getElementById("butClear").addEventListener("click", () => log.innerHTML = "");
