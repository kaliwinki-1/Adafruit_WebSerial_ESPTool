// ================================================
// js/variables.js - CORRIGÉ POUR TES NOMS DE FICHIERS
// ================================================

const commonBootloader = 'resources/STATIC/M/CYD/esp32_marauder.ino.bootloader.bin';
const commonPartitions = 'resources/STATIC/M/CYD/esp32_marauder.ino.partitions.bin';

// ====================== TES 3 VARIANTS ======================

const MCYD2USBMarauderFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/marauder.bin',
};

const MCYD2USBHaleHoundFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/halehound.bin',
};

const MCYD2USBBruceFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/bruce.bin',
};
