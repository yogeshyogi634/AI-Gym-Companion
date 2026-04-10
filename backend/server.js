import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import Upload from './models/Upload.js';
import Meal from './models/Meal.js';
import WorkoutLog from './models/WorkoutLog.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, 'uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const uploadRecord = new Upload({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      filePath: req.file.path,
      metadata: req.body.metadata ? JSON.parse(req.body.metadata) : {}
    });

    await uploadRecord.save();

    res.json({
      success: true,
      upload: {
        id: uploadRecord._id,
        filename: uploadRecord.filename,
        originalName: uploadRecord.originalName,
        mimetype: uploadRecord.mimetype,
        size: uploadRecord.size,
        uploadDate: uploadRecord.uploadDate,
        url: `/uploads/${uploadRecord.filename}`
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to save upload information' });
  }
});

// Get all uploads
app.get('/api/uploads', async (req, res) => {
  try {
    const uploads = await Upload.find().sort({ uploadDate: -1 });
    
    const uploadsWithUrls = uploads.map(upload => ({
      id: upload._id,
      filename: upload.filename,
      originalName: upload.originalName,
      mimetype: upload.mimetype,
      size: upload.size,
      uploadDate: upload.uploadDate,
      metadata: upload.metadata,
      url: `/uploads/${upload.filename}`
    }));

    res.json({ uploads: uploadsWithUrls });
  } catch (error) {
    console.error('Fetch uploads error:', error);
    res.status(500).json({ error: 'Failed to fetch uploads' });
  }
});

// Get single upload by ID
app.get('/api/uploads/:id', async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    res.json({
      id: upload._id,
      filename: upload.filename,
      originalName: upload.originalName,
      mimetype: upload.mimetype,
      size: upload.size,
      uploadDate: upload.uploadDate,
      metadata: upload.metadata,
      url: `/uploads/${upload.filename}`
    });
  } catch (error) {
    console.error('Fetch upload error:', error);
    res.status(500).json({ error: 'Failed to fetch upload' });
  }
});

// Delete upload
app.delete('/api/uploads/:id', async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id);
    
    if (!upload) {
      return res.status(404).json({ error: 'Upload not found' });
    }

    // Delete file from filesystem
    try {
      fs.unlinkSync(upload.filePath);
    } catch (fsError) {
      console.warn('File deletion warning:', fsError.message);
    }

    // Delete from database
    await Upload.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'Upload deleted successfully' });
  } catch (error) {
    console.error('Delete upload error:', error);
    res.status(500).json({ error: 'Failed to delete upload' });
  }
});

// ═══ MEALS ═══

// Get all meals for a date
app.get('/api/meals/:date', async (req, res) => {
  try {
    const meals = await Meal.find({ date: req.params.date });
    const result = {};
    meals.forEach(m => {
      result[m.slot] = { text: m.text, macros: m.macros, items: m.items };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Save / update a meal slot
app.put('/api/meals/:date/:slot', async (req, res) => {
  try {
    const { text, macros, items } = req.body;
    const meal = await Meal.findOneAndUpdate(
      { date: req.params.date, slot: req.params.slot },
      { text, macros, items },
      { upsert: true, new: true }
    );
    res.json({ success: true, meal });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save meal' });
  }
});

// Delete a meal slot
app.delete('/api/meals/:date/:slot', async (req, res) => {
  try {
    await Meal.findOneAndDelete({ date: req.params.date, slot: req.params.slot });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

// Get all meals (for calendar dots / multi-date view)
app.get('/api/meals', async (req, res) => {
  try {
    const meals = await Meal.find();
    const result = {};
    meals.forEach(m => {
      if (!result[m.date]) result[m.date] = {};
      result[m.date][m.slot] = { text: m.text, macros: m.macros, items: m.items };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// ═══ WORKOUT LOGS ═══

// Get workout done states for a date
app.get('/api/workouts/:date', async (req, res) => {
  try {
    const log = await WorkoutLog.findOne({ date: req.params.date });
    res.json(log ? Object.fromEntries(log.done) : {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout log' });
  }
});

// Save workout done states for a date
app.put('/api/workouts/:date', async (req, res) => {
  try {
    const { done } = req.body;
    await WorkoutLog.findOneAndUpdate(
      { date: req.params.date },
      { done },
      { upsert: true, new: true }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save workout log' });
  }
});

// Get all workout logs
app.get('/api/workouts', async (req, res) => {
  try {
    const logs = await WorkoutLog.find();
    const result = {};
    logs.forEach(l => { result[l.date] = Object.fromEntries(l.done); });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch workout logs' });
  }
});

app.post('/api/chat', async (req, res) => {
  try {
    const { systemInstruction, prompt } = req.body;
    
    const requestBody = {
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        maxOutputTokens: 8192,
        responseMimeType: "application/json"
      }
    };

    if (systemInstruction) {
      requestBody.systemInstruction = { parts: [{ text: systemInstruction }] };
    }

    // Fallback list of models to try in case of 503 (High Demand) or 404 (Not Found)
    const modelsToTry = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-2.5-pro",
    ];

    let lastErrorData = null;
    let lastStatus = 500;

    for (const model of modelsToTry) {
      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

      try {
        const response = await fetch(GEMINI_API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        const data = await response.json();
        
        // If successful, return the data immediately
        if (response.ok) {
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          return res.json({ text, usedModel: model });
        }
        
        // Save the error to return if all models fail
        lastErrorData = data;
        lastStatus = response.status;
        console.warn(`[API] Model ${model} failed (${lastStatus}):`, data?.error?.message);

        // Don't retry if the error is due to an invalid API key
        if (lastStatus === 400 && data?.error?.details?.[0]?.reason === "API_KEY_INVALID") {
          break;
        }
        // Otherwise, it's 503 or 404, loop continues to the next model
      } catch (fetchErr) {
        console.warn(`[API] Fetch error for model ${model}:`, fetchErr.message);
      }
    }

    // If all models failed, send the last error encountered
    return res.status(lastStatus).json(lastErrorData || { error: "All fallback models failed." });

  } catch (error) {
    console.error("API proxy error:", error);
    res.status(500).json({ error: "Internal server error connecting to Gemini API" });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
