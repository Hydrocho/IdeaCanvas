(function (root, factory) {
    const utils = factory();
    if (typeof module === 'object' && module.exports) {
        module.exports = utils;
    }
    root.BoardSettingsUtils = utils;
})(typeof globalThis !== 'undefined' ? globalThis : window, function () {
    const DEFAULT_BOARD_SETTINGS = {
        id: 'default',
        title: '새로운 생각',
        write_enabled: true,
        comments_enabled: true,
        likes_enabled: true,
        bg_color: 'default',
        sections_enabled: false,
    };

    function resolveWriteEnabled(settings) {
        if (settings.write_enabled === true || settings.write_enabled === false) {
            return settings.write_enabled;
        }
        if (settings.auth_write === true || settings.auth_write === false) {
            return !settings.auth_write;
        }
        return DEFAULT_BOARD_SETTINGS.write_enabled;
    }

    function resolveCommentsEnabled(settings) {
        if (settings.comments_enabled === true || settings.comments_enabled === false) {
            return settings.comments_enabled;
        }
        return DEFAULT_BOARD_SETTINGS.comments_enabled;
    }

    function resolveLikesEnabled(settings) {
        if (settings.likes_enabled === true || settings.likes_enabled === false) {
            return settings.likes_enabled;
        }
        return DEFAULT_BOARD_SETTINGS.likes_enabled;
    }

    function resolveBgColor(settings) {
        if (typeof settings.bg_color === 'string' && settings.bg_color.trim()) {
            return settings.bg_color.trim();
        }
        return DEFAULT_BOARD_SETTINGS.bg_color;
    }

    function resolveSectionsEnabled(settings) {
        if (settings.sections_enabled === true || settings.sections_enabled === false) {
            return settings.sections_enabled;
        }
        return DEFAULT_BOARD_SETTINGS.sections_enabled;
    }

    function normalizeBoardSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return { ...DEFAULT_BOARD_SETTINGS };
        }

        let jsonSettings = {};
        if (settings.settings_json) {
            if (typeof settings.settings_json === 'string') {
                try {
                    jsonSettings = JSON.parse(settings.settings_json);
                } catch (e) {
                    console.error("Failed to parse settings_json:", e);
                }
            } else if (typeof settings.settings_json === 'object') {
                jsonSettings = settings.settings_json;
            }
        }

        const merged = {
            ...settings,
            ...jsonSettings
        };

        const title = typeof merged.title === 'string' && merged.title.trim()
            ? merged.title.trim()
            : DEFAULT_BOARD_SETTINGS.title;

        return {
            id: settings.id || DEFAULT_BOARD_SETTINGS.id,
            board_id: settings.board_id || '',
            title,
            write_enabled: resolveWriteEnabled(merged),
            comments_enabled: resolveCommentsEnabled(merged),
            likes_enabled: resolveLikesEnabled(merged),
            bg_color: resolveBgColor(merged),
            sections_enabled: resolveSectionsEnabled(merged),
            settings_json: jsonSettings
        };
    }

    return {
        DEFAULT_BOARD_SETTINGS,
        normalizeBoardSettings,
    };
});
