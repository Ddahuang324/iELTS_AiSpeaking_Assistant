const STORAGE_KEY = 'user_gemini_api_key';

export const storeApiKey = (apiKey: string) => {
    localStorage.setItem(STORAGE_KEY, apiKey);
};

export const getStoredApiKey = (): string | null => {
    return localStorage.getItem(STORAGE_KEY);
};

export const removeApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
};

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;

    try {
        // Use fetch to call the list models endpoint. This is a lightweight way to verify the key.
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);

        if (response.ok) {
            return true;
        } else {
            console.warn("API Key validation failed with status:", response.status);
            return false;
        }
    } catch (error) {
        console.error("API Key validation failed:", error);
        return false;
    }
};
