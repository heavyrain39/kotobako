// js/tts.js

/**
 * 주어진 텍스트를 일본어 음성으로 읽어주는 함수
 * @param {string} text - 읽을 텍스트
 */
export function speak(text) {
    // 음성 합성을 지원하지 않는 브라우저에서는 함수를 즉시 종료
    if (!text || typeof window.speechSynthesis === 'undefined') return;
    
    // 이전에 재생 중이던 음성이 있으면 취소
    speechSynthesis.cancel();

    // Web Speech API의 끊김 현상을 해결하기 위한 '엔진 예열' 트릭
    const warmUpUtterance = new SpeechSynthesisUtterance(' ');
    warmUpUtterance.volume = 0;
    speechSynthesis.speak(warmUpUtterance);

    // 실제 읽을 음성 생성
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP'; // 언어를 일본어로 설정
    utterance.rate = 0.95;     // 재생 속도를 약간 느리게 설정
    
    speechSynthesis.speak(utterance);
}