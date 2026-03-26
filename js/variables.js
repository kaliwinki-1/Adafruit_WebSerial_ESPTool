// ================================================
// js/variables.js - VERSION POUR TOI (3 options seulement)
// ================================================

const commonBootloader = 'resources/STATIC/M/CYD/esp32_marauder.ino.bootloader.bin';
const commonPartitions = 'resources/STATIC/M/CYD/esp32_marauder.ino.partitions.bin';

// ====================== TES 3 VARIANTS CYD2USB ======================

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
