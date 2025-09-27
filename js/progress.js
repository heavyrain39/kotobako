// js/progress.js

// 단어별 학습 진행 상황(난이도)을 저장하는 객체
let wordProgress = {};

// localStorage에서 학습 진행 상황을 불러오는 함수
export function loadProgress() {
    const savedProgress = localStorage.getItem('kotobako-progress');
    if (savedProgress) {
        wordProgress = JSON.parse(savedProgress);
    }
}

// localStorage에 학습 진행 상황을 저장하는 함수
function saveProgress() {
    localStorage.setItem('kotobako-progress', JSON.stringify(wordProgress));
}

/**
 * 특정 단어의 난이도를 가져오는 함수
 * @param {string} word - 난이도를 조회할 단어의 원형 (e.g., "食べる")
 * @returns {string} 'easy', 'normal', 'hard' 중 하나
 */
export function getWordDifficulty(word) {
    // 단어 데이터 자체에 word 필드가 없을 경우를 대비한 방어 코드
    if (!word) return 'normal'; 
    return wordProgress[word] || 'normal'; // 저장된 값이 없으면 'normal'을 기본값으로 반환
}

/**
 * 특정 단어의 난이도를 업데이트하고 저장하는 함수
 * @param {string} word - 난이도를 업데이트할 단어의 원형
 * @param {string} difficulty - 새로운 난이도 ('easy', 'normal', 'hard')
 */
export function updateWordDifficulty(word, difficulty) {
    if (!word || !['easy', 'normal', 'hard'].includes(difficulty)) return;
    
    wordProgress[word] = difficulty;
    saveProgress(); // 변경 사항이 있을 때마다 즉시 저장
}