
import type { SavedIdea, Project } from '../types';

const SAVED_IDEAS_KEY = 'ai_story_crafter_saved_ideas';
const PROJECTS_KEY = 'ai_story_crafter_projects';

// === Saved Ideas Functions ===

export const getSavedIdeas = (): SavedIdea[] => {
  try {
    const ideasJson = localStorage.getItem(SAVED_IDEAS_KEY);
    return ideasJson ? JSON.parse(ideasJson) : [];
  } catch (error) {
    console.error("Failed to parse saved ideas from localStorage", error);
    return [];
  }
};

export const saveIdeas = (ideas: SavedIdea[]): void => {
  try {
    localStorage.setItem(SAVED_IDEAS_KEY, JSON.stringify(ideas));
  } catch (error) {
    console.error("Failed to save ideas to localStorage", error);
  }
};

// === Projects Functions ===

export const getProjects = (): Project[] => {
  try {
    const projectsJson = localStorage.getItem(PROJECTS_KEY);
    return projectsJson ? JSON.parse(projectsJson) : [];
  } catch (error) {
    console.error("Failed to parse projects from localStorage", error);
    return [];
  }
};

export const saveProjects = (projects: Project[]): void => {
  try {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error("Failed to save projects to localStorage", error);
  }
};
