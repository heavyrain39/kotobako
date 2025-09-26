// js/main.js

// 다른 모듈에서 필요한 함수와 변수들을 import 합니다.
import { loadSettings, saveSettings, userSettings } from './settings.js';
import { loadAllWordData } from './data.js';
import { setAllWords, showNextWord, showPrevWord, flipCard, updateStudySession } from './flashcard.js';
import { 
    showSection, 
    initializeTheme, 
    updateSelectionHighlighter, 
    setFooterYear,
    applySettingsToUI,
    initializeStudyControls
} from './ui.js';

// 앱 전체를 초기화하고 실행하는 메인 함수
async function initializeApp() {
    // 1. 기본 UI 및 설정 초기화
    setFooterYear();
    initializeTheme();
    loadSettings();
    applySettingsToUI();

    // 2. 단어 데이터를 비동기적으로 불러와 flashcard 모듈에 설정
    const flashcardContainer = document.getElementById('flashcard-container');
    flashcardContainer.innerHTML = `<div class="flashcard-message">단어 데이터를 불러오는 중입니다...</div>`;
    const allWords = await loadAllWordData();
    setAllWords(allWords);
    if (allWords.length === 0) {
        flashcardContainer.innerHTML = `<div class="flashcard-message">단어 데이터를 불러오는 데 실패했습니다. 콘솔을 확인해주세요.</div>`;
    }

    // 3. 네비게이션 및 컨트롤 이벤트 리스너 설정
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
            // '단어 공부' 타일을 클릭했을 때만 학습 세션을 시작
            if (targetSectionId === 'study-section') {
                updateStudySession(true);
            }
            showSection(targetSectionId);
        });
    });

    // 플래시카드 좌/우 이동 버튼
    document.getElementById('next-word-btn').addEventListener('click', showNextWord);
    document.getElementById('prev-word-btn').addEventListener('click', showPrevWord);
    
    // 학습 옵션(후리가나, 섞기, 자동재생) 버튼
    initializeStudyControls();

    // 키보드 단축키
    document.addEventListener('keydown', (e) => {
        if (document.getElementById('study-section').style.display !== 'block') return;
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        switch (e.key) {
            case 'ArrowRight': showNextWord(); break;
            case 'ArrowLeft': showPrevWord(); break;
            case ' ': e.preventDefault(); flipCard(); break;
        }
    });
    
    // 창 크기 변경 시 레벨 선택기 하이라이터 업데이트
    window.addEventListener('resize', updateSelectionHighlighter);

    // 4. 초기 화면 표시
    showSection('home-section');
}

// DOM이 모두 로드되면 앱 실행
document.addEventListener('DOMContentLoaded', initializeApp);