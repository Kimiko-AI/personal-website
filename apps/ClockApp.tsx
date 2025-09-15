import React, { useState, useEffect, useMemo, useRef } from 'react';

const ClockView: React.FC = () => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const formatDate = (date: Date) => date.toLocaleDateString(undefined, {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });

    return (
        <div className="text-center">
            <div className="text-7xl font-mono tracking-widest">
                {time.toLocaleTimeString()}
            </div>
            <div className="text-xl text-slate-400 mt-4">
                {formatDate(time)}
            </div>
        </div>
    );
};

const TimerView: React.FC = () => {
    const [timeInput, setTimeInput] = useState({ hours: '0', minutes: '5', seconds: '0' });
    const [timeLeft, setTimeLeft] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const intervalRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const totalSeconds = useMemo(() => {
        const { hours, minutes, seconds } = timeInput;
        return (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    }, [timeInput]);

    useEffect(() => {
        if (!audioRef.current) {
            // A simple, valid beep sound
            const soundData = "data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YUQBEAAAAAAA//8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/AP8A/wD/";
            audioRef.current = new Audio(soundData);
        }
    }, []);

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = window.setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) {
            setIsActive(false);
            setIsFinished(true);
            audioRef.current?.play();
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [isActive, timeLeft]);

    const handleStartPause = () => {
        if (isActive) {
            setIsActive(false);
        } else {
            if (timeLeft === 0 && totalSeconds > 0) {
                setTimeLeft(totalSeconds);
            }
            setIsActive(true);
            setIsFinished(false);
        }
    };

    const handleReset = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsActive(false);
        setIsFinished(false);
        setTimeLeft(totalSeconds);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const numericValue = value.replace(/[^0-9]/g, '');
        setTimeInput(prev => ({ ...prev, [name]: numericValue }));
        setIsActive(false);
        setTimeLeft(0);
    };

    const formatTime = (secondsValue: number) => {
        const h = Math.floor(secondsValue / 3600);
        const m = Math.floor((secondsValue % 3600) / 60);
        const s = secondsValue % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    const displayTime = timeLeft > 0 ? timeLeft : totalSeconds;
    const timeIsSet = totalSeconds > 0;

    return (
        <div className="flex flex-col items-center justify-center h-full text-white">
            <div className={`text-7xl font-mono ${isFinished ? 'animate-pulse text-red-500' : ''}`}>
                {formatTime(displayTime)}
            </div>

            {isFinished && <p className="mt-2 text-red-400">Time's up!</p>}

            {!isActive && timeLeft === 0 && (
                <div className="flex gap-4 my-4">
                    <input type="text" name="hours" value={timeInput.hours} onChange={handleInputChange} className="w-16 bg-slate-800 text-center text-lg p-1 rounded" placeholder="HH" />
                    <input type="text" name="minutes" value={timeInput.minutes} onChange={handleInputChange} className="w-16 bg-slate-800 text-center text-lg p-1 rounded" placeholder="MM" />
                    <input type="text" name="seconds" value={timeInput.seconds} onChange={handleInputChange} className="w-16 bg-slate-800 text-center text-lg p-1 rounded" placeholder="SS" />
                </div>
            )}

            <div className="flex gap-4 mt-6">
                <button onClick={handleStartPause} disabled={!timeIsSet && timeLeft === 0} className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button onClick={handleReset} disabled={!timeIsSet && timeLeft === 0} className="px-6 py-2 bg-slate-600 hover:bg-slate-700 rounded-md disabled:bg-slate-600 disabled:cursor-not-allowed">
                    Reset
                </button>
            </div>
        </div>
    );
};

const ClockApp: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'clock' | 'timer'>('clock');

    const TabButton: React.FC<{tabName: 'clock' | 'timer', children: React.ReactNode}> = ({ tabName, children }) => (
        <button
            onClick={() => setActiveTab(tabName)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === tabName ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
        >
            {children}
        </button>
    );

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white">
            <nav className="flex-shrink-0 flex border-b border-slate-700">
                <TabButton tabName="clock">Clock</TabButton>
                <TabButton tabName="timer">Timer</TabButton>
            </nav>
            <main className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
                {activeTab === 'clock' && <ClockView />}
                {activeTab === 'timer' && <TimerView />}
            </main>
        </div>
    );
};

export default ClockApp;
