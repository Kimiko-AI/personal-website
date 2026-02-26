import React, { useState, useRef, useCallback } from 'react';
import QRCode from 'qrcode';

type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

const EC_LABELS: Record<ErrorCorrectionLevel, string> = {
    L: 'Low (~7%)',
    M: 'Medium (~15%)',
    Q: 'Quartile (~25%)',
    H: 'High (~30%)',
};

const SIZE_PRESETS = [256, 512, 1024, 2048];

const QRCodeApp: React.FC = () => {
    const [text, setText] = useState('');
    const [ecLevel, setEcLevel] = useState<ErrorCorrectionLevel>('M');
    const [imageSize, setImageSize] = useState(512);
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);

    const generateQR = useCallback(async () => {
        if (!text.trim()) {
            setError('Please enter some text or a URL.');
            setQrDataUrl(null);
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const dataUrl = await QRCode.toDataURL(text, {
                errorCorrectionLevel: ecLevel,
                width: imageSize,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#ffffff',
                },
            });
            setQrDataUrl(dataUrl);
        } catch (err: any) {
            setError(err.message || 'Failed to generate QR code.');
            setQrDataUrl(null);
        } finally {
            setIsGenerating(false);
        }
    }, [text, ecLevel, imageSize]);

    const handleDownload = () => {
        if (!qrDataUrl) return;
        const link = document.createElement('a');
        link.href = qrDataUrl;
        link.download = `qrcode-${imageSize}x${imageSize}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Auto-generate on parameter change (debounced)
    const debounceRef = useRef<number | null>(null);
    const triggerGenerate = useCallback(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            generateQR();
        }, 300);
    }, [generateQR]);

    const handleTextChange = (value: string) => {
        setText(value);
        if (value.trim()) triggerGenerate();
        else { setQrDataUrl(null); setError(null); }
    };

    const handleEcChange = (level: ErrorCorrectionLevel) => {
        setEcLevel(level);
        if (text.trim()) {
            // Regenerate immediately
            setTimeout(() => generateQR(), 0);
        }
    };

    const handleSizeChange = (size: number) => {
        setImageSize(size);
        if (text.trim()) {
            setTimeout(() => generateQR(), 0);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white overflow-y-auto">
            <div className="flex-1 flex flex-col lg:flex-row p-3 sm:p-4 gap-3 sm:gap-4">
                {/* Controls Panel */}
                <div className="flex flex-col gap-3 sm:gap-4 lg:w-1/2">
                    {/* Text Input */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Text or URL</label>
                        <textarea
                            value={text}
                            onChange={(e) => handleTextChange(e.target.value)}
                            placeholder="Enter text, URL, or any data..."
                            className="w-full h-24 sm:h-28 bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                        />
                    </div>

                    {/* Error Correction Level */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">Error Correction</label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {(Object.keys(EC_LABELS) as ErrorCorrectionLevel[]).map((level) => (
                                <button
                                    key={level}
                                    onClick={() => handleEcChange(level)}
                                    className={`py-2 px-1 rounded-lg text-xs sm:text-sm font-medium transition-colors ${ecLevel === level
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-600'
                                        }`}
                                >
                                    <div className="font-bold">{level}</div>
                                    <div className="text-[10px] opacity-70 hidden sm:block">{EC_LABELS[level]}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Output Size */}
                    <div>
                        <label className="block text-sm font-semibold text-slate-300 mb-1.5">
                            Output Size: <span className="text-indigo-400">{imageSize}×{imageSize}px</span>
                        </label>
                        <div className="grid grid-cols-4 gap-1.5">
                            {SIZE_PRESETS.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => handleSizeChange(size)}
                                    className={`py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${imageSize === size
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700 active:bg-slate-600'
                                        }`}
                                >
                                    {size}px
                                </button>
                            ))}
                        </div>
                        {/* Custom size slider */}
                        <div className="flex items-center gap-2 mt-2">
                            <input
                                type="range"
                                min="128"
                                max="4096"
                                step="64"
                                value={imageSize}
                                onChange={(e) => handleSizeChange(Number(e.target.value))}
                                className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                                type="number"
                                min="64"
                                max="4096"
                                value={imageSize}
                                onChange={(e) => handleSizeChange(Math.max(64, Math.min(4096, Number(e.target.value) || 256)))}
                                className="w-20 bg-slate-800 border border-slate-600 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>
                    </div>

                    {/* Generate & Download buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={generateQR}
                            disabled={!text.trim() || isGenerating}
                            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors"
                        >
                            {isGenerating ? 'Generating...' : 'Generate'}
                        </button>
                        <button
                            onClick={handleDownload}
                            disabled={!qrDataUrl}
                            className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 active:bg-green-800 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-sm transition-colors"
                        >
                            Download PNG
                        </button>
                    </div>

                    {error && (
                        <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded-lg">{error}</p>
                    )}
                </div>

                {/* Preview Panel */}
                <div className="flex-1 flex items-center justify-center bg-slate-800/50 rounded-xl p-4 min-h-[200px]">
                    {qrDataUrl ? (
                        <div className="flex flex-col items-center gap-2">
                            <img
                                src={qrDataUrl}
                                alt="QR Code"
                                className="max-w-full max-h-[300px] rounded-lg shadow-lg shadow-black/30"
                                style={{ imageRendering: 'pixelated' }}
                            />
                            <p className="text-xs text-slate-500">{imageSize}×{imageSize}px · EC: {ecLevel}</p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm14 3h.01M17 17h.01M14 14h3v3h-3v-3zm3 0h3v3h-3v-3zm0 3h3v3h-3v-3z" />
                            </svg>
                            <p className="text-sm">Enter text to generate a QR code</p>
                        </div>
                    )}
                </div>
            </div>

            <canvas ref={previewCanvasRef} className="hidden" />
        </div>
    );
};

export default QRCodeApp;
