import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ImageIcon } from '../constants';

const formatBytes = (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const dataURLtoBlob = (dataurl: string): Blob => {
    const arr = dataurl.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) throw new Error('Invalid data URL');
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
};


const ImageConverterApp: React.FC = () => {
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
    const [convertedDataUrl, setConvertedDataUrl] = useState<string | null>(null);
    const [convertedSize, setConvertedSize] = useState<number>(0);
    
    const [format, setFormat] = useState<'jpeg' | 'png' | 'webp'>('jpeg');
    const [quality, setQuality] = useState<number>(0.92);
    const [isConverting, setIsConverting] = useState<boolean>(false);
    
    const [comparison, setComparison] = useState<number>(50);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const processFile = (file: File) => {
        if (file && file.type.startsWith('image/')) {
            setOriginalFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setOriginalDataUrl(e.target?.result as string);
            reader.readAsDataURL(file);
        } else {
            alert('Please select a valid image file.');
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    }

    const convertImage = useCallback(() => {
        if (!originalDataUrl || !canvasRef.current) return;

        setIsConverting(true);
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const mimeType = `image/${format}`;
            const resultDataUrl = canvas.toDataURL(mimeType, format === 'png' ? undefined : quality);
            
            setConvertedDataUrl(resultDataUrl);
            setConvertedSize(dataURLtoBlob(resultDataUrl).size);
            setIsConverting(false);
        };
        img.src = originalDataUrl;
    }, [originalDataUrl, format, quality]);

    useEffect(() => {
        if (originalDataUrl) {
            convertImage();
        }
    }, [originalDataUrl, convertImage]);

    const handleDownload = () => {
        if (!convertedDataUrl || !originalFile) return;
        const link = document.createElement('a');
        link.href = convertedDataUrl;
        const name = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
        link.download = `${name}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
    
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };
    
    if (!originalFile) {
        return (
            <div 
                className={`w-full h-full bg-slate-900 text-white flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg transition-colors ${isDragging ? 'border-purple-500 bg-slate-800' : 'border-slate-600'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <ImageIcon className="w-16 h-16 text-slate-500 mb-4" />
                <p className="text-lg font-semibold">Drag & Drop an image here</p>
                <p className="text-slate-400 my-2">or</p>
                <label className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-colors">
                    Select a File
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
            </div>
        );
    }
    
    const sizeReduction = originalFile.size ? (((originalFile.size - convertedSize) / originalFile.size) * 100).toFixed(1) : 0;

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white font-sans overflow-hidden">
            <div className="flex-grow p-4 flex flex-col gap-4 overflow-hidden">
                <div className="flex-grow relative select-none rounded-md overflow-hidden bg-black/20" onContextMenu={(e) => e.stopPropagation() }>
                     <img src={originalDataUrl ?? ''} className="absolute top-0 left-0 w-full h-full object-contain" alt="Original" />
                     {convertedDataUrl && (
                        <div className="absolute top-0 left-0 w-full h-full bg-no-repeat bg-contain bg-center" style={{ backgroundImage: `url(${convertedDataUrl})`, clipPath: `inset(0 0 0 ${comparison}%)` }} />
                     )}
                     <input 
                        type="range" min="0" max="100" value={comparison} 
                        onChange={(e) => setComparison(Number(e.target.value))} 
                        className="absolute inset-0 w-full h-full cursor-col-resize opacity-0"
                        aria-label="Comparison slider"
                     />
                </div>
                <div className="grid grid-cols-2 gap-4 w-full max-w-xl text-sm self-center flex-shrink-0">
                    <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="font-bold text-slate-300">Original</p>
                        <p className="text-lg text-white">{formatBytes(originalFile.size)}</p>
                    </div>
                     <div className="bg-slate-800 p-3 rounded-lg text-center">
                        <p className="font-bold text-slate-300">Converted ({format.toUpperCase()})</p>
                        <p className={`text-lg ${convertedSize > originalFile.size ? 'text-red-400' : 'text-green-400'}`}>
                            {isConverting ? '...' : `${formatBytes(convertedSize)} (${sizeReduction}%)`}
                        </p>
                    </div>
                </div>
            </div>
            
            <footer className="p-3 border-t border-slate-700 bg-slate-800/50 flex items-center justify-center gap-6 flex-wrap flex-shrink-0">
                <div className="flex items-center gap-2">
                    <label htmlFor="format-select" className="text-sm font-medium">Format:</label>
                    <select id="format-select" value={format} onChange={(e) => setFormat(e.target.value as any)} className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                        <option value="jpeg">JPEG</option>
                        <option value="webp">WEBP</option>
                        <option value="png">PNG</option>
                    </select>
                </div>

                {format !== 'png' && (
                    <div className="flex items-center gap-2 w-48">
                        <label htmlFor="quality-slider" className="text-sm font-medium">Quality:</label>
                        <input id="quality-slider" type="range" min="1" max="100" value={quality * 100} onChange={(e) => setQuality(Number(e.target.value) / 100)} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" />
                        <span className="text-sm w-8 text-right">{Math.round(quality * 100)}</span>
                    </div>
                )}
                
                <button onClick={handleDownload} disabled={isConverting} className="bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded transition-colors text-sm">
                    {isConverting ? 'Converting...' : 'Download'}
                </button>
            </footer>
            <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </div>
    );
};

export default ImageConverterApp;