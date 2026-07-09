(function (root, factory) {
    const moduleApi = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = moduleApi;
    }
    root.IdeaCanvasBoards = moduleApi;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    const DEFAULT_BOARD_TITLE = '새 보드';

    function getBoardIdFromUrl(url) {
        try {
            return new URL(url).searchParams.get('board_id') || '';
        } catch (error) {
            return '';
        }
    }

    function normalizeBoard(board) {
        if (!board || !board.id) return null;
        const title = typeof board.title === 'string' && board.title.trim()
            ? board.title.trim()
            : DEFAULT_BOARD_TITLE;
        return {
            id: board.id,
            title,
            description: typeof board.description === 'string' ? board.description : '',
            sort_order: Number.isFinite(board.sort_order) ? board.sort_order : 0,
        };
    }

    function normalizeBoards(boards) {
        return Array.isArray(boards)
            ? boards.map(normalizeBoard).filter(Boolean)
            : [];
    }

    function filterBoardsByQuery(boards, query) {
        const normalizedQuery = typeof query === 'string' ? query.trim().toLowerCase() : '';
        if (!normalizedQuery) return boards;
        return normalizeBoards(boards).filter(board => board.title.toLowerCase().includes(normalizedQuery));
    }

    async function loadBoardsFromServer(client) {
        if (!client) throw new Error('Supabase client is not available');
        const { data, error } = await client
            .from('boards')
            .select('*')
            .order('sort_order', { ascending: true });

        if (error) throw error;
        return normalizeBoards(data);
    }

    async function loadBoardFromServer(client, boardId) {
        if (!client) throw new Error('Supabase client is not available');
        const { data, error } = await client
            .from('boards')
            .select('*')
            .eq('id', boardId)
            .maybeSingle();

        if (error) throw error;
        return normalizeBoard(data);
    }

    async function createBoardInServer(client, title = DEFAULT_BOARD_TITLE) {
        if (!client) throw new Error('Supabase client is not available');
        const normalizedTitle = title && title.trim() ? title.trim() : DEFAULT_BOARD_TITLE;
        const { data, error } = await client
            .from('boards')
            .insert([{ title: normalizedTitle }])
            .select();

        if (error) throw error;
        return normalizeBoard(data && data.length ? data[0] : null);
    }

    async function renameBoardInServer(client, boardId, title) {
        if (!client) throw new Error('Supabase client is not available');
        const normalizedTitle = title && title.trim() ? title.trim() : DEFAULT_BOARD_TITLE;
        const { error } = await client
            .from('boards')
            .update({ title: normalizedTitle })
            .eq('id', boardId);

        if (error) throw error;
    }

    async function deleteBoardInServer(client, boardId) {
        if (!client) throw new Error('Supabase client is not available');
        const { error } = await client
            .from('boards')
            .delete()
            .eq('id', boardId);

        if (error) throw error;
    }

    return {
        DEFAULT_BOARD_TITLE,
        getBoardIdFromUrl,
        normalizeBoard,
        normalizeBoards,
        filterBoardsByQuery,
        loadBoardFromServer,
        loadBoardsFromServer,
        createBoardInServer,
        renameBoardInServer,
        deleteBoardInServer,
    };
});
