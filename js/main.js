// js/main.js

import { loadSettings, saveSettings, userSettings } from './settings.js';
import { loadAllWordData } from './data.js';
import { loadProgress } from './progress.js';
import { loadStats } from './stats.js';
import { setAllWords, showNextWord, showPrevWord, flipCard, updateStudySession } from './flashcard.js';
import { 
    showSection, 
    initializeTheme, 
    updateSelectionHighlighter, 
    updateDifficultyHighlighter,
    setFooterYear,
    applySettingsToUI,
    initializeStudyControls,
    updateGreeting,
    initializeStatsPage,
    currentSectionId
} from './ui.js';

async function initializeApp() {
    setFooterYear();
    initializeTheme();
    loadSettings();
    loadProgress();
    loadStats();
    applySettingsToUI();
    updateGreeting();
    
    const flashcardContainer = document.getElementById('flashcard-container');
    flashcardContainer.innerHTML = `<div class="flashcard-message">단어 데이터를 불러오는 중입니다...</div>`;
    const allWords = await loadAllWordData();
    setAllWords(allWords);
    if (allWords.length === 0) {
        flashcardContainer.innerHTML = `<div class="flashcard-message">단어 데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.</div>`;
    }

    const logoLink = document.getElementById('logo-link');
    const menuTiles = document.querySelectorAll('.menu-tile:not(.disabled)');
    
    logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection('home-section');
    });

    menuTiles.forEach(tile => {
        tile.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSectionId = tile.dataset.section;

            showSection(targetSectionId);

            if (targetSectionId === 'study-section') {
                updateStudySession(true);
                requestAnimationFrame(updateDifficultyHighlighter);
            }
            if (targetSectionId === 'stats-section') {
                initializeStatsPage();
            }
        });
    });

    document.getElementById('next-word-btn').addEventListener('click', showNextWord);
    document.getElementById('prev-word-btn').addEventListener('click', showPrevWord);
    
    initializeStudyControls();

    document.addEventListener('keydown', (e) => {
        if (currentSectionId !== 'study-section') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight': showNextWord(); break;
            case 'ArrowLeft': showPrevWord(); break;
            case ' ': e.preventDefault(); flipCard(); break;
        }
    });
    
    window.addEventListener('resize', () => {
        updateSelectionHighlighter();
        if (currentSectionId === 'study-section') {
            updateDifficultyHighlighter();
        }
    });

    // [수정] 마지막으로 본 섹션을 불러오거나, 없으면 홈 섹션을 보여줌
    const lastSection = localStorage.getItem('kotobako-last-section') || 'home-section';
    showSection(lastSection);
    // [추가] 마지막 섹션에 따라 필요한 초기화 함수 호출
    if (lastSection === 'study-section') {
        updateStudySession(true);
        requestAnimationFrame(updateDifficultyHighlighter);
    } else if (lastSection === 'stats-section') {
        initializeStatsPage();
    }
}

document.addEventListener('DOMContentLoaded', initializeApp);