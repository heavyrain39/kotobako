// js/flashcard.js

import { userSettings } from './settings.js';
import { speak } from './tts.js';
import { getWordDifficulty } from './progress.js';
// [추가] 통계 추적 함수 import
import { trackCardView } from './stats.js';

const flashcardContainer = document.getElementById('flashcard-container');
const wordLevelIndicator = document.querySelector('.word-level-indicator');

let allWords = [];
let currentStudyWords = [];
let currentWordIndex = 0;

export const getCurrentWord = () => currentStudyWords[currentWordIndex];

export function setAllWords(words) {
    allWords = words;
}

function generateFuriganaHTML(reading) {
    if (!reading) return '';
    const regex = /(\p{Script=Han}+)\[(.+?)\]/gu;
    return reading.replace(regex, `<ruby>$1<rt>$2</rt></ruby>`);
}

function getKanjiText(reading) {
    if (!reading) return '';
    return reading.replace(/\[.*?\]/g, '');
}

function extractReadingText(reading) {
    if (!reading) return '';
    return reading.replace(/(\p{Script=Han})\[(.+?)\]/gu, '$2');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

export function flipCard() {
    const cardInner = flashcardContainer.querySelector('.flashcard-inner');
    if (!cardInner) return;
    cardInner.classList.toggle('is-flipped');

    if (!cardInner.classList.contains('is-flipped') && userSettings.isAutoSpeakOn) {
        const wordData = currentStudyWords[currentWordIndex];
        if (wordData) {
            const readingText = extractReadingText(wordData.reading);
            speak(readingText || wordData.word);
        }
    }
}

export function renderFlashcard(wordData) {
    const currentWord = wordData || getCurrentWord();

    if (currentWord) {
        wordLevelIndicator.textContent = currentWord.level;
    } else {
        wordLevelIndicator.textContent = '';
        flashcardContainer.innerHTML = `<div class="flashcard-message">학습할 단어가 없습니다. 학습 범위를 선택해주세요.</div>`;
        return;
    }

    const displayHTML = userSettings.isFuriganaOn
        ? generateFuriganaHTML(currentWord.reading)
        : getKanjiText(currentWord.reading);

    const noFuriganaClass = userSettings.isFuriganaOn ? '' : 'no-furigana';

    flashcardContainer.innerHTML = `
        <div class="flashcard">
            <div class="flashcard-inner">
                <div class="flashcard-front">
                    <div class="flashcard-word ${noFuriganaClass}">${displayHTML || currentWord.word}</div>
                </div>
                <div class="flashcard-back">
                    <div class="flashcard-meaning">${currentWord.meaning}</div>
                </div>
            </div>
        </div>
    `;

    const card = flashcardContainer.querySelector('.flashcard');
    card.addEventListener('click', flipCard);
}

function displayWord(index, isInitial = false) {
    const wordData = currentStudyWords[index];
    
    // [수정] 세션 시작 시가 아닐 때만(카드를 넘길 때만) 통계 기록
    if (!isInitial) {
        trackCardView();
    }
    
    if (wordData) {
        const difficulty = getWordDifficulty(wordData.word);
        const targetRadio = document.getElementById(`diff-${difficulty}`);
        if (targetRadio) {
            targetRadio.checked = true;
            document.dispatchEvent(new Event('updateDifficulty'));
        }
    }

    if (isInitial) {
        renderFlashcard(wordData);
        if (userSettings.isAutoSpeakOn && wordData) {
            const readingText = extractReadingText(wordData.reading);
            speak(readingText || wordData.word);
        }
        return;
    }
    
    const cardContent = flashcardContainer.querySelector('.flashcard');
    gsap.timeline()
      .to(cardContent, { opacity: 0, y: -20, duration: 0.2, ease: "power2.in" })
      .call(() => {
          renderFlashcard(wordData);
          if (userSettings.isAutoSpeakOn && wordData) {
              const readingText = extractReadingText(wordData.reading);
              speak(readingText || wordData.word);
          }
      })
      .fromTo(flashcardContainer.querySelector('.flashcard'), 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
}

export function showNextWord() {
    if (currentStudyWords.length === 0) return;
    currentWordIndex = (currentWordIndex + 1) % currentStudyWords.length;
    displayWord(currentWordIndex);
}

export function showPrevWord() {
    if (currentStudyWords.length === 0) return;
    currentWordIndex = (currentWordIndex - 1 + currentStudyWords.length) % currentStudyWords.length;
    displayWord(currentWordIndex);
}

export function updateStudySession(isInitial = false) {
    const filteredWords = allWords.filter(word => userSettings.selectedLevels.includes(word.level));
    
    if (userSettings.isShuffleOn) {
        shuffleArray(filteredWords);
        currentStudyWords = filteredWords;
    } else {
        const weightedWords = [];
        filteredWords.forEach(word => {
            const difficulty = getWordDifficulty(word.word);
            let weight = 1;
            if (difficulty === 'normal') {
                weight = 2;
            } else if (difficulty === 'hard') {
                weight = 4;
            }
            
            for (let i = 0; i < weight; i++) {
                weightedWords.push(word);
            }
        });
        
        shuffleArray(weightedWords);
        currentStudyWords = weightedWords;
    }

    currentWordIndex = 0;
    displayWord(currentWordIndex, isInitial);
}