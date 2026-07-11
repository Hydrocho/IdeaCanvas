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
            comments_enabled: normalized.comments_enabled,
            likes_enabled: normalized.likes_enabled,
            bg_color: normalized.bg_color,
            settings_json: {
                write_enabled: normalized.write_enabled,
                comments_enabled: normalized.comments_enabled,
                likes_enabled: normalized.likes_enabled,
                bg_color: normalized.bg_color,
                sections_enabled: normalized.sections_enabled,
            },
            updated_at: now(),
        };
        if (boardId) payload.board_id = boardId;

        if (boardId) {
            const updatePayload = {
                title: payload.title,
                write_enabled: payload.write_enabled,
                comments_enabled: payload.comments_enabled,
                likes_enabled: payload.likes_enabled,
                bg_color: payload.bg_color,
                settings_json: payload.settings_json,
                updated_at: payload.updated_at,
            };
            
            let result = await client
                .from('board_settings')
                .update(updatePayload)
                .eq('board_id', boardId)
                .select()
                .maybeSingle();

            if (result.error && result.error.code === '42703') {
                console.warn("settings_json column does not exist on server. Retrying update with legacy columns.");
                const legacyUpdatePayload = { ...updatePayload };
                delete legacyUpdatePayload.settings_json;
                result = await client
                    .from('board_settings')
                    .update(legacyUpdatePayload)
                    .eq('board_id', boardId)
                    .select()
                    .maybeSingle();
            }

            if (result.error) throw result.error;
            if (result.data) return fallbackUtils.normalizeBoardSettings(result.data);

            let insertResult = await client
                .from('board_settings')
                .insert(payload)
                .select()
                .single();

            if (insertResult.error && insertResult.error.code === '42703') {
                console.warn("settings_json column does not exist on server. Retrying insert with legacy columns.");
                const legacyPayload = { ...payload };
                delete legacyPayload.settings_json;
                insertResult = await client
                    .from('board_settings')
                    .insert(legacyPayload)
                    .select()
                    .single();
            }

            if (insertResult.error) throw insertResult.error;
            return fallbackUtils.normalizeBoardSettings(insertResult.data);
        }

        let upsertResult = await client
            .from('board_settings')
            .upsert(payload)
            .select()
            .single();

        if (upsertResult.error && upsertResult.error.code === '42703') {
            console.warn("settings_json column does not exist on server. Retrying upsert with legacy columns.");
            const legacyPayload = { ...payload };
            delete legacyPayload.settings_json;
            upsertResult = await client
                .from('board_settings')
                .upsert(legacyPayload)
                .select()
                .single();
        }

        if (upsertResult.error) throw upsertResult.error;
        return fallbackUtils.normalizeBoardSettings(upsertResult.data);
    }

    return {
        loadBoardSettingsFromServer,
        loadBoardSettingsByBoardIdsFromServer,
        saveBoardSettingsToServer,
    };
});
