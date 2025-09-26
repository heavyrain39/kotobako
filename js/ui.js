// js/ui.js

import { userSettings, saveSettings } from './settings.js';
import { updateStudySession, renderFlashcard } from './flashcard.js';

// DOM 요소
const body = document.body;
const contentSections = document.querySelectorAll('.content-section');
const levelSelector = document.getElementById('level-selector');
const levelCheckboxes = document.querySelectorAll('input[name="level"]');

// 화면(섹션)을 전환하는 함수
export function showSection(sectionId) {
    contentSections.forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

    // 학습 화면일 때만 레벨 선택기 표시
    levelSelector.style.visibility = (sectionId === 'study-section') ? 'visible' : 'hidden';
    levelSelector.style.opacity = (sectionId === 'study-section') ? '1' : '0';
}


// --- 테마 관리 ---
export function initializeTheme() {
    const themeButtons = document.querySelectorAll('.theme-btn');

    function setActiveTheme(themeName) {
        body.setAttribute('data-theme', themeName);
        themeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === themeName);
        });
        localStorage.setItem('kotobako-theme', themeName);
    }

    themeButtons.forEach(button => {
        button.addEventListener('click', () => setActiveTheme(button.dataset.theme));
    });

    const savedTheme = localStorage.getItem('kotobako-theme') || 'aetherial-light';
    setActiveTheme(savedTheme);
}


// --- 레벨 선택 하이라이터 ---
const labels = Array.from(document.querySelectorAll('.level-options label'));
const highlighterContainer = document.querySelector('.selection-highlighter-container');

function computeGroupsFromCheckboxes() {
    const groups = [];
    let start = -1;
    levelCheckboxes.forEach((cb, i) => {
        if (cb.checked) {
            if (start === -1) start = i;
        } else {
            if (start !== -1) {
                groups.push({ startIndex: start, endIndex: i - 1 });
                start = -1;
            }
        }
    });
    if (start !== -1) groups.push({ startIndex: start, endIndex: levelCheckboxes.length - 1 });
    return groups;
}

function rectForGroup(group) {
    const first = labels[group.startIndex];
    const last = labels[group.endIndex];
    const left = first.offsetLeft;
    const width = (last.offsetLeft + last.offsetWidth) - left;
    return { left, width };
}

export function updateSelectionHighlighter() {
    // ... (기존 로직과 동일)
    const currentHighlighters = Array.from(highlighterContainer.children);
    const endGroups = computeGroupsFromCheckboxes();

    const getKey = g => `${g.startIndex}-${g.endIndex}`;
    const endGroupKeys = new Set(endGroups.map(getKey));
    const currentGroupKeys = new Set(currentHighlighters.map(h => `${h.dataset.startIndex}-${h.dataset.endIndex}`));

    currentHighlighters.forEach(highlighter => {
        const key = `${highlighter.dataset.startIndex}-${highlighter.dataset.endIndex}`;
        if (!endGroupKeys.has(key)) {
            highlighter.classList.add('is-leaving');
            highlighter.addEventListener('transitionend', () => highlighter.remove(), { once: true });
        }
    });

    endGroups.forEach(group => {
        if (!currentGroupKeys.has(getKey(group))) {
            const r = rectForGroup(group);
            const highlighter = document.createElement('div');
            
            highlighter.className = 'selection-highlighter is-entering';
            highlighter.dataset.startIndex = group.startIndex;
            highlighter.dataset.endIndex = group.endIndex;
            highlighter.style.left = `${r.left}px`;
            highlighter.style.width = `${r.width}px`;
            
            highlighterContainer.appendChild(highlighter);

            requestAnimationFrame(() => {
                highlighter.classList.remove('is-entering');
            });
        }
    });
}

// --- 푸터 현재 연도 설정 ---
export function setFooterYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}

// --- 설정 값을 UI에 반영 ---
export function applySettingsToUI() {
    levelCheckboxes.forEach(cb => {
        cb.checked = userSettings.selectedLevels.includes(cb.value);
    });
    updateSelectionHighlighter();
    
    const shuffleBtn = document.getElementById('shuffle-btn');
    const autospeakBtn = document.getElementById('autospeak-btn');
    const furiganaBtn = document.getElementById('furigana-btn');

    shuffleBtn.classList.toggle('active', userSettings.isShuffleOn);
    autospeakBtn.classList.toggle('active', userSettings.isAutoSpeakOn);
    furiganaBtn.classList.toggle('active', userSettings.isFuriganaOn);

    autospeakBtn.querySelector('.icon-on').style.display = userSettings.isAutoSpeakOn ? 'block' : 'none';
    autospeakBtn.querySelector('.icon-off').style.display = userSettings.isAutoSpeakOn ? 'none' : 'block';
}

// --- 학습 옵션 버튼 이벤트 리스너 초기화 ---
export function initializeStudyControls() {
    const shuffleBtn = document.getElementById('shuffle-btn');
    const autospeakBtn = document.getElementById('autospeak-btn');
    const furiganaBtn = document.getElementById('furigana-btn');

    furiganaBtn.addEventListener('click', () => {
        userSettings.isFuriganaOn = !userSettings.isFuriganaOn;
        furiganaBtn.classList.toggle('active', userSettings.isFuriganaOn);
        saveSettings();
        renderFlashcard(); // 현재 카드 다시 렌더링
    });

    shuffleBtn.addEventListener('click', () => {
        userSettings.isShuffleOn = !userSettings.isShuffleOn;
        shuffleBtn.classList.toggle('active', userSettings.isShuffleOn);
        saveSettings();
        updateStudySession(); // 학습 세션 재시작
    });

    autospeakBtn.addEventListener('click', () => {
        userSettings.isAutoSpeakOn = !userSettings.isAutoSpeakOn;
        autospeakBtn.classList.toggle('active', userSettings.isAutoSpeakOn);
        saveSettings();
        autospeakBtn.querySelector('.icon-on').style.display = userSettings.isAutoSpeakOn ? 'block' : 'none';
        autospeakBtn.querySelector('.icon-off').style.display = userSettings.isAutoSpeakOn ? 'none' : 'block';
    });
    
    levelCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            userSettings.selectedLevels = Array.from(document.querySelectorAll('input[name="level"]:checked')).map(cb => cb.value);
            // 최소 1개는 선택되도록 보장
            if (userSettings.selectedLevels.length === 0) {
                checkbox.checked = true;
                userSettings.selectedLevels = [checkbox.value];
            }
            saveSettings();
            updateSelectionHighlighter();
            updateStudySession();
        });
    });
}