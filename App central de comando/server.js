// Este backend foi desenhado para ser simples, legível e útil.
// A ideia é manter a autoria humana visível no código sem complexidade desnecessária.

const express = require('express');
const fs = require('fs/promises');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

const DEFAULT_DATA = {
  rooms: [
    {
      id: 'academico',
      name: 'Acadêmico',
      icon: '🎓',
      subrooms: [
        {
          id: 'relacional',
          name: 'Relacional',
          boards: [
            {
              id: 'phi',
              title: 'Φ / DOR — Densidade de Organização Relacional',
              status: 'andamento',
              progress: 55,
              next: 'Revisão bibliográfica do Artigo 1, situando Φ frente às métricas espaciais e geométricas já existentes.',
              notes: 'Projeto central do autor. Repositório e planejamento continuando em paralelo.'
            }
          ]
        }
      ]
    },
    {
      id: 'profissional',
      name: 'Profissional',
      icon: '💼',
      subrooms: [
        {
          id: 'desenvolvimento',
          name: 'Desenvolvimento',
          boards: [
            {
              id: 'wayn-app',
              title: 'Wayne Industries — sistema/código',
              status: 'pronto',
              progress: 90,
              next: 'Adaptar o projeto para uso comercial com revisão final.',
              notes: 'Base em Flask + SQLAlchemy + SQLite, com front em HTML/CSS/JS.'
            }
          ]
        }
      ]
    }
  ]
};

async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch (error) {
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_DATA, null, 2), 'utf8');
  }
}

async function readData() {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, 'utf8');

  try {
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.rooms) ? parsed : DEFAULT_DATA;
  } catch (error) {
    return DEFAULT_DATA;
  }
}

async function writeData(payload) {
  const safePayload = payload && Array.isArray(payload.rooms) ? payload : DEFAULT_DATA;
  await fs.writeFile(DATA_FILE, JSON.stringify(safePayload, null, 2), 'utf8');
  return safePayload;
}

app.use(express.json({ limit: '5mb' }));
app.use(express.static(PUBLIC_DIR));

app.get('/api/data', async (req, res) => {
  try {
    const data = await readData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível carregar os dados.' });
  }
});

app.put('/api/data', async (req, res) => {
  try {
    const payload = req.body || DEFAULT_DATA;
    const saved = await writeData(payload);
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível salvar os dados.' });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.rooms)) {
      return res.status(400).json({ error: 'Arquivo JSON inválido. Esperado um objeto com a chave rooms.' });
    }

    const saved = await writeData(payload);
    return res.json({ ok: true, data: saved });
  } catch (error) {
    return res.status(500).json({ error: 'Falha ao importar os dados.' });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    const data = await readData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="central-de-comando-export.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.status(500).json({ error: 'Não foi possível exportar os dados.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Central de Comando rodando em http://localhost:${PORT}`);
  console.log('A aplicação está pronta para uso local com backend real.');
});
