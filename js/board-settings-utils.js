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

    function normalizeBoardSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return { ...DEFAULT_BOARD_SETTINGS };
        }

        const title = typeof settings.title === 'string' && settings.title.trim()
            ? settings.title.trim()
            : DEFAULT_BOARD_SETTINGS.title;

        return {
            id: settings.id || DEFAULT_BOARD_SETTINGS.id,
            board_id: settings.board_id || '',
            title,
            write_enabled: resolveWriteEnabled(settings),
            comments_enabled: resolveCommentsEnabled(settings),
            likes_enabled: resolveLikesEnabled(settings),
        };
    }

    return {
        DEFAULT_BOARD_SETTINGS,
        normalizeBoardSettings,
    };
});
