(function () {
    const supabaseUtils = globalThis.IdeaCanvasSupabase;
    const boardsApi = globalThis.IdeaCanvasBoards;
    const authUtils = globalThis.IdeaCanvasAuth;

    let supabaseClient = null;
    let boards = [];
    let profiles = [];
    let searchQuery = '';
    let isConnected = false;
    let currentUser = null;
    let currentProfile = null;
    let authPanelMode = 'closed';

    const elements = {
        list: document.getElementById('boards-list'),
        status: document.getElementById('boards-status'),
        landingPreview: document.getElementById('landing-preview'),
        workspace: document.getElementById('dashboard-workspace'),
        createButton: document.getElementById('create-board-btn'),
        searchInput: document.getElementById('board-search-input'),
        authActions: document.getElementById('dashboard-auth-actions'),
        authCard: document.getElementById('dashboard-auth-card'),
        openLoginButton: document.getElementById('dashboard-open-login-btn'),
        openSignupButton: document.getElementById('dashboard-open-signup-btn'),
        authLoggedOut: document.getElementById('dashboard-auth-logged-out'),
        authSignup: document.getElementById('dashboard-auth-signup'),
        authLoggedIn: document.getElementById('dashboard-auth-logged-in'),
        emailInput: document.getElementById('dashboard-auth-email'),
        passwordInput: document.getElementById('dashboard-auth-password'),
        nameInput: document.getElementById('dashboard-auth-name'),
        signupEmailInput: document.getElementById('dashboard-signup-email'),
        signupPasswordInput: document.getElementById('dashboard-signup-password'),
        loginButton: document.getElementById('dashboard-login-btn'),
        signupButton: document.getElementById('dashboard-signup-btn'),
        closeAuthButton: document.getElementById('dashboard-close-auth-btn'),
        showSignupButton: document.getElementById('dashboard-show-signup-btn'),
        showLoginButton: document.getElementById('dashboard-show-login-btn'),
        resetPasswordButton: document.getElementById('dashboard-reset-password-btn'),
        logoutButton: document.getElementById('dashboard-logout-btn'),
        userDisplay: document.getElementById('dashboard-user-display'),
        boardsTabButton: document.getElementById('boards-tab-btn'),
        accountsTabButton: document.getElementById('accounts-tab-btn'),
        boardsPanel: document.getElementById('boards-panel'),
        accountsPanel: document.getElementById('accounts-panel'),
        pendingTeachersList: document.getElementById('pending-teachers-list'),
        approvedTeachersList: document.getElementById('approved-teachers-list'),
    };

    function setStatus(message) {
        if (elements.status) elements.status.textContent = message || '';
    }

    function setConnected(connected) {
        isConnected = connected;
        updateCreateButtonState();
    }

    function canUseDashboard() {
        return authUtils.canUseDashboard(currentProfile);
    }

    function updateCreateButtonState() {
        if (!elements.createButton) return;
        const canCreate = isConnected && authUtils.canCreateBoard(currentProfile);
        elements.createButton.disabled = !canCreate;
        elements.createButton.title = canCreate ? '' : '승인된 교사 또는 마스터만 새 보드를 만들 수 있습니다.';
    }

    function getRoleLabel() {
        if (!currentProfile) return '승인 대기';
        if (currentProfile.is_master) return currentProfile.is_primary_master ? '최초 마스터' : '마스터';
        return currentProfile.role === 'teacher' ? '교사' : '승인 대기';
    }

    function showAuthPanel(mode) {
        authPanelMode = authUtils.resolveAuthPanelMode(mode, currentUser);
        renderAuthState();
    }

    function renderEmptyState(message) {
        if (!elements.list) return;
        elements.list.innerHTML = `
            <div class="md:col-span-2 xl:col-span-3 rounded-lg border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center">
                <span class="material-symbols-outlined text-4xl text-primary">dashboard_customize</span>
                <p class="mt-3 text-base font-bold text-on-surface">${escapeHtml(message)}</p>
            </div>
        `;
    }

    function renderBoards() {
        if (!elements.list || !canUseDashboard()) return;

        const visibleBoards = boardsApi.filterBoardsByQuery(boards, searchQuery);

        if (!visibleBoards.length) {
            renderEmptyState(boards.length ? '검색 결과가 없습니다.' : '아직 보드가 없습니다.');
            return;
        }

        elements.list.innerHTML = '';
        visibleBoards.forEach((board) => {
            const card = document.createElement('article');
            card.className = 'group overflow-hidden rounded-lg bg-surface-container-lowest border border-outline-variant/60 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md';
            card.innerHTML = `
                <div class="h-1 bg-primary"></div>
                <div class="p-5 flex min-h-48 flex-col gap-5">
                    <div>
                        <input data-board-id="${escapeHtml(board.id)}" class="board-title-input w-full text-xl font-extrabold bg-transparent border-b border-transparent hover:border-outline-variant focus:border-primary focus:ring-0 outline-none px-0 py-1" value="${escapeHtml(board.title)}" aria-label="보드 이름"/>
                        <p class="text-xs text-on-surface-variant mt-2">보드 ID: ${escapeHtml(board.id)}</p>
                    </div>
                    <div class="mt-auto flex flex-wrap gap-2">
                        <a href="board.html?board_id=${encodeURIComponent(board.id)}" class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90">
                            <span class="material-symbols-outlined text-base">open_in_new</span>
                            열기
                        </a>
                        <a href="board-admin.html?board_id=${encodeURIComponent(board.id)}" class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold hover:bg-surface-container-high">
                            <span class="material-symbols-outlined text-base">settings</span>
                            관리
                        </a>
                        <button type="button" data-action="rename-board" data-board-id="${escapeHtml(board.id)}" class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold hover:bg-surface-container-high">
                            <span class="material-symbols-outlined text-base">edit</span>
                            이름 저장
                        </button>
                        <button type="button" data-action="delete-board" data-board-id="${escapeHtml(board.id)}" class="inline-flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-outline-variant/70 text-xs font-bold text-error hover:bg-red-50">
                            <span class="material-symbols-outlined text-base">delete</span>
                            삭제
                        </button>
                    </div>
                </div>
            `;
            elements.list.appendChild(card);
        });
    }

    function renderAuthState() {
        const displayName = authUtils.getDisplayName(currentProfile, currentUser);
        const dashboardAllowed = canUseDashboard();
        const panelMode = authUtils.resolveAuthPanelMode(authPanelMode, currentUser);
        authPanelMode = panelMode === 'logged_in' ? 'closed' : panelMode;

        elements.landingPreview?.classList.toggle('hidden', dashboardAllowed);
        elements.workspace?.classList.toggle('hidden', !dashboardAllowed);
        elements.authActions?.classList.toggle('hidden', panelMode === 'logged_in');
        elements.authLoggedIn?.classList.toggle('hidden', panelMode !== 'logged_in');
        elements.authLoggedIn?.classList.toggle('flex', panelMode === 'logged_in');
        elements.authCard?.classList.toggle('hidden', panelMode !== 'login' && panelMode !== 'signup');
        elements.authLoggedOut?.classList.toggle('hidden', panelMode !== 'login');
        elements.authSignup?.classList.toggle('hidden', panelMode !== 'signup');

        if (currentUser && elements.userDisplay) {
            elements.userDisplay.textContent = `${displayName || currentUser.email} (${getRoleLabel()})`;
        } else if (elements.userDisplay) {
            elements.userDisplay.textContent = '';
        }

        if (!dashboardAllowed) {
            boards = [];
            profiles = [];
            if (elements.list) elements.list.innerHTML = '';
            setStatus('');
            showTab('boards');
        }

        elements.accountsTabButton?.classList.toggle('hidden', !authUtils.isMaster(currentProfile));
        if (!authUtils.isMaster(currentProfile)) showTab('boards');
        updateCreateButtonState();
        if (dashboardAllowed) renderBoards();
        renderAccounts();
    }

    async function loadCurrentProfile() {
        currentProfile = null;
        if (!supabaseClient || !currentUser) return;

        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (error) throw error;
        currentProfile = authUtils.normalizeProfile(data);
    }

    async function ensureCurrentProfile() {
        if (!supabaseClient || !currentUser || currentProfile) return;
        const displayName = currentUser.user_metadata?.display_name || elements.nameInput?.value || '';
        const candidates = authUtils.getProfileInsertCandidates(currentUser, displayName);

        for (const candidate of candidates) {
            const { data, error } = await supabaseClient
                .from('profiles')
                .insert([candidate])
                .select()
                .single();
            if (!error) {
                currentProfile = authUtils.normalizeProfile(data);
                return;
            }
        }
    }

    async function refreshSessionProfile() {
        if (!supabaseClient) return;
        const { data: { session } } = await supabaseClient.auth.getSession();
        currentUser = session?.user || null;
        if (currentUser) {
            await loadCurrentProfile();
            await ensureCurrentProfile();
        } else {
            currentProfile = null;
        }
        renderAuthState();
    }

    async function loadBoards() {
        if (!canUseDashboard()) {
            boards = [];
            renderAuthState();
            return;
        }
        if (!supabaseClient) {
            boards = [];
            setConnected(false);
            renderBoards();
            return;
        }

        boards = await boardsApi.loadBoardsFromServer(supabaseClient);
        setConnected(true);
        renderBoards();
        setStatus('');
    }

    async function loadAccounts() {
        if (!supabaseClient || !authUtils.isMaster(currentProfile)) {
            profiles = [];
            renderAccounts();
            return;
        }
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: true });
        if (error) throw error;
        profiles = (data || []).map(authUtils.normalizeProfile).filter(Boolean);
        renderAccounts();
    }

    function renderAccounts() {
        if (!elements.pendingTeachersList || !elements.approvedTeachersList) return;
        if (!authUtils.isMaster(currentProfile)) {
            elements.pendingTeachersList.innerHTML = '';
            elements.approvedTeachersList.innerHTML = '';
            return;
        }

        const pending = profiles.filter(profile => profile.role === 'teacher_pending');
        const approved = profiles.filter(profile => profile.role === 'teacher');

        elements.pendingTeachersList.innerHTML = pending.length
            ? pending.map(profile => renderProfileRow(profile, 'pending')).join('')
            : '<p>승인 대기 중인 교사가 없습니다.</p>';

        elements.approvedTeachersList.innerHTML = approved.length
            ? approved.map(profile => renderProfileRow(profile, 'approved')).join('')
            : '<p>승인된 교사가 없습니다.</p>';
    }

    function renderProfileRow(profile, group) {
        const masterBadge = profile.is_primary_master
            ? '<span class="text-xs font-bold text-primary">최초 마스터</span>'
            : profile.is_master
                ? '<span class="text-xs font-bold text-primary">마스터</span>'
                : '';
        const approveButton = group === 'pending'
            ? `<button type="button" data-action="approve-teacher" data-user-id="${escapeHtml(profile.user_id)}" class="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold">승인</button>`
            : '';
        const masterButton = group === 'approved' && !profile.is_primary_master
            ? profile.is_master
                ? `<button type="button" data-action="revoke-master" data-user-id="${escapeHtml(profile.user_id)}" class="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold">마스터 해제</button>`
                : `<button type="button" data-action="grant-master" data-user-id="${escapeHtml(profile.user_id)}" class="px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold">마스터 부여</button>`
            : '';

        return `
            <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-outline-variant/50 bg-white px-4 py-3">
                <div>
                    <p class="font-bold text-on-surface">${escapeHtml(profile.display_name || '이름 없음')}</p>
                    <p class="text-xs text-on-surface-variant">${escapeHtml(profile.user_id)} ${masterBadge}</p>
                </div>
                <div class="flex gap-2">${approveButton}${masterButton}</div>
            </div>
        `;
    }

    async function createBoard() {
        if (!supabaseClient || !authUtils.canCreateBoard(currentProfile)) {
            setStatus('승인된 교사 또는 마스터만 새 보드를 만들 수 있습니다.');
            return;
        }
        setStatus('보드 생성 중...');
        try {
            const created = await boardsApi.createBoardInServer(supabaseClient, boardsApi.DEFAULT_BOARD_TITLE);
            boards.push(created);
            searchQuery = '';
            if (elements.searchInput) elements.searchInput.value = '';
            renderBoards();
            setStatus('보드가 생성되었습니다.');
        } catch (error) {
            console.error('Create board failed:', error);
            setStatus('보드 생성에 실패했습니다.');
        }
    }

    async function renameBoard(boardId) {
        if (!authUtils.canCreateBoard(currentProfile)) {
            setStatus('승인된 교사 또는 마스터만 보드를 수정할 수 있습니다.');
            return;
        }
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
        if (!authUtils.canCreateBoard(currentProfile)) {
            setStatus('승인된 교사 또는 마스터만 보드를 삭제할 수 있습니다.');
            return;
        }
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

    async function updateProfile(userId, patch) {
        const { error } = await supabaseClient
            .from('profiles')
            .update(patch)
            .eq('user_id', userId);
        if (error) throw error;
        await loadAccounts();
    }

    async function handleAccountAction(action, userId) {
        try {
            if (action === 'approve-teacher') {
                await updateProfile(userId, { role: 'teacher' });
            } else if (action === 'grant-master') {
                await updateProfile(userId, { is_master: true, role: 'teacher' });
            } else if (action === 'revoke-master') {
                await updateProfile(userId, { is_master: false });
            }
        } catch (error) {
            console.error('Account action failed:', error);
            alert('계정 관리 작업에 실패했습니다: ' + error.message);
        }
    }

    async function handleLogin() {
        const email = elements.emailInput?.value.trim();
        const password = elements.passwordInput?.value.trim();
        if (!email || !password) {
            alert('이메일과 비밀번호를 입력해 주세요.');
            return;
        }
        const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
        if (error) {
            alert('로그인 실패: ' + error.message);
            return;
        }
        await refreshSessionProfile();
        await loadBoards();
        await loadAccounts();
    }

    async function handleSignup() {
        const email = elements.signupEmailInput?.value.trim();
        const password = elements.signupPasswordInput?.value.trim();
        const displayName = elements.nameInput?.value.trim();
        if (!email || !password || !displayName) {
            alert('이메일, 비밀번호, 이름을 모두 입력해 주세요.');
            return;
        }
        const { error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
        });
        if (error) {
            alert('가입 실패: ' + error.message);
            return;
        }
        alert('가입 확인 메일을 확인해 주세요. 이메일 확인 후 로그인하면 교사 승인 대기 상태가 됩니다.');
        showAuthPanel('login');
    }

    async function handleResetPassword() {
        const email = elements.emailInput?.value.trim();
        if (!email) {
            alert('비밀번호를 재설정할 이메일을 입력해 주세요.');
            return;
        }
        const redirectTo = `${window.location.origin}${window.location.pathname}`;
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) {
            alert('비밀번호 재설정 실패: ' + error.message);
            return;
        }
        alert('비밀번호 재설정 메일을 보냈습니다.');
    }

    async function handleLogout() {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert('로그아웃 실패: ' + error.message);
            return;
        }
        currentUser = null;
        currentProfile = null;
        authPanelMode = 'closed';
        boards = [];
        profiles = [];
        renderAuthState();
    }

    function showTab(tabName) {
        const isAccounts = tabName === 'accounts' && authUtils.isMaster(currentProfile);
        elements.boardsPanel?.classList.toggle('hidden', isAccounts);
        elements.accountsPanel?.classList.toggle('hidden', !isAccounts);
        elements.boardsTabButton?.classList.toggle('bg-primary', !isAccounts);
        elements.boardsTabButton?.classList.toggle('text-white', !isAccounts);
        elements.accountsTabButton?.classList.toggle('bg-primary', isAccounts);
        elements.accountsTabButton?.classList.toggle('text-white', isAccounts);
        if (isAccounts) loadAccounts().catch(error => console.error('Load accounts failed:', error));
    }

    function handleListClick(event) {
        const actionElement = event.target.closest('[data-action]');
        if (!actionElement) return;

        const action = actionElement.getAttribute('data-action');
        const boardId = actionElement.getAttribute('data-board-id');
        const userId = actionElement.getAttribute('data-user-id');

        if (action === 'create-board') {
            createBoard();
        } else if (action === 'rename-board') {
            renameBoard(boardId);
        } else if (action === 'delete-board') {
            deleteBoard(boardId);
        } else if (userId) {
            handleAccountAction(action, userId);
        }
    }

    function handleSearchInput(event) {
        searchQuery = event.target.value || '';
        renderBoards();
    }

    async function initAuth() {
        if (!supabaseClient) {
            renderAuthState();
            return;
        }
        await refreshSessionProfile();
        supabaseClient.auth.onAuthStateChange(async (_event, session) => {
            currentUser = session?.user || null;
            if (currentUser) {
                await loadCurrentProfile();
                await ensureCurrentProfile();
            } else {
                currentProfile = null;
                boards = [];
                profiles = [];
            }
            renderAuthState();
            if (canUseDashboard()) {
                await loadBoards();
                await loadAccounts();
            }
        });
    }

    async function init() {
        const connection = supabaseUtils.createSupabaseClient(
            typeof CONFIG !== 'undefined' ? CONFIG : null,
            typeof supabase !== 'undefined' ? supabase : null
        );
        supabaseClient = connection.client;
        setConnected(Boolean(supabaseClient));

        if (elements.createButton) elements.createButton.addEventListener('click', createBoard);
        if (elements.list) elements.list.addEventListener('click', handleListClick);
        if (elements.searchInput) elements.searchInput.addEventListener('input', handleSearchInput);
        if (elements.openLoginButton) elements.openLoginButton.addEventListener('click', () => showAuthPanel('login'));
        if (elements.openSignupButton) elements.openSignupButton.addEventListener('click', () => showAuthPanel('signup'));
        if (elements.closeAuthButton) elements.closeAuthButton.addEventListener('click', () => showAuthPanel('closed'));
        if (elements.showSignupButton) elements.showSignupButton.addEventListener('click', () => showAuthPanel('signup'));
        if (elements.showLoginButton) elements.showLoginButton.addEventListener('click', () => showAuthPanel('login'));
        if (elements.loginButton) elements.loginButton.addEventListener('click', () => handleLogin().catch(error => alert(error.message)));
        if (elements.signupButton) elements.signupButton.addEventListener('click', () => handleSignup().catch(error => alert(error.message)));
        if (elements.resetPasswordButton) elements.resetPasswordButton.addEventListener('click', () => handleResetPassword().catch(error => alert(error.message)));
        if (elements.logoutButton) elements.logoutButton.addEventListener('click', () => handleLogout().catch(error => alert(error.message)));
        if (elements.boardsTabButton) elements.boardsTabButton.addEventListener('click', () => showTab('boards'));
        if (elements.accountsTabButton) elements.accountsTabButton.addEventListener('click', () => showTab('accounts'));
        if (elements.accountsPanel) elements.accountsPanel.addEventListener('click', handleListClick);

        await initAuth();
        if (canUseDashboard()) {
            await loadBoards();
            await loadAccounts();
        }
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
        if (globalThis.CSS && typeof CSS.escape === 'function') {
            return CSS.escape(value);
        }
        return String(value).replace(/"/g, '\\"');
    }

    document.addEventListener('DOMContentLoaded', () => {
        init().catch((error) => {
            console.error('Dashboard init failed:', error);
            renderAuthState();
        });
    });
})();
