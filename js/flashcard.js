// js/flashcard.js

import { userSettings } from './settings.js';
import { speak } from './tts.js';

// DOM 요소
const flashcardContainer = document.getElementById('flashcard-container');

// 상태 변수
let allWords = [];
let currentStudyWords = [];
let currentWordIndex = 0;

// 단어 배열을 외부에서 받아와 allWords 변수를 설정하는 함수
export function setAllWords(words) {
    allWords = words;
}

// 후리가나 <ruby> HTML을 생성하는 함수
function generateFuriganaHTML(reading) {
    if (!reading) return '';
    const regex = /(\p{Script=Han}+)\[(.+?)\]/gu;
    return reading.replace(regex, `<ruby>$1<rt>$2</rt></ruby>`);
}

// 후리가나 표기를 제외한 한자/가나 텍스트만 반환하는 함수
function getKanjiText(reading) {
    if (!reading) return '';
    return reading.replace(/\[.*?\]/g, '');
}

// 음성 재생을 위한 순수 발음 텍스트를 추출하는 함수
function extractReadingText(reading) {
    if (!reading) return '';
    return reading.replace(/(\p{Script=Han})\[(.+?)\]/gu, '$2');
}

// 배열을 무작위로 섞는 유틸리티 함수
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 카드를 뒤집는 함수
export function flipCard() {
    const cardInner = flashcardContainer.querySelector('.flashcard-inner');
    if (!cardInner) return;
    cardInner.classList.toggle('is-flipped');

    // 카드를 앞면으로 뒤집고, 자동 재생이 켜져 있을 때 음성 재생
    if (!cardInner.classList.contains('is-flipped') && userSettings.isAutoSpeakOn) {
        const wordData = currentStudyWords[currentWordIndex];
        if (wordData) {
            const readingText = extractReadingText(wordData.reading);
            speak(readingText || wordData.word);
        }
    }
}

// 특정 단어 데이터로 플래시카드 UI를 렌더링하는 함수
export function renderFlashcard(wordData) {
    if (!wordData) {
        flashcardContainer.innerHTML = `<div class="flashcard-message">학습할 단어가 없습니다. 학습 범위를 선택해주세요.</div>`;
        return;
    }

    const displayHTML = userSettings.isFuriganaOn
        ? generateFuriganaHTML(wordData.reading)
        : getKanjiText(wordData.reading);

    const noFuriganaClass = userSettings.isFuriganaOn ? '' : 'no-furigana';

    flashcardContainer.innerHTML = `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-word ${noFuriganaClass}">${displayHTML || wordData.word}</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-meaning">${wordData.meaning}</div>
                </div>
            </div>
        </div>
    `;

    // 렌더링 후 카드에 클릭 이벤트 리스너 추가
    const card = flashcardContainer.querySelector('.flashcard');
    card.addEventListener('click', flipCard);
}

// 특정 인덱스의 단어를 화면에 표시하는 함수
function displayWord(index, isInitial = false) {
    const wordData = currentStudyWords[index];
    
    // 최초 로딩 시에는 애니메이션 없이 바로 표시
    if (isInitial) {
        renderFlashcard(wordData);
        if (userSettings.isAutoSpeakOn && wordData) {
            const readingText = extractReadingText(wordData.reading);
            speak(readingText || wordData.word);
        }
        return;
    }

    // GSAP을 사용한 부드러운 전환 애니메이션
    const cardContent = flashcardContainer.children[0];
    gsap.timeline()
      .to(cardContent, { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" })
      .call(() => {
          renderFlashcard(wordData);
          if (userSettings.isAutoSpeakOn && wordData) {
              const readingText = extractReadingText(wordData.reading);
              speak(readingText || wordData.word);
          }
      })
      .fromTo(flashcardContainer.children[0], 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
}

// 다음 단어를 보여주는 함수
export function showNextWord() {
    if (currentStudyWords.length === 0) return;
    currentWordIndex = (currentWordIndex + 1) % currentStudyWords.length;
    displayWord(currentWordIndex);
}

// 이전 단어를 보여주는 함수
export function showPrevWord() {
    if (currentStudyWords.length === 0) return;
    currentWordIndex = (currentWordIndex - 1 + currentStudyWords.length) % currentStudyWords.length;
    displayWord(currentWordIndex);
}


// 현재 설정에 맞게 학습 세션을 업데이트(재시작)하는 함수
export function updateStudySession(isInitial = false) {
    // 선택된 레벨에 맞는 단어들만 필터링
    currentStudyWords = allWords.filter(word => userSettings.selectedLevels.includes(word.level));
    
    // 섞기 옵션이 켜져 있으면 배열을 섞음
    if (userSettings.isShuffleOn) {
        shuffleArray(currentStudyWords);
    }

    currentWordIndex = 0;
    displayWord(currentWordIndex, isInitial);
}