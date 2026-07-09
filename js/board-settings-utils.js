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
        auth_write: false,
    };

    function normalizeBoardSettings(settings) {
        if (!settings || typeof settings !== 'object') {
            return { ...DEFAULT_BOARD_SETTINGS };
        }

        const title = typeof settings.title === 'string' && settings.title.trim()
            ? settings.title.trim()
            : DEFAULT_BOARD_SETTINGS.title;

        return {
            id: settings.id || DEFAULT_BOARD_SETTINGS.id,
            title,
            auth_write: settings.auth_write === true,
        };
    }

    return {
        DEFAULT_BOARD_SETTINGS,
        normalizeBoardSettings,
    };
});
