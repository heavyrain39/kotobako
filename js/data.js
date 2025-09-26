// js/data.js

import { GOOGLE_SHEET_CSV_URLS } from './config.js';

// 따옴표로 묶인 필드를 포함하는 CSV 한 줄을 파싱하는 함수
function parseCsvRow(row) {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current.trim());
    return values;
}

/**
 * Google Sheets에서 모든 단어 데이터를 비동기적으로 불러와 파싱하는 함수
 * @returns {Promise<Array>} - 파싱된 전체 단어 데이터 배열을 담은 Promise
 */
export async function loadAllWordData() {
    try {
        // Promise.all을 사용해 모든 URL에서 데이터를 동시에 요청
        const responses = await Promise.all(GOOGLE_SHEET_CSV_URLS.map(url => fetch(url)));
        
        // 응답이 올바른지 확인
        for (const response of responses) {
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for url: ${response.url}`);
        }

        // 모든 응답 텍스트를 비동기적으로 받아옴
        const csvTexts = await Promise.all(responses.map(res => res.text()));
        
        let loadedWords = [];
        csvTexts.forEach(csvText => {
            const rows = csvText.trim().split('\n');
            if (rows.length < 2) return; // 헤더와 데이터가 최소 1줄씩은 있어야 함
            
            const headers = parseCsvRow(rows.shift()); // 첫 줄은 헤더
            const words = rows.map(row => {
                if (!row) return null;
                const values = parseCsvRow(row);
                let entry = {};
                headers.forEach((header, index) => {
                    // 따옴표 제거
                    entry[header] = values[index] ? values[index].replace(/^"|"$/g, '') : '';
                });
                return entry;
            }).filter(Boolean); // null인 항목 제거
            
            loadedWords.push(...words);
        });
        
        return loadedWords;

    } catch (error) {
        console.error("단어 데이터 로딩 중 오류 발생:", error);
        // 오류 발생 시 빈 배열을 반환하거나, 특정 오류 처리를 할 수 있음
        return []; 
    }
}