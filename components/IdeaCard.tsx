
import React from 'react';
import type { VideoIdea } from '../types';

interface IdeaCardProps {
  idea: VideoIdea;
  index: number;
  onStartProject: (idea: VideoIdea) => void;
  onSave: (idea: string) => void;
  isSaved: boolean;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index, onStartProject, onSave, isSaved }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
      <div>
        <h3 className="text-xl font-bold text-gray-800 border-b-2 border-indigo-200 pb-2 mb-4">
          ({index + 1}) {idea.title}
        </h3>
        <p className="text-gray-700 leading-relaxed">{idea.idea}</p>
      </div>
      <div className="mt-auto flex items-center gap-2">
        <button 
          onClick={() => onStartProject(idea)}
          className="self-start px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 text-sm"
        >
          Start Project →
        </button>
        <button 
          onClick={() => onSave(idea.idea)}
          disabled={isSaved}
          className="self-start px-4 py-2 bg-gray-100 text-gray-800 font-semibold rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-all duration-200 text-sm disabled:bg-gray-200 disabled:text-gray-500 disabled:cursor-not-allowed"
        >
          {isSaved ? 'Saved' : 'Save for Later'}
        </button>
      </div>
    </div>
  );
};
