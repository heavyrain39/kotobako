// js/settings.js

// 사용자의 기본 설정을 정의합니다.
export let userSettings = {
    selectedLevels: ['N5'],
    isShuffleOn: false,
    isAutoSpeakOn: false,
    isFuriganaOn: true
};

// 설정을 localStorage에 저장하는 함수
export function saveSettings() {
    localStorage.setItem('kotobako-settings', JSON.stringify(userSettings));
}

// localStorage에서 설정을 불러오는 함수
export function loadSettings() {
    const savedSettings = localStorage.getItem('kotobako-settings');
    if (savedSettings) {
        // 저장된 설정이 있으면 기존 설정과 합칩니다.
        userSettings = { ...userSettings, ...JSON.parse(savedSettings) };
    }
}