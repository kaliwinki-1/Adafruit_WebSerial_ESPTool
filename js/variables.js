// ================================================
// js/variables.js - VERSION SIMPLIFIÉE CYD2USB
// ================================================

// Fichiers communs pour toutes les variantes CYD2USB
const commonBootloader = 'resources/STATIC/M/CYD/esp32_marauder.ino.bootloader.bin';
const commonPartitions = 'resources/STATIC/M/CYD/esp32_marauder.ino.partitions.bin';

// ====================== VARIANTS CYD2USB ======================

// Marauder CYD2USB
const MCYD2USBMarauderFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/marauder.bin',
};

// HaleHound CYD2USB
const MCYD2USBHaleHoundFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/halehound.bin',
};

// Bruce CYD2USB
const MCYD2USBBruceFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/bruce.bin',
};
