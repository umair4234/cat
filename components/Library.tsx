
import React, { useState, useMemo } from 'react';
import type { SavedIdea, Project, ProjectStatus } from '../types';

interface LibraryProps {
  savedIdeas: SavedIdea[];
  projects: Project[];
  onStartProject: (idea: SavedIdea) => void;
  onDeleteIdea: (id: number) => void;
  onProjectAction: (projectId: number, action: 'archive' | 'unarchive' | 'delete' | 'view') => void;
}

const getStatusPill = (status: ProjectStatus) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full';
  switch (status) {
    case 'working':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case 'completed':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'archived':
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export const Library: React.FC<LibraryProps> = ({ 
    savedIdeas, 
    projects, 
    onStartProject, 
    onDeleteIdea, 
    onProjectAction 
}) => {
  const [filter, setFilter] = useState<ProjectStatus | 'all'>('all');

  const filteredProjects = useMemo(() => {
    if (filter === 'all') {
      return projects;
    }
    return projects.filter(p => p.status === filter);
  }, [projects, filter]);
  
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-3xl font-bold text-gray-800 mb-6 border-b pb-3">Saved Ideas ({savedIdeas.length})</h2>
        {savedIdeas.length > 0 ? (
          <div className="space-y-4">
            {savedIdeas.map(idea => (
              <div key={idea.id} className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center">
                <p className="text-gray-700 flex-1 pr-4">{idea.text}</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => onStartProject(idea)}
                    className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700"
                  >
                    Start Project
                  </button>
                  <button 
                    onClick={() => onDeleteIdea(idea.id)}
                    className="px-4 py-2 bg-red-100 text-red-700 text-sm font-semibold rounded-md hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">You have no saved ideas. Generate some and save them for later!</p>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-6 border-b pb-3">
            <h2 className="text-3xl font-bold text-gray-800">Projects ({projects.length})</h2>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                {(['all', 'working', 'completed', 'archived'] as const).map(f => (
                    <button 
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${filter === f ? 'bg-white shadow text-indigo-600' : 'text-gray-600 hover:bg-gray-200'}`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>
        </div>
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <div key={project.id} className="bg-white p-6 rounded-xl shadow-lg border flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-gray-800">{project.title}</h3>
                    <span className={getStatusPill(project.status)}>{project.status}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">Created: {new Date(project.createdAt).toLocaleDateString()}</p>
                  <p className="text-gray-600 text-sm italic border-l-4 border-gray-200 pl-3">"{project.idea.substring(0, 100)}..."</p>
                </div>
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <button onClick={() => onProjectAction(project.id, 'view')} className="flex-1 text-sm px-3 py-2 bg-indigo-100 text-indigo-800 font-semibold rounded-md hover:bg-indigo-200">View</button>
                  {project.status === 'completed' && <button onClick={() => onProjectAction(project.id, 'archive')} className="text-sm px-3 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200">Archive</button>}
                  {project.status === 'archived' && <button onClick={() => onProjectAction(project.id, 'unarchive')} className="text-sm px-3 py-2 bg-gray-100 text-gray-800 font-semibold rounded-md hover:bg-gray-200">Unarchive</button>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No projects match the current filter.</p>
        )}
      </section>
    </div>
  );
};
