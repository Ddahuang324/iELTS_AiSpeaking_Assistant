import { AnalysisResult } from '../types';
import { MOCK_SAMPLE_RESULT } from './analysisService';

const HISTORY_STORAGE_KEY = 'ielts_history';

export const getStoredHistory = (): AnalysisResult[] => {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    let loadedHistory: AnalysisResult[] = [];

    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Filter out old history items that don't match the new schema
            loadedHistory = Array.isArray(parsed) ? parsed.filter((item: any) => item.ielts_band_score) : [];
        } catch (e) {
            console.error("Failed to parse history", e);
        }
    }

    // Ensure sample is always present
    if (!loadedHistory.find(h => h.id === MOCK_SAMPLE_RESULT.id)) {
        loadedHistory.push(MOCK_SAMPLE_RESULT);
    }

    // Sort by date desc
    loadedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return loadedHistory;
};

export const storeHistory = (history: AnalysisResult[]) => {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
};

export const addHistoryItem = (newItem: AnalysisResult): AnalysisResult[] => {
    const currentHistory = getStoredHistory();
    // Remove sample if it exists to avoid duplicates when re-adding (though getStoredHistory handles it, cleaner to just prepend)
    // Actually, getStoredHistory ensures sample is there.
    // Let's just prepend and save.

    // Filter out if it already exists (unlikely for new items but good for safety)
    const filtered = currentHistory.filter(h => h.id !== newItem.id);
    const updated = [newItem, ...filtered];

    storeHistory(updated);
    return updated;
};

export const deleteHistoryItem = (id: string): AnalysisResult[] => {
    const currentHistory = getStoredHistory();
    const updated = currentHistory.filter(item => item.id !== id);
    storeHistory(updated);
    return updated;
};
