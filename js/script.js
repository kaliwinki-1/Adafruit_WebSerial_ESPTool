let espStub;
const baudRates = 115200;
const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const butProgram = document.getElementById("butProgram");
const butErase = document.getElementById("butErase");
const modelSelect = document.getElementById("modelSelect");

// Utility: Sleep function
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function logMsg(text) {
    log.innerHTML += text + "<br>";
    log.scrollTop = log.scrollHeight;
}

async function clickConnect() {
    const esploaderMod = await window.esptoolPackage;
    const esploader = await esploaderMod.connect({
        log: logMsg,
        debug: () => {},
        error: (err) => logMsg("Erreur: " + err)
    });

    try {
        await esploader.initialize();
        logMsg("Connecté à : " + esploader.chipName);
        espStub = await esploader.runStub();
    } catch (err) {
        logMsg("Échec de connexion : " + err);
    }
}

async function clickProgram() {
    const selectedModel = modelSelect.value;
    
    // Mappage des variables globales de variables.js
    const modelMap = {
        "CYD2USB_MARAUDER": MCYD2USBMarauderFiles,
        "CYD2USB_HALEHOUND": MCYD2USBHaleHoundFiles,
        "CYD2USB_BRUCE": MCYD2USBBruceFiles
    };

    const files = modelMap[selectedModel];
    if (!files) {
        logMsg("Veuillez sélectionner un modèle valide.");
        return;
    }

    logMsg("Début du flashage...");

    const fileTypes = ['bootloader', 'partitions', 'firmware'];
    const offsets = [0x1000, 0x8000, 0x10000];

    for (let i = 0; i < fileTypes.length; i++) {
        const type = fileTypes[i];
        const url = files[type];
        const offset = offsets[i];

        try {
            logMsg(`Téléchargement de ${type}...`);
            const response = await fetch(url);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            
            logMsg(`Flashage de ${type} à l'adresse ${offset.toString(16)}...`);
            await espStub.flashData(buffer, (progress) => {}, offset);
            logMsg(`Succès pour ${type}`);
            await sleep(200);
        } catch (e) {
            logMsg(`Erreur sur ${type} : ` + e);
        }
    }
    logMsg("FLASHAGE TERMINÉ ! Redémarrez votre CYD.");
}

async function clickErase() {
    if (confirm("Voulez-vous vraiment effacer TOUTE la mémoire flash ?")) {
        logMsg("Effacement en cours...");
        await espStub.eraseFlash();
        logMsg("Effacement terminé.");
    }
}

// Event Listeners
butConnect.addEventListener("click", clickConnect);
butProgram.addEventListener("click", clickProgram);
butErase.addEventListener("click", clickErase);
document.getElementById("butClear").addEventListener("click", () => log.innerHTML = "");
