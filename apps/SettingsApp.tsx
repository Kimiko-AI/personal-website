import React, { useState } from 'react';

const STORAGE_KEY = 'web-desktop-background';

const SettingsApp: React.FC = () => {
    const [imageUrl, setImageUrl] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                const backgroundValue = `url(${result})`;
                localStorage.setItem(STORAGE_KEY, backgroundValue);
                window.dispatchEvent(new Event('storage'));
            };
            reader.readAsDataURL(file);
        } else if (file) {
            alert('Please select a valid image file.');
        }
    };

    const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(e.target.value);
    };

    const handleSetUrl = () => {
        if (imageUrl.trim()) {
            try {
                const url = new URL(imageUrl);
                if (['http:', 'https:'].includes(url.protocol)) {
                    const backgroundValue = `url(${imageUrl})`;
                    localStorage.setItem(STORAGE_KEY, backgroundValue);
                    window.dispatchEvent(new Event('storage'));
                } else {
                     alert('Please enter a valid URL.');
                }
            } catch (_) {
                alert('Please enter a valid URL.');
            }
        }
    };

    const handleReset = () => {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('storage'));
    };

    return (
        <div className="p-6 h-full bg-slate-900 text-white overflow-y-auto">
            <h1 className="text-2xl font-bold mb-6">Desktop Settings</h1>

            <div className="space-y-8">
                <div>
                    <h2 className="text-lg font-semibold mb-2">Upload an Image</h2>
                    <p className="text-sm text-slate-400 mb-3">Choose an image from your device.</p>
                    <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-colors text-sm">
                        Select a File
                        <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                    </label>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">Use Image from URL</h2>
                    <p className="text-sm text-slate-400 mb-3">Paste a link to an image on the web.</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={imageUrl}
                            onChange={handleUrlChange}
                            placeholder="https://example.com/image.png"
                            className="flex-grow bg-slate-800 border border-slate-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                            aria-label="Image URL"
                        />
                        <button onClick={handleSetUrl} className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                            Set
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">Reset Background</h2>
                    <p className="text-sm text-slate-400 mb-3">Restore the default desktop background.</p>
                    <button onClick={handleReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                        Reset to Default
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsApp;
