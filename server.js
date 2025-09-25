// server.js
import express from 'express';
import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';
import { fileURLToPath } from 'url';

// Fix för __dirname i ES-moduler
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Servera frontend-filer från projektets rot
app.use(express.static(path.join(__dirname)));

// Sökväg till org.json
const orgFilePath = path.join(__dirname, 'data', 'org.json');

// GET: hämta orgstruktur
app.get('/api/org', (req, res) => {
  fs.readFile(orgFilePath, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'Kunde inte läsa org.json' });
    try {
      const orgData = JSON.parse(data);
      res.json(orgData);
    } catch (e) {
      res.status(500).json({ error: 'Felaktigt JSON-format' });
    }
  });
});

// POST: uppdatera orgstruktur
app.post('/api/org', (req, res) => {
  const newData = req.body;
  if (!newData) return res.status(400).json({ error: 'Ingen data skickad' });

  fs.writeFile(orgFilePath, JSON.stringify(newData, null, 2), 'utf8', (err) => {
    if (err) return res.status(500).json({ error: 'Kunde inte skriva till org.json' });
    res.json({ success: true });
  });
});

// Starta server
app.listen(PORT, () => {
  console.log(`Server körs på http://localhost:${PORT}`);
});
