// js/ui.js

import { userSettings, saveSettings } from './settings.js';
import { updateStudySession, renderFlashcard, getCurrentWord } from './flashcard.js';
import { updateWordDifficulty } from './progress.js';
// [수정] getChartData 함수 추가로 import
import { getUserName, setUserName, getCumulativeStats, calculateDetailedStats, getChartData } from './stats.js';

const body = document.body;
const contentSections = document.querySelectorAll('.content-section');
const levelSelector = document.getElementById('level-selector');
const levelCheckboxes = document.querySelectorAll('input[name="level"]');

export let currentSectionId = '';

// [추가] 차트 인스턴스를 저장할 변수
let cardsChartInstance = null;

// [추가] 차트를 렌더링하는 함수
function renderStatsChart() {
    if (cardsChartInstance) {
        cardsChartInstance.destroy(); // 기존 차트가 있으면 파괴
    }

    const chartData = getChartData();
    const ctx = document.getElementById('cards-viewed-chart');
    if (!ctx) return;

    // 현재 테마에 맞는 색상 가져오기
    const style = getComputedStyle(document.body);
    const accentColor = style.getPropertyValue('--color-accent').trim();
    const textColor = style.getPropertyValue('--color-text-secondary').trim();
    const gridColor = style.getPropertyValue('--color-border').trim();

    cardsChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: '본 카드 수',
                data: chartData.data,
                backgroundColor: accentColor + '33', // 투명도 33 추가
                borderColor: accentColor,
                borderWidth: 2,
                pointBackgroundColor: accentColor,
                pointRadius: 4,
                tension: 0.3, // 라인을 부드럽게
                fill: true,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor },
                    ticks: { 
                        color: textColor,
                        font: { family: "'Pretendard Variable', sans-serif" },
                        precision: 0 // y축 정수만 표시
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: { 
                        color: textColor,
                        font: { family: "'Pretendard Variable', sans-serif" }
                    }
                }
            },
            plugins: {
                legend: { display: false }, // 범례 숨기기
                tooltip: {
                    backgroundColor: style.getPropertyValue('--color-surface').trim(),
                    titleColor: style.getPropertyValue('--color-text-primary').trim(),
                    bodyColor: style.getPropertyValue('--color-text-secondary').trim(),
                    boxPadding: 8,
                    padding: 10,
                    titleFont: { family: "'Pretendard Variable', sans-serif", size: 14, weight: '600'},
                    bodyFont: { family: "'Pretendard Variable', sans-serif", size: 12 },
                }
            }
        }
    });
}

export function updateGreeting() {
    const greetingEl = document.getElementById('greeting');
    if (!greetingEl) return;
    const userName = getUserName();
    const greetings = [ `안녕하세요, ${userName}님!`, `${userName}님, 오늘도 힘내세요!`, `반가워요, ${userName}님. 시작해 볼까요?`, `${userName}님의 일본어 실력을 응원합니다.`, `꾸준함이 실력! ${userName}님을 위한 단어장입니다.` ];
    greetingEl.textContent = greetings[Math.floor(Math.random() * greetings.length)];
}

export function initializeStatsPage() {
    const statsGreetingEl = document.getElementById('stats-greeting');
    const changeNameBtn = document.getElementById('change-name-btn');
    const userName = getUserName();
    if (statsGreetingEl) statsGreetingEl.textContent = `${userName}님의 학습 기록`;

    if (changeNameBtn && !changeNameBtn.dataset.listenerAttached) {
        changeNameBtn.addEventListener('click', () => {
            const newName = prompt('사용할 이름을 입력해주세요.', userName);
            if (newName) {
                setUserName(newName);
                updateGreeting();
                statsGreetingEl.textContent = `${getUserName()}님의 학습 기록`;
            }
        });
        changeNameBtn.dataset.listenerAttached = 'true';
    }

    const stats = getCumulativeStats();
    const detailedStats = calculateDetailedStats();
    const totalStudyDaysEl = document.getElementById('total-study-days');
    const totalCardsViewedEl = document.getElementById('total-cards-viewed');
    const totalQuizzesPlayedEl = document.getElementById('total-quizzes-played');
    const consecutiveDaysDetailEl = document.getElementById('consecutive-days-detail');
    const todayCardsViewedDetailEl = document.getElementById('today-cards-viewed-detail');

    if (totalStudyDaysEl) totalStudyDaysEl.textContent = `${stats.studyDays}일`;
    if (totalCardsViewedEl) totalCardsViewedEl.textContent = `${stats.cardsViewed}개`;
    if (totalQuizzesPlayedEl) totalQuizzesPlayedEl.textContent = `${stats.quizzesPlayed}개`;
    
    if (consecutiveDaysDetailEl) {
        if (detailedStats.consecutiveDays > 0) {
            consecutiveDaysDetailEl.textContent = `오늘로 연속 ${detailedStats.consecutiveDays}일째`;
            consecutiveDaysDetailEl.style.display = 'block';
        } else {
            consecutiveDaysDetailEl.style.display = 'none';
        }
    }
    
    if (todayCardsViewedDetailEl) {
        if (detailedStats.todayCardsViewed > 0) {
            todayCardsViewedDetailEl.textContent = `오늘 본 카드 ${detailedStats.todayCardsViewed}개`;
            todayCardsViewedDetailEl.style.display = 'block';
        } else {
            todayCardsViewedDetailEl.style.display = 'none';
        }
    }

    // [추가] 통계 페이지가 열릴 때 차트 렌더링
    renderStatsChart();
}

// ... (이하 코드는 이전과 동일)
export function showSection(sectionId) {
    currentSectionId = sectionId; 
    localStorage.setItem('kotobako-last-section', sectionId);

    contentSections.forEach(section => {
        section.style.display = 'none';
    });

    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.style.display = 'block';
    }

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
        // [추가] 테마 변경 시 차트 다시 그리기
        if (currentSectionId === 'stats-section') {
            renderStatsChart();
        }
    }

    themeButtons.forEach(button => {
        button.addEventListener('click', () => setActiveTheme(button.dataset.theme));
    });

    const savedTheme = localStorage.getItem('kotobako-theme') || 'aetherial-light';
    setActiveTheme(savedTheme);
}


// --- 레벨 선택 하이라이터 ---
const levelLabels = Array.from(document.querySelectorAll('.level-options label'));
const levelHighlighterContainer = document.querySelector('.selection-highlighter-container');

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
    const first = levelLabels[group.startIndex];
    const last = levelLabels[group.endIndex];
    const left = first.offsetLeft;
    const width = (last.offsetLeft + last.offsetWidth) - left;
    return { left, width };
}

export function updateSelectionHighlighter() {
    const currentHighlighters = Array.from(levelHighlighterContainer.children);
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
            
            levelHighlighterContainer.appendChild(highlighter);

            requestAnimationFrame(() => {
                highlighter.classList.remove('is-entering');
            });
        }
    });
}


// --- 난이도 선택 하이라이터 ---
const difficultyRadios = document.querySelectorAll('input[name="difficulty"]');
const difficultyHighlighterContainer = document.querySelector('.difficulty-highlighter-container');

function getOrCreateDifficultyHighlighter() {
    let highlighter = difficultyHighlighterContainer.querySelector('.difficulty-highlighter');
    if (!highlighter) {
        highlighter = document.createElement('div');
        highlighter.className = 'difficulty-highlighter';
        difficultyHighlighterContainer.appendChild(highlighter);
    }
    return highlighter;
}

export function updateDifficultyHighlighter() {
    const selectedRadio = document.querySelector('input[name="difficulty"]:checked');
    if (!selectedRadio) return;

    const label = selectedRadio.nextElementSibling;
    const highlighter = getOrCreateDifficultyHighlighter();

    const left = label.offsetLeft;
    const width = label.offsetWidth;
    
    highlighter.style.transform = `translateX(${left}px)`;
    highlighter.style.width = `${width}px`;
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
    shuffleBtn.title = userSettings.isShuffleOn 
        ? "완전 랜덤 (가중치 무시)" 
        : "지능형 랜덤 (난이도 가중치 적용)";

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
        renderFlashcard();
    });

    shuffleBtn.addEventListener('click', () => {
        userSettings.isShuffleOn = !userSettings.isShuffleOn;
        shuffleBtn.classList.toggle('active', userSettings.isShuffleOn);
        saveSettings();
        
        shuffleBtn.title = userSettings.isShuffleOn 
            ? "완전 랜덤 (가중치 무시)" 
            : "지능형 랜덤 (난이도 가중치 적용)";
        
        updateStudySession();
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
            if (userSettings.selectedLevels.length === 0) {
                checkbox.checked = true;
                userSettings.selectedLevels = [checkbox.value];
            }
            saveSettings();
            updateSelectionHighlighter();
            updateStudySession();
        });
    });

    difficultyRadios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            updateDifficultyHighlighter();

            const currentWordData = getCurrentWord();
            if (currentWordData) {
                updateWordDifficulty(currentWordData.word, event.target.value);
            }
        });
    });
    
    document.addEventListener('updateDifficulty', updateDifficultyHighlighter);
}