// ================================================
// js/variables.js - VERSION SIMPLIFIÉE POUR CYD2USB
// ================================================

// Fichiers communs (bootloader + partitions) pour toutes les variantes CYD2USB
const commonBootloader = 'resources/STATIC/M/CYD/esp32_marauder.ino.bootloader.bin';
const commonPartitions = 'resources/STATIC/M/CYD/esp32_marauder.ino.partitions.bin';

// ====================== TES 3 VARIANTS CYD2USB ======================

// Marauder CYD2USB
const MCYD2USBMarauderFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/esp32_marauder_v1_4_3_20250416_cyd2usb_gps.bin',
};

// HaleHound CYD2USB
const MCYD2USBHaleHoundFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/NOM_DU_FICHIER_HALEHOUND.bin',   // ← À MODIFIER
};

// Bruce CYD2USB
const MCYD2USBBruceFiles = {
    'bootloader': commonBootloader,
    'partitions': commonPartitions,
    'firmware': 'resources/CURRENT/NOM_DU_FICHIER_BRUCE.bin',       // ← À MODIFIER
};
