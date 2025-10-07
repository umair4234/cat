
export interface VideoIdea {
    title: string;
    idea: string;
}

export interface SavedIdea {
    id: number;
    text: string;
}

export type ProjectStatus = 'working' | 'completed' | 'archived';

export interface VideoMetadata {
    titles: string[];
    description: string;
    hashtags: string[];
}

export interface Project {
    id: number;
    title: string;
    idea: string;
    script: string;
    json: string;
    status: ProjectStatus;
    createdAt: string;
    metadata?: VideoMetadata;
}

export interface JsonPrompt {
  scene_number: number;
  duration_seconds: number;
  characters: {
    name: string;
    description: string;
  }[];
  prompt_details: {
    setting: string;
    action: string;
    emotion_mood: string;
    camera_shot: string;
    visual_style: string;
  };
}
