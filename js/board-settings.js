(function (root, factory) {
    const moduleApi = factory(root.BoardSettingsUtils);
    if (typeof module === 'object' && module.exports) {
        module.exports = moduleApi;
    }
    root.IdeaCanvasBoardSettings = moduleApi;
})(typeof globalThis !== 'undefined' ? globalThis : window, function (boardSettingsUtils) {
    const fallbackUtils = boardSettingsUtils || require('./board-settings-utils');

    async function loadBoardSettingsFromServer(client, id, boardId = '') {
        if (!client) throw new Error('Supabase client is not available');

        let query = client
            .from('board_settings')
            .select('*');

        query = boardId ? query.eq('board_id', boardId) : query.eq('id', id);

        const { data, error } = await query.maybeSingle();

        if (error) throw error;
        return data ? fallbackUtils.normalizeBoardSettings(data) : null;
    }

    async function loadBoardSettingsByBoardIdsFromServer(client, boardIds) {
        if (!client) throw new Error('Supabase client is not available');
        const ids = Array.isArray(boardIds) ? boardIds.filter(Boolean) : [];
        if (!ids.length) return {};

        const { data, error } = await client
            .from('board_settings')
            .select('*')
            .in('board_id', ids);

        if (error) throw error;
        return (data || []).reduce((settingsByBoardId, row) => {
            if (row && row.board_id) {
                settingsByBoardId[row.board_id] = fallbackUtils.normalizeBoardSettings(row);
            }
            return settingsByBoardId;
        }, {});
    }

    async function saveBoardSettingsToServer(client, currentSettings, nextSettings, now = () => new Date().toISOString(), boardId = '') {
        if (!client) throw new Error('Supabase client is not available');

        const normalized = fallbackUtils.normalizeBoardSettings({
            ...currentSettings,
            ...nextSettings,
        });

        const payload = {
            id: boardId && normalized.id === fallbackUtils.DEFAULT_BOARD_SETTINGS.id
                ? `board:${boardId}`
                : normalized.id,
            title: normalized.title,
            write_enabled: normalized.write_enabled,
            updated_at: now(),
        };
        if (boardId) payload.board_id = boardId;

        const upsertOptions = boardId ? { onConflict: 'board_id' } : undefined;
        const { data, error } = await client
            .from('board_settings')
            .upsert(payload, upsertOptions)
            .select()
            .single();

        if (error) throw error;
        return fallbackUtils.normalizeBoardSettings(data);
    }

    return {
        loadBoardSettingsFromServer,
        loadBoardSettingsByBoardIdsFromServer,
        saveBoardSettingsToServer,
    };
});
