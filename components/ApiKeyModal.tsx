import React, { useState, useEffect } from 'react';
import { validateApiKey, storeApiKey, getStoredApiKey } from '../services/apiKeyService';

interface ApiKeyModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (apiKey: string) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [apiKey, setApiKey] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            const stored = getStoredApiKey();
            if (stored) setApiKey(stored);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsValidating(true);

        try {
            const isValid = await validateApiKey(apiKey);
            if (isValid) {
                storeApiKey(apiKey);
                onSuccess(apiKey);
                onClose();
            } else {
                setError('Invalid API Key. Please check and try again.');
            }
        } catch (err) {
            setError('Validation failed. Please check your network connection.');
        } finally {
            setIsValidating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full mx-4 border border-gray-100">
                <h2 className="text-2xl font-light text-charcoal mb-6">Enter API Key</h2>

                <p className="text-sm text-gray-500 mb-6">
                    To use the AI Speaking Examiner, you need a valid Google Gemini API key.
                    Your key is stored locally on your device.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="apiKey" className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                            Gemini API Key
                        </label>
                        <input
                            type="password"
                            id="apiKey"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-accent-teal focus:ring-1 focus:ring-accent-teal transition-all text-charcoal"
                            placeholder="AIzaSy..."
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-xs mt-2">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 mt-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 text-sm text-gray-500 hover:text-charcoal transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isValidating || !apiKey}
                            className={`px-8 py-2 bg-charcoal text-white text-sm font-medium tracking-wide hover:bg-accent-teal transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${isValidating ? 'animate-pulse' : ''}
              `}
                        >
                            {isValidating ? 'Verifying...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-accent-teal hover:underline"
                    >
                        Get a Gemini API Key
                    </a>
                </div>
            </div>
        </div>
    );
};

export default ApiKeyModal;
