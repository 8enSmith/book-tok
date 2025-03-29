import React from 'react';

interface AboutModalProps {
  showAbout: boolean;
  setShowAbout: (show: boolean) => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ showAbout, setShowAbout }) => {
  return (
    <div className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${showAbout ? 'block' : 'hidden'}`}>
      <div className="bg-gray-900 z-[41] p-6 rounded-lg max-w-md relative">
        <button
          onClick={() => setShowAbout(false)}
          className="absolute top-2 right-2 text-white/70 hover:text-white"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-4">About Book-Tok</h2>
        <p className="mb-4">
          A TikTok style interface for exploring random books from Open Library.
        </p>
        <p className="text-white/70">
          Made with ❤️ by{' '}
          <a
            href="https://github.com/8enSmith"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            @8enSmith
          </a>
        </p>
        <p className="text-white/70 mt-2">
          Based on{' '}
          <a
            href="https://wikitok.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            WikiTok
          </a>
        </p>
        <p className="text-white/70 mt-2">
          Check out the code on{' '}
          <a
            href="https://github.com/8enSmith/book-tok"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            GitHub
          </a>
        </p>
        <p className="text-white/70 mt-2">
          If you enjoy this project, you can{' '}
          <a
            href="https://buymeacoffee.com/8enSmith"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white hover:underline"
          >
            buy me a coffee
          </a>
          ! ☕
        </p>
      </div>
      <div
        className={`w-full h-full z-[40] top-1 left-1 bg-[rgb(28 25 23 / 43%)] fixed ${
          showAbout ? 'block' : 'hidden'
        }`}
        onClick={() => setShowAbout(false)}
      ></div>
    </div>
  );
};

export default AboutModal;