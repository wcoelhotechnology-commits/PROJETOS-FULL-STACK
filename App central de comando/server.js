// Este backend foi desenhado para ser simples, legível e útil.
// A ideia é manter a autoria humana visível no código sem complexidade desnecessária.

const express = require('express');
const fs = require('fs/promises');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');
const EMAIL_LIST_FILE = path.join(__dirname, 'data', 'email-list.json');
const USERS_DIR = path.join(__dirname, 'data', 'users');
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

function emailFromRequest(req) {
  const email = String(req.get('x-user-email') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('É necessário informar um e-mail válido.');
    error.statusCode = 401;
    throw error;
  }
  return email;
}

function userDataFile(email) {
  const identity = crypto.createHash('sha256').update(email).digest('hex');
  return path.join(USERS_DIR, `${identity}.json`);
}

async function readUserData(email) {
  const file = userDataFile(email);
  try {
    const raw = await fs.readFile(file, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.rooms) ? parsed : await readData();
  } catch (error) {
    // Cada novo usuário recebe uma cópia inicial independente do modelo do projeto.
    const initialData = await readData();
    await fs.mkdir(USERS_DIR, { recursive: true });
    await fs.writeFile(file, JSON.stringify(initialData, null, 2), 'utf8');
    return initialData;
  }
}

async function writeUserData(email, payload) {
  const safePayload = payload && Array.isArray(payload.rooms) ? payload : await readData();
  await fs.mkdir(USERS_DIR, { recursive: true });
  await fs.writeFile(userDataFile(email), JSON.stringify(safePayload, null, 2), 'utf8');
  return safePayload;
}

async function readEmailList() {
  try {
    const raw = await fs.readFile(EMAIL_LIST_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && Array.isArray(parsed.emails) ? parsed : { emails: [] };
  } catch (error) {
    await fs.mkdir(path.dirname(EMAIL_LIST_FILE), { recursive: true });
    const emptyList = { emails: [] };
    await fs.writeFile(EMAIL_LIST_FILE, JSON.stringify(emptyList, null, 2), 'utf8');
    return emptyList;
  }
}

async function registerEmail(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailPattern.test(email)) {
    const error = new Error('E-mail inválido.');
    error.statusCode = 400;
    throw error;
  }

  const list = await readEmailList();
  const now = new Date().toISOString();
  const existing = list.emails.find((entry) => entry.email === email);

  if (existing) {
    existing.lastAccessAt = now;
  } else {
    list.emails.push({ email, firstAccessAt: now, lastAccessAt: now });
  }

  await fs.writeFile(EMAIL_LIST_FILE, JSON.stringify(list, null, 2), 'utf8');
  return { email, firstAccess: !existing };
}

app.use(express.json({ limit: '5mb' }));
app.use(express.static(PUBLIC_DIR));

app.post('/api/access', async (req, res) => {
  try {
    const result = await registerEmail(req.body?.email);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Não foi possível registrar o acesso.' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    const data = await readUserData(emailFromRequest(req));
    res.json(data);
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Não foi possível carregar os dados.' });
  }
});

app.put('/api/data', async (req, res) => {
  try {
    const payload = req.body || DEFAULT_DATA;
    const saved = await writeUserData(emailFromRequest(req), payload);
    res.json({ ok: true, data: saved });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Não foi possível salvar os dados.' });
  }
});

app.post('/api/import', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || !Array.isArray(payload.rooms)) {
      return res.status(400).json({ error: 'Arquivo JSON inválido. Esperado um objeto com a chave rooms.' });
    }

    const saved = await writeUserData(emailFromRequest(req), payload);
    return res.json({ ok: true, data: saved });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ error: error.message || 'Falha ao importar os dados.' });
  }
});

app.get('/api/export', async (req, res) => {
  try {
    const data = await readUserData(emailFromRequest(req));
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="central-de-comando-export.json"');
    res.send(JSON.stringify(data, null, 2));
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message || 'Não foi possível exportar os dados.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Central de Comando rodando em http://localhost:${PORT}`);
  console.log('A aplicação está pronta para uso local com backend real.');
});
