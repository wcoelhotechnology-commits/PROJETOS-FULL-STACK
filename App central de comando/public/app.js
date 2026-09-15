// Esta interface foi pensada para parecer cuidada e humana.
// O objetivo é manter um visual profissional, mas sem perder a sensação de ferramenta pessoal.

const STORAGE_KEY = 'central-comando-data';
const KANBAN_COLUMNS = ['ideia', 'andamento', 'travado', 'pronto'];

let data = { rooms: [] };
let state = { roomId: null, subroomId: null };
let dragState = { boardId: null };

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function statusLabel(s) {
  return {
    ideia: 'Ideia',
    andamento: 'Em andamento',
    travado: 'Travado',
    pronto: 'Pronto'
  }[s] || s;
}

function normalizeBoard(board, fallbackStatus = 'ideia') {
  const status = KANBAN_COLUMNS.includes(board?.status) ? board.status : fallbackStatus;
  return {
    id: board?.id || uid('board'),
    title: String(board?.title || 'Novo quadro').trim() || 'Novo quadro',
    status,
    progress: clamp(Number(board?.progress) || 0, 0, 100),
    next: String(board?.next || '').trim(),
    notes: String(board?.notes || '').trim()
  };
}

function normalizeSubroom(subroom) {
  return {
    id: subroom?.id || uid('sub'),
    name: String(subroom?.name || 'Nova sub-sala').trim() || 'Nova sub-sala',
    boards: Array.isArray(subroom?.boards) ? subroom.boards.map((board) => normalizeBoard(board, 'ideia')) : []
  };
}

function normalizeRoom(room) {
  return {
    id: room?.id || uid('room'),
    name: String(room?.name || 'Nova sala').trim() || 'Nova sala',
    icon: String(room?.icon || '📁').trim() || '📁',
    subrooms: Array.isArray(room?.subrooms) ? room.subrooms.map(normalizeSubroom) : []
  };
}

function normalizeData(payload) {
  const safe = payload && typeof payload === 'object' && Array.isArray(payload.rooms) ? payload : { rooms: [] };
  return {
    rooms: safe.rooms.map(normalizeRoom)
  };
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Erro de requisição');
  }

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return response.json();
  }

  return null;
}

async function loadData() {
  try {
    const response = await apiFetch('/api/data');
    data = normalizeData(response || { rooms: [] });
  } catch (error) {
    console.warn('Falha ao carregar do backend, usando fallback local:', error);
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        data = normalizeData(JSON.parse(local));
      } catch (errorLocal) {
        data = { rooms: [] };
      }
    } else {
      data = { rooms: [] };
    }
  }

  if (!data.rooms.length) {
    const fallback = {
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
                  id: 'board-demo',
                  title: 'Exemplo de quadro',
                  status: 'andamento',
                  progress: 42,
                  next: 'Definir a próxima ação do projeto.',
                  notes: 'Base de exemplo para testar o fluxo do painel.'
                }
              ]
            }
          ]
        }
      ]
    };

    data = fallback;
  }

  state.roomId = data.rooms[0]?.id || null;
  state.subroomId = data.rooms[0]?.subrooms[0]?.id || null;
  saveData();
  render();
}

async function saveData() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    try {
      await apiFetch('/api/data', { method: 'PUT', body: JSON.stringify(data) });
    } catch (backendError) {
      console.warn('Backend indisponível; dados continuam em localStorage:', backendError);
    }
  } catch (error) {
    console.warn('Não foi possível salvar localmente:', error);
  }
}

function getRoom(id) {
  return data.rooms.find((room) => room.id === id);
}

function getSubroom(room, id) {
  return room?.subrooms.find((subroom) => subroom.id === id);
}

function render() {
  renderSidebar();
  renderTop();
}

function renderSidebar() {
  const el = document.getElementById('roomsList');
  el.innerHTML = '';

  data.rooms.forEach((room) => {
    const roomBtn = document.createElement('button');
    roomBtn.className = `room-btn ${room.id === state.roomId ? 'active' : ''}`;
    roomBtn.innerHTML = `<span class="room-icon">${room.icon || '📁'}</span><span>${room.name}</span>`;
    roomBtn.onclick = () => {
      state.roomId = room.id;
      state.subroomId = room.subrooms[0]?.id || null;
      render();
    };
    el.appendChild(roomBtn);
  });
}

function renderTop() {
  const room = getRoom(state.roomId);
  const crumbs = document.getElementById('crumbs');
  crumbs.innerHTML = '';

  if (room) {
    const roomCrumb = document.createElement('div');
    roomCrumb.className = 'crumb current';
    roomCrumb.textContent = `${room.icon} ${room.name}`;
    crumbs.appendChild(roomCrumb);

    const editCrumb = document.createElement('div');
    editCrumb.className = 'crumb';
    editCrumb.textContent = '✎ editar sala';
    editCrumb.onclick = () => openRoomModal(room);
    crumbs.appendChild(editCrumb);
  }

  renderSubrooms(room);
}

function renderSubrooms(room) {
  const row = document.getElementById('subroomsRow');
  row.innerHTML = '';

  if (!room) {
    renderBoards(null);
    return;
  }

  room.subrooms.forEach((subroom) => {
    const tab = document.createElement('div');
    tab.className = `subroom-tab ${subroom.id === state.subroomId ? 'active' : ''}`;
    tab.textContent = subroom.name;
    tab.onclick = () => {
      state.subroomId = subroom.id;
      render();
    };
    row.appendChild(tab);
  });

  const addTab = document.createElement('div');
  addTab.className = 'add-sub-tab';
  addTab.textContent = '+ sub-sala';
  addTab.onclick = () => openSubroomModal(room);
  row.appendChild(addTab);

  renderBoards(room);
}

function renderBoards(room) {
  const area = document.getElementById('boardArea');
  area.innerHTML = '';

  if (!room) {
    area.innerHTML = '<div class="empty-state">Crie sua primeira sala para começar.</div>';
    return;
  }

  const subroom = getSubroom(room, state.subroomId);
  if (!subroom) {
    area.innerHTML = '<div class="empty-state">Crie uma sub-sala para organizar seus quadros aqui.</div>';
    return;
  }

  const kanban = document.createElement('div');
  kanban.className = 'kanban';

  KANBAN_COLUMNS.forEach((statusKey) => {
    const boardsInColumn = subroom.boards.filter((board) => board.status === statusKey);

    const column = document.createElement('div');
    column.className = 'kanban-col';
    column.dataset.status = statusKey;

    const head = document.createElement('div');
    head.className = 'kanban-col-head';
    head.innerHTML = `
      <span class="kanban-col-title">${statusLabel(statusKey)}</span>
      <span class="kanban-col-count">${boardsInColumn.length}</span>
    `;
    column.appendChild(head);

    const cardsWrap = document.createElement('div');
    cardsWrap.className = 'kanban-cards';

    if (!boardsInColumn.length) {
      const empty = document.createElement('div');
      empty.className = 'kanban-empty';
      empty.textContent = 'Solte um quadro aqui';
      cardsWrap.appendChild(empty);
    }

    boardsInColumn.forEach((board) => {
      const card = document.createElement('div');
      card.className = 'kanban-card';
      card.dataset.boardId = board.id;
      card.draggable = true;
      card.innerHTML = `
        <div class="kanban-card-title">${escapeHtml(board.title)}</div>
        <div>
          <div class="progress-track"><div class="progress-fill" style="width:${board.progress}%"></div></div>
          <div class="progress-label">${board.progress}% construído</div>
        </div>
        ${board.next ? `<div class="next-step"><b>Próximo passo:</b> ${escapeHtml(board.next)}</div>` : ''}
      `;

      card.addEventListener('dragstart', (event) => {
        dragState.boardId = board.id;
        card.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        dragState.boardId = null;
      });

      card.addEventListener('click', () => {
        if (card.classList.contains('dragging')) return;
        openBoardModal(room, subroom, board);
      });

      cardsWrap.appendChild(card);
    });

    column.appendChild(cardsWrap);

    const addInline = document.createElement('div');
    addInline.className = 'add-board-inline';
    addInline.textContent = '+ quadro';
    addInline.onclick = () => openBoardModal(room, subroom, null, statusKey);
    column.appendChild(addInline);

    column.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      column.classList.add('drag-over');
    });

    column.addEventListener('dragleave', () => column.classList.remove('drag-over'));

    column.addEventListener('drop', async (event) => {
      event.preventDefault();
      column.classList.remove('drag-over');

      const boardId = dragState.boardId;
      if (!boardId) return;

      const board = subroom.boards.find((item) => item.id === boardId);
      if (board && board.status !== statusKey) {
        board.status = statusKey;
        await saveData();
        render();
      }
    });

    kanban.appendChild(column);
  });

  area.appendChild(kanban);
}

function openOverlay() {
  document.getElementById('overlay').classList.add('show');
}

function closeOverlay() {
  document.getElementById('overlay').classList.remove('show');
}

document.getElementById('overlay').addEventListener('click', (event) => {
  if (event.target.id === 'overlay') closeOverlay();
});

function openRoomModal(room) {
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <h3>${room ? 'Editar sala' : 'Nova sala'}</h3>
    <div class="field">
      <label>Ícone (um emoji)</label>
      <input type="text" id="roomIcon" maxlength="2" value="${escapeHtml(room ? room.icon : '📁')}">
    </div>
    <div class="field">
      <label>Nome da sala</label>
      <input type="text" id="roomName" value="${escapeHtml(room ? room.name : '')}" placeholder="ex: Financeiro">
    </div>
    <div class="modal-actions">
      <div>${room ? '<button class="btn btn-danger" id="delRoom">Excluir sala</button>' : ''}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button class="btn btn-primary" id="saveRoom">Salvar</button>
      </div>
    </div>
  `;

  openOverlay();
  document.getElementById('cancelBtn').onclick = closeOverlay;
  document.getElementById('saveRoom').onclick = async () => {
    const name = document.getElementById('roomName').value.trim();
    const icon = document.getElementById('roomIcon').value.trim() || '📁';
    if (!name) return;

    if (room) {
      room.name = name;
      room.icon = icon;
    } else {
      const newRoom = { id: uid('room'), name, icon, subrooms: [] };
      data.rooms.push(newRoom);
      state.roomId = newRoom.id;
      state.subroomId = null;
    }

    await saveData();
    closeOverlay();
    render();
  };

  if (room) {
    document.getElementById('delRoom').onclick = async () => {
      if (!confirm('Excluir esta sala e tudo dentro dela?')) return;
      data.rooms = data.rooms.filter((item) => item.id !== room.id);
      state.roomId = data.rooms[0]?.id || null;
      state.subroomId = data.rooms[0]?.subrooms[0]?.id || null;
      await saveData();
      closeOverlay();
      render();
    };
  }
}

function openSubroomModal(room, subroom) {
  const modal = document.getElementById('modalContent');
  modal.innerHTML = `
    <h3>${subroom ? 'Editar sub-sala' : 'Nova sub-sala'}</h3>
    <div class="field">
      <label>Nome da sub-sala</label>
      <input type="text" id="subName" value="${escapeHtml(subroom ? subroom.name : '')}" placeholder="ex: Estudos">
    </div>
    <div class="modal-actions">
      <div>${subroom ? '<button class="btn btn-danger" id="delSub">Excluir</button>' : ''}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button class="btn btn-primary" id="saveSub">Salvar</button>
      </div>
    </div>
  `;

  openOverlay();
  document.getElementById('cancelBtn').onclick = closeOverlay;
  document.getElementById('saveSub').onclick = async () => {
    const name = document.getElementById('subName').value.trim();
    if (!name) return;

    if (subroom) {
      subroom.name = name;
    } else {
      const newSubroom = { id: uid('sub'), name, boards: [] };
      room.subrooms.push(newSubroom);
      state.subroomId = newSubroom.id;
    }

    await saveData();
    closeOverlay();
    render();
  };

  if (subroom) {
    document.getElementById('delSub').onclick = async () => {
      if (!confirm('Excluir esta sub-sala e seus quadros?')) return;
      room.subrooms = room.subrooms.filter((item) => item.id !== subroom.id);
      state.subroomId = room.subrooms[0]?.id || null;
      await saveData();
      closeOverlay();
      render();
    };
  }
}

function openBoardModal(room, subroom, board, defaultStatus) {
  const modal = document.getElementById('modalContent');
  const initialStatus = board ? board.status : (defaultStatus || 'ideia');

  modal.innerHTML = `
    <h3>${board ? 'Editar quadro' : 'Novo quadro'}</h3>
    <div class="field">
      <label>Título do projeto</label>
      <input type="text" id="bTitle" value="${escapeHtml(board ? board.title : '')}" placeholder="Nome do projeto">
    </div>
    <div class="field">
      <label>Status</label>
      <select id="bStatus">
        ${['ideia', 'andamento', 'travado', 'pronto'].map((status) => `
          <option value="${status}" ${initialStatus === status ? 'selected' : ''}>${statusLabel(status)}</option>
        `).join('')}
      </select>
    </div>
    <div class="field">
      <label>Progresso</label>
      <div class="range-row">
        <input type="range" id="bProgress" min="0" max="100" value="${board ? board.progress : 0}">
        <div class="range-val" id="progressVal">${board ? board.progress : 0}%</div>
      </div>
    </div>
    <div class="field">
      <label>Próximo passo</label>
      <textarea id="bNext" placeholder="O que fazer na próxima vez que abrir isso">${escapeHtml(board ? board.next : '')}</textarea>
    </div>
    <div class="field">
      <label>Anotações livres</label>
      <textarea id="bNotes" placeholder="Ideias soltas, contexto, o que for">${escapeHtml(board ? board.notes : '')}</textarea>
    </div>
    <div class="modal-actions">
      <div>${board ? '<button class="btn btn-danger" id="delBoard">Excluir</button>' : ''}</div>
      <div style="display:flex; gap:8px;">
        <button class="btn btn-ghost" id="cancelBtn">Cancelar</button>
        <button class="btn btn-primary" id="saveBoard">Salvar</button>
      </div>
    </div>
  `;

  openOverlay();

  const progressInput = document.getElementById('bProgress');
  const progressVal = document.getElementById('progressVal');

  progressInput.oninput = (event) => {
    progressVal.textContent = `${event.target.value}%`;
  };

  document.getElementById('cancelBtn').onclick = closeOverlay;

  document.getElementById('saveBoard').onclick = async () => {
    const title = document.getElementById('bTitle').value.trim();
    if (!title) return;

    const payload = {
      title,
      status: document.getElementById('bStatus').value,
      progress: clamp(parseInt(document.getElementById('bProgress').value, 10) || 0, 0, 100),
      next: document.getElementById('bNext').value.trim(),
      notes: document.getElementById('bNotes').value.trim()
    };

    if (board) {
      Object.assign(board, payload);
    } else {
      subroom.boards.push({ id: uid('board'), ...payload });
    }

    await saveData();
    closeOverlay();
    render();
  };

  if (board) {
    document.getElementById('delBoard').onclick = async () => {
      if (!confirm('Excluir este quadro?')) return;
      subroom.boards = subroom.boards.filter((item) => item.id !== board.id);
      await saveData();
      closeOverlay();
      render();
    };
  }
}

async function exportData() {
  const payload = JSON.stringify(data, null, 2);

  try {
    const response = await fetch('/api/export');
    if (!response.ok) throw new Error('Falha na exportação');

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'central-de-comando-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
    return;
  } catch (error) {
    console.warn('Backend de exportação indisponível; usando fallback local:', error);
  }

  try {
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'central-de-comando-export.json';
    anchor.click();
    URL.revokeObjectURL(url);
  } catch (downloadError) {
    console.error('Erro ao exportar:', downloadError);
    alert('Não foi possível exportar os dados agora.');
  }
}

async function importData(file) {
  if (!file) return;

  const text = await file.text();

  try {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.rooms)) {
      throw new Error('Formato inválido');
    }

    const normalized = normalizeData(parsed);
    data = normalized;
    state.roomId = data.rooms[0]?.id || null;
    state.subroomId = data.rooms[0]?.subrooms[0]?.id || null;

    await saveData();
    render();
  } catch (error) {
    alert('Arquivo JSON inválido. Verifique o conteúdo antes de importar.');
    console.error('Erro ao importar:', error);
  }
}

document.getElementById('addRoomBtn').onclick = () => openRoomModal();
document.getElementById('exportBtn').onclick = exportData;
document.getElementById('importBtn').onclick = () => document.getElementById('importInput').click();
document.getElementById('importInput').addEventListener('change', (event) => {
  const file = event.target.files?.[0];
  importData(file);
  event.target.value = '';
});

loadData();
