(function () {
    const supabaseUtils = globalThis.IdeaCanvasSupabase;
    const boardsApi = globalThis.IdeaCanvasBoards;

    let supabaseClient = null;
    let boards = [];

    const elements = {
        list: document.getElementById('boards-list'),
        status: document.getElementById('boards-status'),
        detail: document.getElementById('boards-connection-detail'),
        createButton: document.getElementById('create-board-btn'),
    };

    function setStatus(message) {
        if (elements.status) elements.status.textContent = message || '';
    }

    function setConnected(connected, message) {
        if (elements.detail) elements.detail.textContent = message;
        if (elements.createButton) elements.createButton.disabled = !connected;
    }

    function renderBoards() {
        if (!elements.list) return;

        if (!boards.length) {
            elements.list.innerHTML = '<div class="rounded-xl bg-surface-container-lowest border border-outline-variant/50 p-6 text-sm text-on-surface-variant">아직 보드가 없습니다. 새 보드를 만들어 시작하세요.</div>';
            return;
        }

        elements.list.innerHTML = '';
        boards.forEach((board) => {
            const card = document.createElement('article');
            card.className = 'rounded-xl bg-surface-container-lowest border border-outline-variant/50 p-5 flex flex-col gap-4';
            card.innerHTML = `
                <div>
                    <input data-board-id="${escapeHtml(board.id)}" class="board-title-input w-full text-lg font-bold bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary focus:ring-0 outline-none px-0 py-1" value="${escapeHtml(board.title)}"/>
                    <p class="text-xs text-on-surface-variant mt-2">보드 ID: ${escapeHtml(board.id)}</p>
                </div>
                <div class="flex flex-wrap gap-2 mt-auto">
                    <a href="board.html?board_id=${encodeURIComponent(board.id)}" class="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90">열기</a>
                    <a href="board-admin.html?board_id=${encodeURIComponent(board.id)}" class="px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold hover:bg-surface-container-high">관리</a>
                    <button type="button" data-action="rename-board" data-board-id="${escapeHtml(board.id)}" class="px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold hover:bg-surface-container-high">이름 저장</button>
                    <button type="button" data-action="delete-board" data-board-id="${escapeHtml(board.id)}" class="px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold text-error hover:bg-red-50">삭제</button>
                </div>
            `;
            elements.list.appendChild(card);
        });
    }

    async function loadBoards() {
        if (!supabaseClient) {
            boards = [];
            renderBoards();
            setConnected(false, 'supabase_config.js의 Supabase URL/key를 설정하면 보드를 서버에 저장할 수 있습니다.');
            return;
        }

        boards = await boardsApi.loadBoardsFromServer(supabaseClient);
        renderBoards();
        setConnected(true, 'Supabase에 연결되었습니다. 보드는 서버에 저장됩니다.');
        setStatus('');
    }

    async function createBoard() {
        if (!supabaseClient) return;
        setStatus('보드 생성 중...');
        try {
            const created = await boardsApi.createBoardInServer(supabaseClient, boardsApi.DEFAULT_BOARD_TITLE);
            boards.push(created);
            renderBoards();
            setStatus('보드가 생성되었습니다.');
        } catch (error) {
            console.error('Create board failed:', error);
            setStatus('보드 생성에 실패했습니다.');
        }
    }

    async function renameBoard(boardId) {
        const board = boards.find(item => item.id === boardId);
        const input = elements.list.querySelector(`input[data-board-id="${cssEscape(boardId)}"]`);
        const nextTitle = input ? input.value.trim() : '';
        if (!board || !nextTitle || nextTitle === board.title) return;

        setStatus('보드 이름 저장 중...');
        try {
            await boardsApi.renameBoardInServer(supabaseClient, boardId, nextTitle);
            board.title = nextTitle;
            renderBoards();
            setStatus('보드 이름이 저장되었습니다.');
        } catch (error) {
            console.error('Rename board failed:', error);
            renderBoards();
            setStatus('보드 이름 저장에 실패했습니다.');
        }
    }

    async function deleteBoard(boardId) {
        const board = boards.find(item => item.id === boardId);
        if (!board) return;
        if (!confirm(`'${board.title}' 보드를 삭제할까요? 보드 안의 메모와 섹션도 삭제됩니다.`)) return;

        setStatus('보드 삭제 중...');
        try {
            await boardsApi.deleteBoardInServer(supabaseClient, boardId);
            boards = boards.filter(item => item.id !== boardId);
            renderBoards();
            setStatus('보드가 삭제되었습니다.');
        } catch (error) {
            console.error('Delete board failed:', error);
            setStatus('보드 삭제에 실패했습니다.');
        }
    }

    function handleListClick(event) {
        const button = event.target.closest('button[data-action]');
        if (!button) return;
        const boardId = button.getAttribute('data-board-id');
        if (button.getAttribute('data-action') === 'rename-board') {
            renameBoard(boardId);
        } else if (button.getAttribute('data-action') === 'delete-board') {
            deleteBoard(boardId);
        }
    }

    function init() {
        const connection = supabaseUtils.createSupabaseClient(
            typeof CONFIG !== 'undefined' ? CONFIG : null,
            typeof supabase !== 'undefined' ? supabase : null
        );
        supabaseClient = connection.client;

        if (elements.createButton) elements.createButton.addEventListener('click', createBoard);
        if (elements.list) elements.list.addEventListener('click', handleListClick);

        loadBoards().catch((error) => {
            console.error('Load boards failed:', error);
            boards = [];
            renderBoards();
            setConnected(false, '보드 목록을 불러오지 못했습니다. Supabase 스키마와 연결 설정을 확인해 주세요.');
        });
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return String(unsafe)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function cssEscape(value) {
        if (globalThis.CSS && typeof globalThis.CSS.escape === 'function') {
            return globalThis.CSS.escape(value);
        }
        return String(value).replace(/"/g, '\\"');
    }

    document.addEventListener('DOMContentLoaded', init);
})();
