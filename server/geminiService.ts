import { GoogleGenAI } from '@google/genai';
import { Category, Department, Priority, ActionBrief, Complaint } from '../src/types/index.ts';

const apiKey = process.env.GEMINI_API_KEY;

let aiClient: GoogleGenAI | null = null;
if (apiKey) {
  aiClient = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function isGeminiLive(): boolean {
  return !!aiClient && !!process.env.GEMINI_API_KEY;
}

export const CATEGORY_DEPARTMENT_MAP: Record<Category, Department> = {
  'Roads': 'Roads & Infrastructure',
  'Water': 'Water Supply & Sewerage',
  'Waste': 'Solid Waste Management',
  'Electricity': 'Electricity & Energy Board',
  'Drainage': 'Stormwater & Drainage',
  'Public Safety': 'Public Safety & Vigilance',
};

export interface AIAnalysisResult {
  category: Category;
  department: Department;
  aiSummary: string;
  urgencyScore: number;
  publicImpactScore: number;
  priorityScore: number;
  priority: Priority;
  priorityExplanation: string;
  isDuplicate: boolean;
  duplicateOfId?: string;
  duplicateConfidence?: number;
  duplicateReason?: string;
  actionBrief?: ActionBrief;
  aiModelUsed: string;
}

export async function analyzeComplaintWithAI(
  title: string,
  description: string,
  area: string,
  existingComplaints: Complaint[]
): Promise<AIAnalysisResult> {
  // If Gemini API is available, try Gemini 3.8 Flash first
  if (aiClient) {
    try {
      const candidates = existingComplaints
        .slice(-25)
        .map((c) => ({
          id: c.id,
          title: c.title,
          category: c.category,
          area: c.area,
          summary: c.aiSummary,
        }));

      const prompt = `You are the lead AI municipal intelligence system for CivicAI.
Analyze the following citizen civic complaint report and provide a comprehensive structured triage:

NEW COMPLAINT:
Title: "${title}"
Description: "${description}"
Area: "${area}"

RECENT EXISTING OPEN COMPLAINTS:
${JSON.stringify(candidates, null, 2)}

TASK:
1. Categorize into exactly one of: "Roads", "Water", "Waste", "Electricity", "Drainage", "Public Safety".
2. Generate a concise 1-sentence executive summary (max 20 words).
3. Evaluate Urgency (1 to 10 scale: speed required to prevent harm or infrastructure loss).
4. Evaluate Public Impact (1 to 10 scale: number of citizens affected, transit disruption, vulnerability).
5. Calculate overall Priority Score (0 to 100).
6. Assign Priority tier: "Critical" (90-100), "High" (75-89), "Medium" (50-74), or "Low" (0-49).
7. Write a 1-2 sentence explanation of why this priority was assigned.
8. Check if this complaint is a duplicate of any existing complaint above (same issue & location).
9. Create a field action brief for the municipal response crew.

Return strictly valid JSON with this schema:
{
  "category": "Roads" | "Water" | "Waste" | "Electricity" | "Drainage" | "Public Safety",
  "aiSummary": "string",
  "urgencyScore": number (1-10),
  "publicImpactScore": number (1-10),
  "priorityScore": number (0-100),
  "priority": "Critical" | "High" | "Medium" | "Low",
  "priorityExplanation": "string",
  "isDuplicate": boolean,
  "duplicateOfId": "string or null",
  "duplicateConfidence": number (0-100 or 0),
  "duplicateReason": "string or null",
  "recommendedAction": "string",
  "assignedCrew": "string",
  "estimatedResolutionHours": number,
  "equipmentRequired": ["string", "string"],
  "safetyPrecautions": "string",
  "dispatchCode": "string"
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 4000)
      );

      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        const category = validateCategory(parsed.category);
        const department = CATEGORY_DEPARTMENT_MAP[category];

        return {
          category,
          department,
          aiSummary: parsed.aiSummary || title,
          urgencyScore: Math.min(10, Math.max(1, Math.round(parsed.urgencyScore || 5))),
          publicImpactScore: Math.min(10, Math.max(1, Math.round(parsed.publicImpactScore || 5))),
          priorityScore: Math.min(100, Math.max(1, Math.round(parsed.priorityScore || 50))),
          priority: validatePriority(parsed.priority),
          priorityExplanation: parsed.priorityExplanation || 'Calculated based on hazard assessment.',
          isDuplicate: !!parsed.isDuplicate,
          duplicateOfId: parsed.duplicateOfId || undefined,
          duplicateConfidence: parsed.duplicateConfidence ? Math.round(parsed.duplicateConfidence) : undefined,
          duplicateReason: parsed.duplicateReason || undefined,
          actionBrief: {
            recommendedAction: parsed.recommendedAction || 'Inspect and execute standard repairs.',
            assignedCrew: parsed.assignedCrew || `${department} Field Unit`,
            estimatedResolutionHours: parsed.estimatedResolutionHours || 4,
            equipmentRequired: Array.isArray(parsed.equipmentRequired) ? parsed.equipmentRequired : ['Standard repair kit'],
            safetyPrecautions: parsed.safetyPrecautions || 'Wear standard municipal PPE.',
            dispatchCode: parsed.dispatchCode || `CIV-${category.substring(0, 3).toUpperCase()}-101`,
            generatedAt: new Date().toISOString(),
            aiModel: 'Gemini 3.8 Flash',
          },
          aiModelUsed: 'Gemini 3.8 Flash',
        };
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart heuristic:', err);
    }
  }

  // Smart Heuristic Engine (Fallback)
  return fallbackHeuristicAnalysis(title, description, area, existingComplaints);
}

export async function generateActionBriefWithAI(complaint: Complaint): Promise<ActionBrief> {
  if (aiClient) {
    try {
      const prompt = `You are the lead engineering dispatcher for municipal public works.
Create a detailed operational action brief for the following civic complaint:

ID: ${complaint.id}
Title: ${complaint.title}
Description: ${complaint.description}
Category: ${complaint.category}
Area: ${complaint.area}
Address: ${complaint.address}
Priority: ${complaint.priority} (Score: ${complaint.priorityScore}/100)

Return strictly valid JSON:
{
  "recommendedAction": "Detailed step-by-step technical and field action plan",
  "assignedCrew": "Specialized municipal unit or team name",
  "estimatedResolutionHours": number (e.g. 2, 4, 8, 24),
  "equipmentRequired": ["equipment 1", "equipment 2", "equipment 3", "equipment 4"],
  "safetyPrecautions": "Detailed worker and public safety protocol",
  "dispatchCode": "Official code like RD-EMERG-401 or ELEC-HAZ-105"
}`;

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Gemini API timeout')), 4000)
      );

      const generatePromise = aiClient.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const response = (await Promise.race([generatePromise, timeoutPromise])) as any;

      const text = response.text;
      if (text) {
        const parsed = JSON.parse(text);
        return {
          recommendedAction: parsed.recommendedAction,
          assignedCrew: parsed.assignedCrew,
          estimatedResolutionHours: parsed.estimatedResolutionHours || 4,
          equipmentRequired: parsed.equipmentRequired || ['Standard equipment'],
          safetyPrecautions: parsed.safetyPrecautions || 'Enforce standard municipal work-zone safety protocol.',
          dispatchCode: parsed.dispatchCode || `CIV-${complaint.category.substring(0, 3).toUpperCase()}-202`,
          generatedAt: new Date().toISOString(),
          aiModel: 'Gemini 3.8 Flash',
        };
      }
    } catch (err) {
      console.warn('Gemini action brief generation failed, using fallback:', err);
    }
  }

  return generateFallbackActionBrief(complaint);
}

function validateCategory(cat: string): Category {
  const normalized = (cat || '').toLowerCase().trim();
  if (normalized.includes('road') || normalized.includes('pothole') || normalized.includes('traffic') || normalized.includes('asphalt')) return 'Roads';
  if (normalized.includes('water') || normalized.includes('pipe') || normalized.includes('leak') || normalized.includes('potable')) return 'Water';
  if (normalized.includes('waste') || normalized.includes('garbage') || normalized.includes('trash') || normalized.includes('debris')) return 'Waste';
  if (normalized.includes('electric') || normalized.includes('wire') || normalized.includes('light') || normalized.includes('transformer')) return 'Electricity';
  if (normalized.includes('drain') || normalized.includes('flood') || normalized.includes('sewer') || normalized.includes('waterlog')) return 'Drainage';
  if (normalized.includes('safe') || normalized.includes('hazard') || normalized.includes('manhole') || normalized.includes('spill')) return 'Public Safety';
  return 'Roads';
}

function validatePriority(p: string): Priority {
  const norm = (p || '').toLowerCase();
  if (norm.includes('crit')) return 'Critical';
  if (norm.includes('high')) return 'High';
  if (norm.includes('med')) return 'Medium';
  return 'Low';
}

// Sophisticated Heuristic Fallback
function fallbackHeuristicAnalysis(
  title: string,
  description: string,
  area: string,
  existingComplaints: Complaint[]
): AIAnalysisResult {
  const text = `${title} ${description}`.toLowerCase();

  // Category determination
  let category: Category = 'Roads';
  if (text.includes('pothole') || text.includes('crater') || text.includes('road') || text.includes('asphalt') || text.includes('divider') || text.includes('footpath') || text.includes('trench')) {
    category = 'Roads';
  } else if (text.includes('pipe') || text.includes('drinking water') || text.includes('tap') || text.includes('potable') || text.includes('water supply') || text.includes('water pressure')) {
    category = 'Water';
  } else if (text.includes('garbage') || text.includes('waste') || text.includes('trash') || text.includes('dump') || text.includes('stench') || text.includes('debris') || text.includes('carcass')) {
    category = 'Waste';
  } else if (text.includes('electric') || text.includes('wire') || text.includes('pole') || text.includes('transformer') || text.includes('power') || text.includes('streetlight') || text.includes('spark')) {
    category = 'Electricity';
  } else if (text.includes('drain') || text.includes('waterlog') || text.includes('flood') || text.includes('sewage') || text.includes('gutter') || text.includes('canal') || text.includes('subway')) {
    category = 'Drainage';
  } else if (text.includes('manhole') || text.includes('danger') || text.includes('spill') || text.includes('safety') || text.includes('accident') || text.includes('injury')) {
    category = 'Public Safety';
  }

  // Urgency & Impact scoring
  let urgency = 5;
  let impact = 5;

  const criticalKeywords = ['urgent', 'emergency', 'danger', 'fatal', 'death', 'live wire', 'sparking', 'submerged', 'geyser', 'manhole', 'sinkhole', 'collapse', 'hospital', 'school', 'burst', 'spill'];
  const highKeywords = ['severe', 'major', 'overflow', 'choked', 'traffic jam', 'broken', 'skid', 'accident', 'injury', 'stagnant', 'deep', 'crater'];

  criticalKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      urgency += 2;
      impact += 2;
    }
  });

  highKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      urgency += 1;
      impact += 1;
    }
  });

  urgency = Math.min(10, Math.max(2, urgency));
  impact = Math.min(10, Math.max(2, impact));

  // Compute Priority score 0-100
  const priorityScore = Math.min(100, Math.round(urgency * 5.2 + impact * 4.8));

  let priority: Priority = 'Medium';
  if (priorityScore >= 90) priority = 'Critical';
  else if (priorityScore >= 75) priority = 'High';
  else if (priorityScore >= 50) priority = 'Medium';
  else priority = 'Low';

  let explanation = `Assessed urgency (${urgency}/10) and public transit impact (${impact}/10).`;
  if (priority === 'Critical') {
    explanation = `Critical life-safety or structural collapse hazard requiring emergency rapid response in ${area}.`;
  } else if (priority === 'High') {
    explanation = `High severity civic disruption affecting commuter mobility and local neighborhood hygiene in ${area}.`;
  } else if (priority === 'Medium') {
    explanation = `Moderate civic inconvenience scheduled for standard zonal maintenance workflow.`;
  }

  // Summary
  const aiSummary = title.length > 80 ? `${title.substring(0, 77)}...` : title;

  // Duplicate detection using Jaccard text similarity + area match
  let isDuplicate = false;
  let duplicateOfId: string | undefined;
  let duplicateConfidence: number | undefined;
  let duplicateReason: string | undefined;

  const titleWords = new Set(title.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 3));

  for (const existing of existingComplaints) {
    if (existing.area.toLowerCase() === area.toLowerCase() || existing.category === category) {
      const existingWords = new Set(
        `${existing.title} ${existing.description}`.toLowerCase().replace(/[^a-z0-9 ]/g, '').split(/\s+/).filter((w) => w.length > 3)
      );

      let commonCount = 0;
      titleWords.forEach((word) => {
        if (existingWords.has(word)) commonCount++;
      });

      const similarity = titleWords.size > 0 ? (commonCount / titleWords.size) * 100 : 0;

      if (similarity >= 55) {
        isDuplicate = true;
        duplicateOfId = existing.duplicateOfId || existing.id;
        duplicateConfidence = Math.min(98, Math.round(similarity + (existing.area.toLowerCase() === area.toLowerCase() ? 25 : 5)));
        duplicateReason = `High semantic text similarity (${duplicateConfidence}%) and spatial overlap with existing report ${existing.id}.`;
        break;
      }
    }
  }

  const department = CATEGORY_DEPARTMENT_MAP[category];

  return {
    category,
    department,
    aiSummary,
    urgencyScore: urgency,
    publicImpactScore: impact,
    priorityScore,
    priority,
    priorityExplanation: explanation,
    isDuplicate,
    duplicateOfId,
    duplicateConfidence,
    duplicateReason,
    actionBrief: {
      recommendedAction: `Deploy ${department} zonal team to inspect ${area} site, verify structural boundary, and execute rapid restoration.`,
      assignedCrew: `${department} Quick Response Team`,
      estimatedResolutionHours: priority === 'Critical' ? 2 : priority === 'High' ? 6 : 24,
      equipmentRequired: ['Standard inspection kit', 'Barricade safety tape', 'Rapid repair tools', 'Zonal transport truck'],
      safetyPrecautions: 'Ensure high-visibility reflective vests and maintain safe pedestrian perimeter.',
      dispatchCode: `CIV-${category.substring(0, 3).toUpperCase()}-101`,
      generatedAt: new Date().toISOString(),
      aiModel: 'CivicAI Heuristic Engine',
    },
    aiModelUsed: 'CivicAI Heuristic Engine',
  };
}

function generateFallbackActionBrief(complaint: Complaint): ActionBrief {
  const categoryCodes: Record<Category, string> = {
    'Roads': 'RD-OPS',
    'Water': 'WTR-VALV',
    'Waste': 'SWM-CLR',
    'Electricity': 'ELEC-REP',
    'Drainage': 'DRN-PUMP',
    'Public Safety': 'SAF-CORD',
  };

  return {
    recommendedAction: `Dispatch dedicated ${complaint.department} crew to ${complaint.address}. Cordon off zone, conduct diagnostic checks, and remediate root cause.`,
    assignedCrew: `${complaint.department} Priority Task Force`,
    estimatedResolutionHours: complaint.priority === 'Critical' ? 2 : complaint.priority === 'High' ? 4 : 12,
    equipmentRequired: [
      'Field inspection telemetry tool',
      'Reflective traffic hazard cones (6)',
      'Department standard heavy toolkit',
      'Communication radio & GPS logger',
    ],
    safetyPrecautions: 'Verify zero energized lines, ensure gas detection in confined spaces, and maintain safety perimeter.',
    dispatchCode: `${categoryCodes[complaint.category] || 'GEN'}-${Math.floor(100 + Math.random() * 900)}`,
    generatedAt: new Date().toISOString(),
    aiModel: 'CivicAI Heuristic Engine',
  };
}
