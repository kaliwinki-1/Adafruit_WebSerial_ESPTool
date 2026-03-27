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
        "CYD2USB_BRUCE": MCYD2USB_BRUCElatestFiles,
        "CYD2USB_MARAUDER": MCYD2USB_MARAUDERlatestFiles,
        "CYD2USB_HALEHOUND": MCYD2USB_HALEHOUNDlatestFiles,
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
    
    // Définition des types de fichiers (4 fichiers pour SYD et HALEHOUND)
    let fileTypes = (selectedModel === "SYD" || selectedModel === "CYD2USB_HALEHOUND") 
                    ? ['bootloader', 'partitions', 'boot_app0', 'firmware'] 
                    : ['bootloader', 'partitions', 'firmware'];

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
        "CYD2USB_HALEHOUND": [0x1000, 0x8000, 0xE000, 0x10000],
        "CYD": cydOffsets, 
        "CYDNOGPS": cydOffsets, 
        "CYD2USB": cydOffsets, 
        "CYD2USBNOGPS": cydOffsets,
        "CYD2USB_BRUCE": cydOffsets, 
        "CYD2USB_MARAUDER": cydOffsets,
        "CYD24GPS": cydOffsets, 
        "CYD24NOGPS": cydOffsets, 
        "CYD24GGPS": cydOffsets, 
        "CYD24GNOGPS": cydOffsets,
        "CYD24CAPGPS": cydOffsets, 
        "CYD24CAPNOGPS": cydOffsets, 
        "CYD35GPS": cydOffsets, 
        "CYD35NOGPS": cydOffsets,
        "CYD35CAPGPS": cydOffsets, 
        "CYD35CAPNOGPS": cydOffsets, 
        "CYD32GPS": cydOffsets, 
        "CYD32NOGPS": cydOffsets,
        "CYD32CAPGPS": cydOffsets, 
        "CYD32CAPNOGPS": cydOffsets
    };

    let cumulativeFlashed = 0;
    for (let i = 0; i < fileTypes.length; i++) {
        let fileType = fileTypes[i];
        let offset = offsetsMap[selectedModel][i];
        
        try {
            let response = await fetch(selectedFiles[fileType]);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            let binBlob = await response.blob();
            let contents = await readUploadedFileAsArrayBuffer(new File([binBlob], "file.bin"));

            await espStub.flashData(contents, (fileProgress) => {
                updateProgressBar(cumulativeFlashed + fileProgress);
            }, offset);

            cumulativeFlashed += contents.byteLength;
            annMsg(` ---> Finished flashing ${fileType}.`);
        } catch (e) {
            initMsg(` Error flashing ${fileType}: ${e.message}`);
            break;
        }
    }

    progressBarDialog.remove();
    butErase.disabled = false;
    butProgram.disabled = false;
    compMsg(" ---> FLASHING PROCESS COMPLETED!");
}
