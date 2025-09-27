// js/stats.js

let statsData = {};

function getTodayDateString(date = new Date()) { // 날짜를 인자로 받을 수 있도록 수정
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function loadStats() {
    const savedStats = localStorage.getItem('kotobako-stats');
    if (savedStats) {
        statsData = JSON.parse(savedStats);
    } else {
        statsData = {
            userName: '사용자',
            statsByDate: {},
            cumulativeStats: {
                cardsViewed: 0,
                studyDays: 0,
                quizzesPlayed: 0
            }
        };
        saveStats();
    }
}

function saveStats() {
    localStorage.setItem('kotobako-stats', JSON.stringify(statsData));
}

export function getUserName() {
    return statsData.userName || '사용자';
}

export function setUserName(newName) {
    if (newName && newName.trim().length > 0) {
        statsData.userName = newName.trim();
        saveStats();
    }
}

export function getCumulativeStats() {
    return statsData.cumulativeStats;
}

export function calculateDetailedStats() {
    const todayStr = getTodayDateString();
    
    const todayCardsViewed = statsData.statsByDate[todayStr]?.cardsViewed || 0;

    let consecutiveDays = 0;
    const studyDates = Object.keys(statsData.statsByDate).sort().reverse();
    
    let currentDate = new Date();
    // 오늘 또는 어제 공부한 기록이 있어야 연속일 계산 시작
    if (studyDates.includes(getTodayDateString(currentDate)) || studyDates.includes(getTodayDateString(new Date(currentDate.setDate(currentDate.getDate() -1))))) {
        currentDate = new Date(); // 날짜 원상복구
        
        while(studyDates.includes(getTodayDateString(currentDate))){
            consecutiveDays++;
            currentDate.setDate(currentDate.getDate() - 1);
        }
    }

    return {
        todayCardsViewed,
        consecutiveDays
    };
}

// [추가] 최근 7일간의 학습 카드 수 데이터를 차트 형식으로 가공하는 함수
export function getChartData() {
    const labels = [];
    const data = [];
    const today = new Date();

    // 오늘부터 6일 전까지, 총 7일간의 데이터를 준비
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);

        const dateString = getTodayDateString(date);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        labels.push(`${month}-${day}`);
        data.push(statsData.statsByDate[dateString]?.cardsViewed || 0);
    }
    
    return { labels, data };
}


export function trackCardView() {
    const today = getTodayDateString();
    
    if (!statsData.statsByDate[today]) {
        statsData.statsByDate[today] = { cardsViewed: 0 };
        statsData.cumulativeStats.studyDays = Object.keys(statsData.statsByDate).length;
    }

    statsData.statsByDate[today].cardsViewed += 1;
    statsData.cumulativeStats.cardsViewed += 1;

    saveStats();
}