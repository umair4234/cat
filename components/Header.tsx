import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-md">
      <div className="container mx-auto px-4 py-6 md:px-8">
        <div className="flex items-center gap-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-10 w-10 text-indigo-600"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2c-5.523 0-10 3.134-10 7 0 2.457 1.55 4.625 3.89 5.865.115.06.26.095.41.095.31 0 .585-.19.71-.47.12-.27.035-.59-.2-.78-1.57-1.31-2.58-3.05-2.58-4.71 0-2.848 3.589-5.25 8-5.25s8 2.402 8 5.25c0 1.66-1.01 3.4-2.58 4.71-.235.19-.32.51-.2.78.125.28.4.47.71.47.15 0 .295-.035.41-.095C20.45 13.625 22 11.457 22 9c0-3.866-4.477-7-10-7zm-4.045 13.435C5.22 14.82 2 15.115 2 17c0 2.21 4.477 4 10 4s10-1.79 10-4c0-1.885-3.22-2.18-5.955-1.565-1.11.25-2.295.39-3.545.39s-2.435-.14-3.545-.39z" />
          </svg>
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Video Topic Generator</h1>
            <p className="text-gray-500">AI-Powered Ideas for Your Next Video</p>
          </div>
        </div>
      </div>
    </header>
  );
};