
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { IdeaCard } from './components/IdeaCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { Library } from './components/Library';
import { generateVideoIdeas, generateScriptFromIdea, generateJsonPromptsFromScript, generateTitlesAndDescription } from './services/geminiService';
import * as storageService from './services/storageService';
import type { VideoIdea, Project, SavedIdea, JsonPrompt, VideoMetadata } from './types';

type GeneratorTab = 'ideas' | 'script' | 'json';
type MainTab = 'generator' | 'library';

const App: React.FC = () => {
  // Shared State
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('generator');
  const [activeGeneratorTab, setActiveGeneratorTab] = useState<GeneratorTab>('ideas');

  // Library State
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);

  // Idea Generator State
  const [instructions, setInstructions] = useState<string>('');
  const [ideas, setIdeas] = useState<VideoIdea[]>([]);

  // Script Generator State
  const [scriptVideoIdea, setScriptVideoIdea] = useState<string>('');
  const [videoDuration, setVideoDuration] = useState<string>('3 minutes');
  const [generatedScript, setGeneratedScript] = useState<string>('');

  // JSON Generator State
  const [generatedJson, setGeneratedJson] = useState<string>('');
  const [parsedJsonPrompts, setParsedJsonPrompts] = useState<JsonPrompt[]>([]);
  const [copiedPrompts, setCopiedPrompts] = useState<Set<number>>(new Set());
  const [isRawJsonVisible, setIsRawJsonVisible] = useState<boolean>(false);
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const jsonOutputRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    setSavedIdeas(storageService.getSavedIdeas());
    setProjects(storageService.getProjects());
  }, []);

  const updateProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    storageService.saveProjects(updatedProjects);
  };

  const updateSavedIdeas = (updatedIdeas: SavedIdea[]) => {
    setSavedIdeas(updatedIdeas);
    storageService.saveIdeas(updatedIdeas);
  }

  const handleGenerateIdeas = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIdeas([]);
    try {
      const result = await generateVideoIdeas(instructions);
      setIdeas(result);
    } catch (err) {
      setError(err instanceof Error ? `Failed to generate ideas: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [instructions]);
  
  const handleCreateProjectFromIdea = useCallback((idea: VideoIdea | SavedIdea) => {
    const isSavedIdea = 'text' in idea;
    const ideaText = isSavedIdea ? idea.text : idea.idea;
    const title = isSavedIdea ? 'Untitled Video' : idea.title;
    const ideaId = isSavedIdea ? idea.id : undefined;

    const newProject: Project = {
      id: Date.now(),
      idea: ideaText,
      script: '',
      json: '',
      status: 'working',
      title: title,
      createdAt: new Date().toISOString(),
    };
    const updatedProjects = [...projects, newProject];
    updateProjects(updatedProjects);

    if (ideaId) {
      const updatedIdeas = savedIdeas.filter(saved => saved.id !== ideaId);
      updateSavedIdeas(updatedIdeas);
    }
    
    setCurrentProjectId(newProject.id);
    setScriptVideoIdea(ideaText);
    setGeneratedScript('');
    setGeneratedJson('');
    setParsedJsonPrompts([]);
    setVideoMetadata(null);
    setActiveGeneratorTab('script');
    setActiveMainTab('generator');
  }, [projects, savedIdeas]);

  const handleGenerateScript = useCallback(async () => {
    if (!scriptVideoIdea.trim() || !currentProjectId) {
      setError('Please provide a video idea and have an active project to generate a script.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setGeneratedScript('');
    setGeneratedJson('');
    setParsedJsonPrompts([]);
    setCopiedPrompts(new Set());
    setVideoMetadata(null);

    try {
      // Step 1: Generate Script
      const { script, title } = await generateScriptFromIdea(scriptVideoIdea, videoDuration);
      setGeneratedScript(script);

      // Step 2: Generate JSON from the new script
      const jsonResult = await generateJsonPromptsFromScript(script);
      const jsonString = JSON.stringify(jsonResult, null, 2);
      setGeneratedJson(jsonString);
      setParsedJsonPrompts(jsonResult);
      
      // Step 3: Update project with all new data and save
      const updatedProjects = projects.map(p => 
        p.id === currentProjectId ? { ...p, script, title, json: jsonString, status: 'completed' } : p
      );
      updateProjects(updatedProjects);
      
      // Step 4: Switch tab to show the results
      setActiveGeneratorTab('json');

    } catch (err) {
      setError(err instanceof Error ? `Failed to generate script or JSON prompts: ${err.message}` : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [scriptVideoIdea, videoDuration, projects, currentProjectId]);

  const handleGenerateMetadata = useCallback(async () => {
    if (!generatedScript.trim() || !currentProjectId) {
        setError('A script must be generated first to create titles and descriptions.');
        return;
    }
    setIsLoading(true);
    setError(null);
    setVideoMetadata(null);
    try {
        const result = await generateTitlesAndDescription(generatedScript);
        setVideoMetadata(result);
        const updatedProjects = projects.map(p => 
            p.id === currentProjectId ? { ...p, metadata: result } : p
        );
        updateProjects(updatedProjects);
    } catch (err) {
        setError(err instanceof Error ? `Failed to generate metadata: ${err.message}` : 'An unknown error occurred.');
    } finally {
        setIsLoading(false);
    }
}, [generatedScript, projects, currentProjectId]);


  const copyJsonToClipboard = useCallback(() => {
    if (jsonOutputRef.current) {
      navigator.clipboard.writeText(jsonOutputRef.current.textContent || '');
    }
  }, []);

  const handleCopyPrompt = useCallback((prompt: JsonPrompt) => {
    const promptText = JSON.stringify(prompt, null, 2);
    navigator.clipboard.writeText(promptText);
    setCopiedPrompts(prev => {
        const newSet = new Set(prev);
        newSet.add(prompt.scene_number);
        return newSet;
    });
  }, []);

  const handleSaveIdea = useCallback((ideaToSave: string) => {
    if (savedIdeas.some(idea => idea.text === ideaToSave)) return;
    const newIdea: SavedIdea = { id: Date.now(), text: ideaToSave };
    updateSavedIdeas([...savedIdeas, newIdea]);
  }, [savedIdeas]);

  const handleSaveAllIdeas = useCallback(() => {
    const ideasToSave = ideas.map(i => i.idea).filter(ideaText => !savedIdeas.some(saved => saved.text === ideaText));
    const newSavedIdeas: SavedIdea[] = ideasToSave.map(text => ({ id: Date.now() + Math.random(), text }));
    updateSavedIdeas([...savedIdeas, ...newSavedIdeas]);
  }, [ideas, savedIdeas]);

  const handleDeleteIdea = (id: number) => {
    updateSavedIdeas(savedIdeas.filter(idea => idea.id !== id));
  };

  const handleProjectAction = (projectId: number, action: 'archive' | 'unarchive' | 'delete' | 'view') => {
    if (action === 'view') {
        const project = projects.find(p => p.id === projectId);
        if (project) {
            setCurrentProjectId(project.id);
            setScriptVideoIdea(project.idea);
            setGeneratedScript(project.script);
            setGeneratedJson(project.json);
            setVideoMetadata(project.metadata || null);
            if (project.json) {
                try {
                    setParsedJsonPrompts(JSON.parse(project.json));
                } catch {
                    setParsedJsonPrompts([]);
                }
            } else {
                setParsedJsonPrompts([]);
            }
            setActiveGeneratorTab(project.json ? 'json' : (project.script ? 'script' : 'ideas'));
            setActiveMainTab('generator');
        }
        return;
    }

    let updatedProjects = [...projects];
    if (action === 'archive') {
      updatedProjects = projects.map(p => p.id === projectId ? { ...p, status: 'archived' } : p);
    } else if (action === 'unarchive') {
      updatedProjects = projects.map(p => p.id === projectId ? { ...p, status: 'completed' } : p);
    } else if (action === 'delete') {
      updatedProjects = projects.filter(p => p.id !== projectId);
    }
    updateProjects(updatedProjects);
  };
  
  const renderGeneratorTabs = () => (
    <div className="border-b border-gray-200 mb-8">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
              onClick={() => setActiveGeneratorTab('ideas')}
              className={`${
                  activeGeneratorTab === 'ideas'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg focus:outline-none`}
          >
              1. Video Idea Generator
          </button>
          <button
              onClick={() => setActiveGeneratorTab('script')}
              className={`${
                  activeGeneratorTab === 'script'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg focus:outline-none`}
          >
              2. Script Generator
          </button>
          <button
              onClick={() => setActiveGeneratorTab('json')}
              className={`${
                  activeGeneratorTab === 'json'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg focus:outline-none`}
          >
              3. JSON Prompts Generator
          </button>
      </nav>
    </div>
  );

  const renderIdeaGenerator = () => (
    <>
      <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Create Your Video Concept</h2>
        <p className="text-gray-500 mb-6">
          Optionally add specific instructions or a theme. If left blank, we'll generate ideas based on our cat characters: Mama Cat, Leo, and Neko.
        </p>
        <div className="flex flex-col gap-4">
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="e.g., A video series about space exploration for beginners..."
            className="w-full h-32 p-4 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none bg-gray-700 text-gray-100 placeholder-gray-400"
            disabled={isLoading}
            aria-label="Optional video instructions"
          />
          <button
            onClick={handleGenerateIdeas}
            disabled={isLoading}
            className="self-start px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
          >
            {isLoading ? 'Generating...' : 'Generate Ideas'}
          </button>
        </div>
      </section>
      
      {ideas.length > 0 && (
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800">Generated Video Ideas</h2>
            <button
              onClick={handleSaveAllIdeas}
              className="px-6 py-2 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-300"
            >
                Save All Ideas
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {ideas.map((idea, index) => (
              <IdeaCard 
                key={index} 
                idea={idea} 
                index={index} 
                onStartProject={handleCreateProjectFromIdea}
                onSave={handleSaveIdea}
                isSaved={savedIdeas.some(saved => saved.text === idea.idea)}
              />
            ))}
          </div>
        </section>
      )}

      {!isLoading && ideas.length === 0 && !error && activeGeneratorTab === 'ideas' && (
          <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Your next great video idea awaits. Click "Generate Ideas" to begin!</p>
          </div>
      )}
    </>
  );

  const renderScriptGenerator = () => (
    <>
        <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Expand Your Idea into a Script</h2>
            <p className="text-gray-500 mb-6">
                Paste your video idea below, set a target duration, and we'll generate a detailed, scene-by-scene visual script.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 flex flex-col gap-2">
                    <label htmlFor="video-idea" className="font-semibold text-gray-600">Rough Video Idea</label>
                    <textarea
                        id="video-idea"
                        value={scriptVideoIdea}
                        onChange={(e) => setScriptVideoIdea(e.target.value)}
                        placeholder="Paste a video idea here..."
                        className="w-full h-48 p-4 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 resize-none bg-gray-700 text-gray-100 placeholder-gray-400"
                        disabled={isLoading}
                        aria-label="Rough video idea input"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label htmlFor="duration" className="font-semibold text-gray-600">Target Video Duration</label>
                    <input
                        id="duration"
                        type="text"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(e.target.value)}
                        className="w-full p-4 border border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow duration-200 bg-gray-700 text-gray-100"
                        disabled={isLoading}
                        aria-label="Target video duration"
                    />
                </div>
            </div>
            <button
                onClick={handleGenerateScript}
                disabled={isLoading || !currentProjectId}
                className="mt-6 px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
                {isLoading ? 'Generating...' : 'Generate Script & JSON Prompts'}
            </button>
        </section>

        {generatedScript && (
            <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-3xl font-bold text-gray-800">Generated Script</h2>
                </div>
                <pre className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap font-mono text-sm text-gray-700 overflow-x-auto">{generatedScript}</pre>
            </section>
        )}

        {!isLoading && !generatedScript && !error && activeGeneratorTab === 'script' && (
             <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Start a new project from the 'Ideas' tab or your Library to generate a script.</p>
            </div>
        )}
    </>
  );

  const renderJsonGenerator = () => (
    <section className="bg-white rounded-xl shadow-lg p-6 md:p-8 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Convert Script to JSON Prompts</h2>
        <p className="text-gray-500 mb-6">
            The script from the previous step is converted into precise, scene-by-scene JSON prompts for an AI video generator.
        </p>

        {parsedJsonPrompts.length > 0 && (
            <div>
                <div className="mb-4">
                    <button
                        onClick={() => setIsRawJsonVisible(!isRawJsonVisible)}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                        aria-expanded={isRawJsonVisible}
                    >
                        {isRawJsonVisible ? 'Hide' : 'Show'} Full Raw JSON
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform ${isRawJsonVisible ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>

                {isRawJsonVisible && (
                    <div className="relative mb-8">
                         <button
                            onClick={copyJsonToClipboard}
                            className="absolute top-4 right-4 px-3 py-1 bg-gray-600 text-white text-xs font-semibold rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                            aria-label="Copy all JSON to clipboard"
                        >
                            Copy All
                        </button>
                        <pre ref={jsonOutputRef} className="bg-gray-800 text-green-300 p-6 rounded-lg whitespace-pre-wrap font-mono text-sm overflow-x-auto">{generatedJson}</pre>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {parsedJsonPrompts.map((prompt) => {
                        const isCopied = copiedPrompts.has(prompt.scene_number);
                        const cardClasses = `p-4 rounded-lg border-2 flex flex-col gap-2 transition-all ${isCopied ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'}`;
                        const actionSnippet = prompt.prompt_details.action;

                        return (
                            <div key={prompt.scene_number} className={cardClasses}>
                                <div className="flex justify-between items-center">
                                    <h4 className="font-bold text-gray-700">Scene #{prompt.scene_number}</h4>
                                    <button
                                        onClick={() => handleCopyPrompt(prompt)}
                                        className="px-3 py-1 bg-indigo-500 text-white text-xs font-semibold rounded-md hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                                    >
                                        Copy
                                    </button>
                                </div>
                                <p className="text-xs text-gray-600 font-mono bg-gray-50 p-2 rounded overflow-hidden text-ellipsis whitespace-nowrap" title={actionSnippet}>
                                    {actionSnippet}
                                </p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 border-t pt-8">
                    {!videoMetadata && (
                        <button
                            onClick={handleGenerateMetadata}
                            disabled={isLoading}
                            className="px-8 py-3 bg-teal-600 text-white font-semibold rounded-lg shadow-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300"
                        >
                            {isLoading ? 'Generating...' : 'Generate Titles & Description'}
                        </button>
                    )}
                    {videoMetadata && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-3">Generated Video Titles</h3>
                                <ul className="list-disc list-inside space-y-2 pl-2">
                                    {videoMetadata.titles.map((title, index) => (
                                        <li key={index} className="text-gray-600">{title}</li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-3">Generated Description</h3>
                                <p className="bg-gray-50 p-4 rounded-lg text-gray-700 italic">"{videoMetadata.description}"</p>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-700 mb-3">Suggested Hashtags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {videoMetadata.hashtags.map((tag, index) => (
                                        <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {!isLoading && parsedJsonPrompts.length === 0 && !error && activeGeneratorTab === 'json' && (
             <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Generate a script in Tab 2, then convert it to JSON prompts here.</p>
            </div>
        )}
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="border-b border-gray-200 mb-8">
            <nav className="-mb-px flex space-x-8" aria-label="Main Tabs">
                <button
                    onClick={() => setActiveMainTab('generator')}
                    className={`${
                        activeMainTab === 'generator'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-xl focus:outline-none`}
                >
                    Generator
                </button>
                <button
                    onClick={() => setActiveMainTab('library')}
                    className={`${
                        activeMainTab === 'library'
                            ? 'border-indigo-500 text-indigo-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-xl focus:outline-none`}
                >
                    Library ({savedIdeas.length + projects.length})
                </button>
            </nav>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner />
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg my-4" role="alert">
            <strong className="font-bold">Oh no! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {activeMainTab === 'generator' && (
          <>
            {renderGeneratorTabs()}
            {activeGeneratorTab === 'ideas' && renderIdeaGenerator()}
            {activeGeneratorTab === 'script' && renderScriptGenerator()}
            {activeGeneratorTab === 'json' && renderJsonGenerator()}
          </>
        )}

        {activeMainTab === 'library' && (
            <Library 
                savedIdeas={savedIdeas}
                projects={projects}
                onStartProject={handleCreateProjectFromIdea}
                onDeleteIdea={handleDeleteIdea}
                onProjectAction={handleProjectAction}
            />
        )}

      </main>
    </div>
  );
};

export default App;
