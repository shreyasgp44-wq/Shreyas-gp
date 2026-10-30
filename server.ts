import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { Complaint, DashboardStats, Hotspot, DuplicateCluster, Category, Priority, Department } from './src/types/index.ts';
import { INITIAL_COMPLAINTS } from './server/initialData.ts';
import {
  analyzeComplaintWithAI,
  generateActionBriefWithAI,
  isGeminiLive,
  CATEGORY_DEPARTMENT_MAP
} from './server/geminiService.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'complaints.json');

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Ensure persistence data file exists
function loadDatabase(): Complaint[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_COMPLAINTS, null, 2), 'utf-8');
      return INITIAL_COMPLAINTS;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(DATA_FILE, JSON.stringify(INITIAL_COMPLAINTS, null, 2), 'utf-8');
      return INITIAL_COMPLAINTS;
    }
    return parsed;
  } catch (err) {
    console.error('Error loading database, resetting to initial complaints:', err);
    return INITIAL_COMPLAINTS;
  }
}

function saveDatabase(complaints: Complaint[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(complaints, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database:', err);
  }
}

let complaintsCache: Complaint[] = loadDatabase();

const AREA_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'Indiranagar': { lat: 12.9784, lng: 77.6408 },
  'Koramangala': { lat: 12.9352, lng: 77.6245 },
  'Whitefield': { lat: 12.9698, lng: 77.7500 },
  'Jayanagar': { lat: 12.9308, lng: 77.5838 },
  'Malleshwaram': { lat: 13.0031, lng: 77.5702 },
  'MG Road Hub': { lat: 12.9756, lng: 77.6066 },
  'HSR Layout': { lat: 12.9121, lng: 77.6446 },
  'Hebbal': { lat: 13.0358, lng: 77.5970 },
};

// 1. Status Check
app.get('/api/status', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    geminiLive: isGeminiLive(),
    model: 'gemini-3.8-flash',
    totalComplaints: complaintsCache.length,
    serverTime: new Date().toISOString(),
  });
});

// 2. Get Complaints with Filtering
app.get('/api/complaints', (req: Request, res: Response) => {
  const { category, status, priority, area, search, duplicateOnly } = req.query;

  let filtered = [...complaintsCache];

  if (category && category !== 'All') {
    filtered = filtered.filter((c) => c.category === category);
  }
  if (status && status !== 'All') {
    filtered = filtered.filter((c) => c.status === status);
  }
  if (priority && priority !== 'All') {
    filtered = filtered.filter((c) => c.priority === priority);
  }
  if (area && area !== 'All') {
    filtered = filtered.filter((c) => c.area === area);
  }
  if (duplicateOnly === 'true') {
    filtered = filtered.filter((c) => c.isDuplicate);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.area.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q)
    );
  }

  // Sort: newest first
  filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(filtered);
});

// 3. Get Single Complaint by ID
app.get('/api/complaints/:id', (req: Request, res: Response) => {
  const id = req.params.id.toUpperCase();
  const found = complaintsCache.find((c) => c.id.toUpperCase() === id);
  if (!found) {
    return res.status(404).json({ error: `Complaint with ID "${req.params.id}" not found.` });
  }
  res.json(found);
});

// 4. Create New Citizen Complaint with AI Analysis
app.post('/api/complaints', async (req: Request, res: Response) => {
  try {
    const { title, description, category: userCat, area, address, imageUrl, citizenName, citizenPhone } = req.body;

    if (!title || !description || !area) {
      return res.status(400).json({ error: 'Title, description, and area are required.' });
    }

    // Call AI analysis
    const aiAnalysis = await analyzeComplaintWithAI(title, description, area, complaintsCache);

    const baseCoords = AREA_COORDINATES[area] || { lat: 12.9716, lng: 77.5946 };
    // Small random jitter within 300 meters for map realism
    const coordinates = {
      lat: Number((baseCoords.lat + (Math.random() - 0.5) * 0.005).toFixed(6)),
      lng: Number((baseCoords.lng + (Math.random() - 0.5) * 0.005).toFixed(6)),
    };

    const count = complaintsCache.length + 1;
    const complaintId = `CIVIC-2026-${String(count).padStart(4, '0')}`;
    const now = new Date().toISOString();

    const newCategory = (userCat && userCat !== 'Auto-detect' ? userCat : aiAnalysis.category) as Category;
    const department = CATEGORY_DEPARTMENT_MAP[newCategory] || aiAnalysis.department;

    let duplicateGroupId = aiAnalysis.isDuplicate && aiAnalysis.duplicateOfId
      ? (complaintsCache.find((c) => c.id === aiAnalysis.duplicateOfId)?.duplicateGroupId || `DUP-GRP-${complaintId}`)
      : undefined;

    const newComplaint: Complaint = {
      id: complaintId,
      title: title.trim(),
      description: description.trim(),
      category: newCategory,
      department,
      status: 'Submitted',
      priority: aiAnalysis.priority,
      priorityScore: aiAnalysis.priorityScore,
      urgencyScore: aiAnalysis.urgencyScore,
      publicImpactScore: aiAnalysis.publicImpactScore,
      priorityExplanation: aiAnalysis.priorityExplanation,
      aiSummary: aiAnalysis.aiSummary,
      area: area.trim(),
      address: address ? address.trim() : `${area}, Municipal Ward Zone`,
      coordinates,
      imageUrl: imageUrl || undefined,
      citizenName: citizenName ? citizenName.trim() : 'Anonymous Citizen',
      citizenPhone: citizenPhone ? citizenPhone.trim() : undefined,
      createdAt: now,
      updatedAt: now,
      isDuplicate: aiAnalysis.isDuplicate,
      duplicateGroupId,
      duplicateOfId: aiAnalysis.duplicateOfId,
      duplicateConfidence: aiAnalysis.duplicateConfidence,
      duplicateReason: aiAnalysis.duplicateReason,
      actionBrief: aiAnalysis.actionBrief,
      aiModelUsed: aiAnalysis.aiModelUsed,
      citizenUpvotes: 1,
      timeline: [
        {
          status: 'Submitted',
          timestamp: now,
          note: `Complaint registered by ${citizenName || 'citizen'}. AI classified as ${newCategory} (${aiAnalysis.priorityScore}/100 ${aiAnalysis.priority}).`,
          actor: 'Citizen Portal',
        },
      ],
    };

    complaintsCache.unshift(newComplaint);
    saveDatabase(complaintsCache);

    res.status(201).json(newComplaint);
  } catch (err: any) {
    console.error('Failed to create complaint:', err);
    res.status(500).json({ error: err.message || 'Internal server error while processing complaint.' });
  }
});

// 5. Update Complaint Status, Department, or Priority (Admin)
app.patch('/api/complaints/:id', (req: Request, res: Response) => {
  const id = req.params.id.toUpperCase();
  const { status, department, priority, note, actor } = req.body;

  const index = complaintsCache.findIndex((c) => c.id.toUpperCase() === id);
  if (index === -1) {
    return res.status(404).json({ error: `Complaint ${id} not found.` });
  }

  const existing = complaintsCache[index];
  const now = new Date().toISOString();

  let statusChanged = false;
  if (status && status !== existing.status) {
    existing.status = status;
    statusChanged = true;
  }
  if (department) {
    existing.department = department as Department;
  }
  if (priority) {
    existing.priority = priority as Priority;
  }

  existing.updatedAt = now;

  // Add event to timeline
  const timelineNote = note || (statusChanged ? `Status transitioned to "${existing.status}".` : 'Complaint record updated by municipal officer.');
  existing.timeline.push({
    status: existing.status,
    timestamp: now,
    note: timelineNote,
    actor: actor || 'Municipal Admin Desk',
  });

  complaintsCache[index] = existing;
  saveDatabase(complaintsCache);

  res.json(existing);
});

// 6. Upvote/Endorse Complaint (Citizen feature)
app.post('/api/complaints/:id/upvote', (req: Request, res: Response) => {
  const id = req.params.id.toUpperCase();
  const index = complaintsCache.findIndex((c) => c.id.toUpperCase() === id);
  if (index === -1) {
    return res.status(404).json({ error: `Complaint ${id} not found.` });
  }

  complaintsCache[index].citizenUpvotes = (complaintsCache[index].citizenUpvotes || 0) + 1;
  saveDatabase(complaintsCache);

  res.json({ id: complaintsCache[index].id, upvotes: complaintsCache[index].citizenUpvotes });
});

// 7. Generate or Regenerate Action Brief with Gemini
app.post('/api/complaints/:id/action-brief', async (req: Request, res: Response) => {
  try {
    const id = req.params.id.toUpperCase();
    const index = complaintsCache.findIndex((c) => c.id.toUpperCase() === id);
    if (index === -1) {
      return res.status(404).json({ error: `Complaint ${id} not found.` });
    }

    const brief = await generateActionBriefWithAI(complaintsCache[index]);
    complaintsCache[index].actionBrief = brief;
    complaintsCache[index].updatedAt = new Date().toISOString();

    complaintsCache[index].timeline.push({
      status: complaintsCache[index].status,
      timestamp: new Date().toISOString(),
      note: `AI Action Brief generated by ${brief.aiModel}. Work code: ${brief.dispatchCode}.`,
      actor: 'CivicAI Dispatch Intelligence',
    });

    saveDatabase(complaintsCache);
    res.json(brief);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to generate action brief.' });
  }
});

// 8. Reset Demo Data (Hackathon presentation utility)
app.post('/api/complaints/reset-demo', (req: Request, res: Response) => {
  complaintsCache = [...INITIAL_COMPLAINTS];
  saveDatabase(complaintsCache);
  res.json({ message: 'Demo data reset successfully to 36 realistic complaints.', count: complaintsCache.length });
});

// 9. Dashboard Statistics, Hotspots & Duplicate Clusters
app.get('/api/stats', (req: Request, res: Response) => {
  const total = complaintsCache.length;
  const resolved = complaintsCache.filter((c) => c.status === 'Resolved').length;
  const inProgress = complaintsCache.filter((c) => c.status === 'In Progress').length;
  const assigned = complaintsCache.filter((c) => c.status === 'Assigned').length;
  const underReview = complaintsCache.filter((c) => c.status === 'Under Review').length;
  const submitted = complaintsCache.filter((c) => c.status === 'Submitted').length;
  const pending = total - resolved;
  const highPriority = complaintsCache.filter((c) => c.priority === 'Critical' || c.priority === 'High').length;
  const duplicatesDetected = complaintsCache.filter((c) => c.isDuplicate).length;

  const byCategory: Record<Category, number> = {
    Roads: 0,
    Water: 0,
    Waste: 0,
    Electricity: 0,
    Drainage: 0,
    'Public Safety': 0,
  };
  complaintsCache.forEach((c) => {
    if (byCategory[c.category] !== undefined) {
      byCategory[c.category]++;
    }
  });

  const byPriority: Record<Priority, number> = {
    Critical: 0,
    High: 0,
    Medium: 0,
    Low: 0,
  };
  complaintsCache.forEach((c) => {
    if (byPriority[c.priority] !== undefined) {
      byPriority[c.priority]++;
    }
  });

  const byArea: Record<string, number> = {};
  complaintsCache.forEach((c) => {
    byArea[c.area] = (byArea[c.area] || 0) + 1;
  });

  // Hotspots computation
  const hotspotAreas = Object.keys(AREA_COORDINATES);
  const hotspots: Hotspot[] = hotspotAreas.map((areaName) => {
    const areaComplaints = complaintsCache.filter((c) => c.area === areaName);
    const active = areaComplaints.filter((c) => c.status !== 'Resolved').length;
    const critical = areaComplaints.filter((c) => c.priority === 'Critical').length;

    // Top category in area
    const catCounts: Record<string, number> = {};
    areaComplaints.forEach((c) => {
      catCounts[c.category] = (catCounts[c.category] || 0) + 1;
    });
    let topCategory: Category = 'Roads';
    let maxCatCount = 0;
    Object.entries(catCounts).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat as Category;
      }
    });

    let riskLevel: 'Severe' | 'Elevated' | 'Moderate' | 'Low' = 'Low';
    if (critical >= 2 || active >= 6) riskLevel = 'Severe';
    else if (critical >= 1 || active >= 4) riskLevel = 'Elevated';
    else if (active >= 2) riskLevel = 'Moderate';

    const commonIssues = areaComplaints.slice(0, 3).map((c) => c.title);

    return {
      area: areaName,
      totalComplaints: areaComplaints.length,
      activeComplaints: active,
      criticalCount: critical,
      topCategory,
      coordinates: AREA_COORDINATES[areaName] || { lat: 12.9716, lng: 77.5946 },
      riskLevel,
      commonIssues,
    };
  });

  // Duplicate Clusters computation
  const duplicateGroupMap: Record<string, Complaint[]> = {};
  complaintsCache.forEach((c) => {
    if (c.duplicateGroupId) {
      if (!duplicateGroupMap[c.duplicateGroupId]) {
        duplicateGroupMap[c.duplicateGroupId] = [];
      }
      duplicateGroupMap[c.duplicateGroupId].push(c);
    }
  });

  const duplicateClusters: DuplicateCluster[] = Object.entries(duplicateGroupMap)
    .filter(([_, list]) => list.length > 1)
    .map(([groupId, list]) => {
      const primary = list.find((c) => !c.isDuplicate) || list[0];
      const duplicates = list.filter((c) => c.id !== primary.id);
      const avgConfidence = duplicates.reduce((acc, cur) => acc + (cur.duplicateConfidence || 85), 0) / Math.max(1, duplicates.length);

      return {
        groupId,
        primaryComplaint: primary,
        duplicates,
        similarityScore: Math.round(avgConfidence),
        reason: duplicates[0]?.duplicateReason || 'High semantic text similarity and geographical proximity.',
      };
    });

  const stats: DashboardStats = {
    total,
    pending,
    resolved,
    highPriority,
    underReview,
    inProgress,
    assigned,
    duplicatesDetected,
    avgResolutionHours: 4.8,
    byCategory,
    byPriority,
    byArea,
  };

  res.json({
    stats,
    hotspots,
    duplicateClusters,
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Fallback SPA handler for dev
    app.use('*', async (req: Request, res: Response, next) => {
      if (req.originalUrl.startsWith('/api')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicAI server listening on port ${PORT} (dev: ${isDev})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CivicAI server:', err);
});
