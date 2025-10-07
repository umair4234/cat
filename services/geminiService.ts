
import { GoogleGenAI, Type } from "@google/genai";
import type { VideoIdea, JsonPrompt, VideoMetadata } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

const ideaResponseSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
        title: { 
            type: Type.STRING,
            description: 'A catchy, YouTube-style title for the video idea, including relevant emojis.'
        },
        idea: {
            type: Type.STRING,
            description: 'A complete video idea written as a detailed story outline or narrative summary in a single paragraph.'
        }
    },
    required: ["title", "idea"]
  },
};

export const generateVideoIdeas = async (userInstructions: string): Promise<VideoIdea[]> => {
  const defaultPrompt = `
    You are a creative expert specializing in generating heartwarming and emotionally resonant story ideas for animated videos about a family of cats: Mama Cat (wise, loving, protective), Leo (curious, brave, sometimes mischievous son), and Neko (clever, kind, sister).

    Your task is to generate THREE new and unique video story ideas featuring these characters. The stories should revolve around themes of family love, courage, overcoming adversity, kindness, and perseverance. Each idea must include a catchy, YouTube-style title with emojis, and a detailed paragraph that is a complete story outline or a narrative summary, not a description of the video production. The story outline should be detailed enough to be turned into a full script later.

    Here are three excellent examples of the required format and tone:

    1. Title: "⛈️ Lost in the Storm: Mama Cat's Fierce Love ❤️"
       Idea: "On a warm afternoon, curious Leo chases a vibrant butterfly from the safety of his garden into the edge of the deep woods. Suddenly, the sky turns dark and a fierce thunderstorm erupts, leaving Leo lost and terrified as rain soaks his tiny body. After a frantic search of the house, a determined Mama Cat grabs an umbrella and ventures into the howling storm, her heart pounding with every flash of lightning. She discovers her son soaked and unconscious beneath a cold, dark rock, shivering and barely breathing. Back home, she realizes the last of his fever medicine is gone, forcing her to make a second perilous journey across a rain-swollen creek to the distant medical store. Tending to him all night by the fire, her love and courage prevail, and by morning, a weak but safe Leo awakens in his mother's warm, protective embrace."

    2. Title: "🌊 Adrift on the River: A Mother's Daring Rescue! 🙏"
       Idea: "Fascinated by the shimmering river at the edge of their territory, Leo and Neko build a small raft from twigs and leaves, dreaming of adventure. One afternoon, they push their raft into a gentle stream, intending only to float a few feet. But a sudden current catches them, pulling them away from the bank and towards the much larger, faster-moving river. Terrified, they cling to the raft as it spins out of control. Back on the shore, Mama Cat sees what has happened. Her heart pounding, she races along the riverbank, calculating the river’s path. She sprints ahead to a low-hanging willow tree, grabs a long, sturdy vine in her mouth, and swings out over the water just in time to intercept the raft. With all her strength, she pulls her two shaken but safe kittens back to the shore, where they learn a valuable lesson about the power of nature and a mother’s love."

    3. Title: "✨ The Magical Fireflies: A Kitten's Perilous Journey Home 🌳"
       Idea: "Leo learns about the legendary Firefly Festival, an event that happens once a year deep in the Whispering Meadow, where thousands of fireflies gather to light up the sky. He dreams of giving a jar of that magical light to Mama Cat. Against his mother's warnings about the meadow's tricky paths, he sneaks out one evening with an empty jar. He quickly gets lost as identical-looking trees and winding paths confuse him in the twilight. As true darkness falls, strange noises from the woods fill him with terror. Just as he's about to cry, a single, friendly firefly appears and seems to beckon him. He follows it, and it leads him to another, and then another, until a glowing trail illuminates a safe path back home. He arrives to see a frantic Mama Cat and a worried Neko. He didn't capture the fireflies, but he returns with a newfound respect for his mother's wisdom and a story of how the forest's magic guided him safely home."

    Please generate three new story outlines in this exact style.
  `;

  const userPrompt = `
    You are a creative expert who generates compelling story ideas for videos based on user instructions. Your task is to generate THREE new and unique video story ideas.

    **Character Context:** If the user's instructions mention 'Mama Cat', 'Leo', or 'Neko', please use the following character profiles. They are all cats.
    *   **Mama Cat**: A wise, loving, and protective mother cat.
    *   **Leo**: Her curious, brave, and sometimes mischievous son (a kitten).
    *   **Neko**: Her clever, kind daughter (a kitten).
    Stories involving them should revolve around themes of family love, courage, overcoming adversity, kindness, and perseverance.

    **Required Output Format:**
    Each idea you generate must include:
    1. A catchy, YouTube-style title that includes relevant emojis.
    2. A single, detailed paragraph that provides a complete story outline or narrative summary. This must be a story, not a description of the video production (e.g., don't say "Create a video about...", instead, tell the story itself).

    Here is a general example of the required format:
    Title: "🐾 Miles to Go: Buddy's Incredible Journey Home ❤️"
    Idea: "Buddy, a golden retriever, gets spooked by fireworks and runs away from his loving home. Lost and alone in the big city, he faces numerous challenges, from navigating busy streets to finding food. Along the way, he befriends a cynical street cat who reluctantly helps him. The journey tests Buddy's courage and loyalty, culminating in a heartwarming reunion with his worried family, who never gave up searching for him."

    The user has provided the following specific instructions. Please use this as the primary basis for your story ideas: "${userInstructions}"
  `;

  const prompt = userInstructions.trim() ? userPrompt : defaultPrompt;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: ideaResponseSchema,
        temperature: 0.8,
        topP: 0.9,
      },
    });

    const jsonText = response.text.trim();
    const ideas: VideoIdea[] = JSON.parse(jsonText);
    
    if (!Array.isArray(ideas) || ideas.some(i => !i.title || !i.idea)) {
        throw new Error("API did not return a valid array of ideas with titles.");
    }

    return ideas;
  } catch (error) {
    console.error("Error generating video ideas:", error);
    throw new Error("Failed to communicate with the AI model. Please check your connection or API key.");
  }
};


export const generateScriptFromIdea = async (storyIdea: string, duration: string): Promise<{ script: string, title: string }> => {
    // FIX: Replaced backticks with single quotes for example identifiers within the prompt string to prevent parsing errors by linters/compilers.
    const prompt = `
You are an expert Visual Storyteller and Scriptwriter. Your task is to transform a rough video idea into a professional, scene-by-scene visual script suitable for a hyperrealistic AI video generator.

**CRITICAL RULES FOR VISUAL CONSISTENCY (NON-NEGOTIABLE):**

To ensure the final video is coherent, you MUST define all recurring characters and objects with precise physical descriptions.

1.  **Mandatory Main Character Definitions**: You MUST use these exact names and descriptions for the main characters in the "Characters" section.
    *   **MAMA_CAT**: "An adult, wise, and deeply loving orange tabby cat. She is slightly larger and has a calm, motherly presence. Her stripes are well-defined, and she has warm, intelligent green eyes."
    *   **LEO_01**: "Mama Cat's son. A small, energetic, and good-natured orange tabby kitten. He is a miniature version of his mother but with bigger, more curious eyes."
    *   **NEKO_01**: "Leo's sister. A sleek, female tuxedo kitten with a black back, a white chest and belly, and four clean white paws. She is often portrayed as clever and a little mischievous."

2.  **Defining New Characters**: If the story introduces new recurring characters (animals or humans), you MUST create a unique identifier (e.g., 'KITTEN_01', 'ELDERLY_NEIGHBOR_01') and provide a detailed physical description focusing on appearance (breed, fur/hair color, markings, clothing) for visual consistency.
    *   **BAD EXAMPLE**: "The Kitten: A sad, shivering creature." (This describes a temporary state, not a consistent appearance).
    *   **GOOD EXAMPLE**: "**KITTEN_01**: A very small, scruffy kitten with patchy grey and white fur, a whip-thin tail, and large, fearful blue eyes."

3.  **Defining Consistent Objects**: If the story features important recurring objects, create a unique identifier (e.g., 'FOOD_BOWL_01', 'SHELTER_FINAL_01') and provide a detailed physical description.
    *   **BAD EXAMPLE**: "A food bowl."
    *   **GOOD EXAMPLE**: "**FOOD_BOWL_01**: A slightly chipped, heavy ceramic bowl, cream-colored with a simple blue line painted around the rim."
    *   **GOOD EXAMPLE (for an evolving object)**: "**MAKESHIFT_SHELTER_FINAL**: A small, cozy shelter constructed from a base of sturdy twigs, insulated with layers of dried brown oak leaves and soft green moss, with a small, inviting hollowed-out entrance."

**Core Scriptwriting Principles:**

*   **Realism and Cat Behavior**: The cat characters MUST behave realistically. They DO NOT talk. Their emotions are conveyed through actions, body language, and natural cat sounds (meows, purrs, hisses).
*   **"Show, Don't Tell"**: Every key emotion or plot point must be communicated through visual actions.
*   **Logical Flow**: Every scene must have a clear cause and effect.
*   **Pacing**: Based on the target duration (e.g., 3 minutes), calculate the number of scenes needed, assuming each scene is about 8 seconds. A 3-minute video needs ~22-23 scenes.
*   **One Core Idea Per Scene**: Each scene should focus on a single, clear action.

**Your Output Format:**

You must generate the response in this exact format:

Title: [A creative and descriptive title for the video]

Characters:
*   **MAMA_CAT**: "An adult, wise, and deeply loving orange tabby cat..." (Use the mandatory definitions)
*   **LEO_01**: "Mama Cat's son. A small, energetic..." (Use the mandatory definitions)
*   **NEKO_01**: "Leo's sister. A sleek, female tuxedo kitten..." (Use the mandatory definitions)
*   **[NEW_CHARACTER_ID]**: "[Your detailed physical description.]"

Consistent Objects:
*   **[OBJECT_ID]**: "[Your detailed physical description.]"

Story Arc/Video Flow: [A one-sentence summary of the video's narrative journey]

[SCENE 1: Descriptive Title]
Action: [Detailed description of the visual action in this 8-second scene.]

[SCENE 2: Descriptive Title]
Action: [Detailed description of the visual action in this 8-second scene.]

...and so on for all the scenes.

Now, apply all these principles to the following request.

**Rough video idea:**
{
${storyIdea}
}

**Video duration:**
{
${duration}
}
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.9,
            },
        });

        const scriptText = response.text;
        const titleMatch = scriptText.match(/^Title:\s*(.*)$/m);
        const title = titleMatch ? titleMatch[1].trim() : 'Untitled Video';

        return { script: scriptText, title };
    } catch (error) {
        console.error("Error generating script:", error);
        throw new Error("Failed to communicate with the AI model for script generation.");
    }
};

// FIX: Implement and export `generateJsonPromptsFromScript` to convert a script to structured JSON.
const jsonPromptResponseSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            scene_number: { 
                type: Type.INTEGER,
                description: 'The sequential number of the scene, starting from 1.'
            },
            duration_seconds: { 
                type: Type.INTEGER,
                description: 'The estimated duration of this scene in seconds. Usually 8 seconds.'
            },
            characters: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { 
                            type: Type.STRING,
                            description: 'The unique identifier for the character (e.g., MAMA_CAT, LEO_01).'
                        },
                        description: { 
                            type: Type.STRING,
                            description: 'The detailed physical description of the character.'
                        }
                    },
                    required: ["name", "description"]
                },
                description: 'A list of all characters present in this scene.'
            },
            prompt_details: {
                type: Type.OBJECT,
                properties: {
                    setting: { 
                        type: Type.STRING,
                        description: 'A detailed description of the scene\'s environment, time of day, and weather.'
                    },
                    action: { 
                        type: Type.STRING,
                        description: 'A concise but detailed description of the main action occurring in the scene.'
                    },
                    emotion_mood: { 
                        type: Type.STRING,
                        description: 'The dominant emotion or mood of the scene (e.g., "Peaceful and serene," "Tense and fearful," "Heartwarming and loving").'
                    },
                    camera_shot: { 
                        type: Type.STRING,
                        description: 'The type of camera shot to be used (e.g., "Wide shot," "Close-up shot on LEO_01," "Tracking shot following MAMA_CAT").'
                    },
                    visual_style: { 
                        type: Type.STRING,
                        description: 'The overall visual aesthetic. Should be consistent. e.g., "Hyperrealistic, cinematic, warm natural lighting, shallow depth of field, 8K resolution."'
                    }
                },
                required: ["setting", "action", "emotion_mood", "camera_shot", "visual_style"]
            }
        },
        required: ["scene_number", "duration_seconds", "characters", "prompt_details"]
    }
};

export const generateJsonPromptsFromScript = async (script: string): Promise<JsonPrompt[]> => {
    const prompt = `
You are a meticulous Video Production Assistant AI. Your task is to convert a provided visual script into a structured JSON array of prompts for an AI video generator.

**CRITICAL INSTRUCTIONS:**

1.  **Parse the Script**: Carefully read the entire script, paying attention to the "Characters" and "Consistent Objects" definitions, and the scene-by-scene "Action" descriptions.
2.  **Extract Scene Data**: For each numbered scene in the script (e.g., "[SCENE 1: ...]", "[SCENE 2: ...]"), you must extract the necessary information to populate one JSON object in the output array.
3.  **Populate JSON Fields**:
    *   **\`scene_number\`**: The number of the scene.
    *   **\`duration_seconds\`**: Set this to 8 for every scene, as each scene is designed to be 8 seconds long.
    *   **\`characters\`**: Identify all characters mentioned in the scene's "Action" description. For each character, include their unique identifier (\`name\`) and their full physical \`description\` as defined in the "Characters" section of the script. If no characters are in the scene, provide an empty array.
    *   **\`prompt_details.setting\`**: Describe the environment based on the scene's action. Infer details like time of day, location, and weather.
    *   **\`prompt_details.action\`**: Use the exact "Action" text from the script for this field. Do not summarize or change it.
    *   **\`prompt_details.emotion_mood\`**: Infer the emotional tone of the scene (e.g., "Peaceful and serene," "Tense and fearful," "Heartwarming and loving").
    *   **\`prompt_details.camera_shot\`**: Describe the most effective camera shot for the action (e.g., "Wide shot establishing the garden," "Close-up on LEO_01's face showing curiosity," "Tracking shot following MAMA_CAT").
    *   **\`prompt_details.visual_style\`**: Use this exact string for every scene to ensure consistency: "Hyperrealistic, cinematic, warm natural lighting, shallow depth of field, 8K resolution."

**THE SCRIPT TO CONVERT:**
---
${script}
---

Now, generate the JSON array based on the script provided above. Ensure your output is a valid JSON array and nothing else.
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: jsonPromptResponseSchema,
                temperature: 0.2,
            },
        });

        const jsonText = response.text.trim();
        const prompts: JsonPrompt[] = JSON.parse(jsonText);
        
        if (!Array.isArray(prompts)) {
            throw new Error("API did not return a valid array.");
        }

        return prompts;
    } catch (error) {
        console.error("Error generating JSON prompts:", error);
        throw new Error("Failed to communicate with the AI model for JSON prompt generation.");
    }
};

// FIX: Implement and export `generateTitlesAndDescription` to generate video metadata from a script.
const videoMetadataResponseSchema = {
    type: Type.OBJECT,
    properties: {
        titles: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of exactly 3 catchy, YouTube-style video titles, each including relevant emojis."
        },
        description: {
            type: Type.STRING,
            description: "A compelling, paragraph-long video description suitable for YouTube. It should summarize the story's emotional journey and include a friendly call-to-action like 'Watch the full story to see what happens!' or 'Don't forget to like and subscribe for more heartwarming stories!'."
        },
        hashtags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "An array of exactly 10 relevant hashtags for YouTube, without the '#' symbol. Examples: 'catstory', 'animatedshort', 'emotionalstory', 'familylove'."
        }
    },
    required: ["titles", "description", "hashtags"]
};

export const generateTitlesAndDescription = async (script: string): Promise<VideoMetadata> => {
    const prompt = `
You are an expert YouTube Content Strategist AI. Your task is to generate compelling metadata for a video based on its script to maximize its reach and engagement.

**Instructions:**

1.  **Analyze the Script**: Read the provided video script to understand its story, characters, themes, and emotional tone.
2.  **Generate Titles**: Create exactly **three** unique, catchy, YouTube-style titles for the video. The titles should be emotionally resonant and include relevant emojis to attract viewers.
3.  **Write a Description**: Write one paragraph that serves as a compelling YouTube video description. It should summarize the story's emotional journey, create intrigue, and end with a call-to-action (e.g., "Watch the full story to see what happens!", "Like and subscribe for more heartwarming tales!").
4.  **Suggest Hashtags**: Provide exactly **ten** relevant and popular hashtags (without the "#" symbol) that will help the video get discovered. Focus on themes like "cat story," "animated short," "emotional story," "family love," etc.

**THE SCRIPT:**
---
${script}
---

Now, generate the video metadata based on the script above. Ensure your output is a valid JSON object that adheres to the required schema and nothing else.
`;
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: videoMetadataResponseSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const metadata: VideoMetadata = JSON.parse(jsonText);
        
        if (!metadata.titles || !metadata.description || !metadata.hashtags) {
             throw new Error("API did not return valid metadata.");
        }

        return metadata;
    } catch (error) {
        console.error("Error generating video metadata:", error);
        throw new Error("Failed to communicate with the AI model for metadata generation.");
    }
};
