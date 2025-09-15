
import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'web-desktop-notes';

const NotesApp: React.FC = () => {
  const [note, setNote] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  useEffect(() => {
    try {
        const savedNote = localStorage.getItem(STORAGE_KEY);
        if (savedNote !== null) {
            setNote(savedNote);
        }
    } catch (error) {
        console.error("Failed to load note from localStorage", error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, note);
      } catch (error) {
        console.error("Failed to save note to localStorage", error);
      }
    }
  }, [note, isLoaded]);

  return (
    <textarea
      className="w-full h-full bg-yellow-100 text-gray-800 p-4 resize-none focus:outline-none font-serif"
      value={note}
      onChange={(e) => setNote(e.target.value)}
      placeholder="Start typing your notes here..."
    />
  );
};

export default NotesApp;
