// ==UserScript==
// @name         自动复读机
// @author       Watterbottlebpttlt
// @version      1.0
// @description  群聊自动跟复读，检测三人以上复读时自动跟一句
// ==/UserScript==
(function() {
    'use strict';

    const CONFIG = {
        triggerCount: 3,
        ignoreEmpty: true
    };

    // 时间戳过滤+随机扩展名，解决重载失效
    const NOW_TIME = Date.now();
    if (!globalThis.REPEAT_PLUGIN_TIME) globalThis.REPEAT_PLUGIN_TIME = 0;
    globalThis.REPEAT_PLUGIN_TIME = NOW_TIME;

    const groupCache = {};
    const PLUGIN_NAME = "auto_repeat_" + Math.random().toString(36).slice(2, 8);
    const ext = seal.ext.new(PLUGIN_NAME, "auto_repeat", "1.5");

    ext.onNotCommandReceived = (ctx, msg) => {
        // 旧实例直接跳过
        if (globalThis.REPEAT_PLUGIN_TIME !== NOW_TIME) return;

        const groupId = msg.groupId || msg.group_id;
        if (!groupId) return;

        const senderId = msg.sender?.userId || msg.user_id;
        if (!senderId) return;

        let rawContent = "";
        if (typeof msg.message === "string") {
            rawContent = msg.message;
        } else if (Array.isArray(msg.message)) {
            rawContent = msg.message.map(seg => seg.type === "text" ? seg.data.text : "").join("");
        }
        const content = rawContent.trim();

        if (CONFIG.ignoreEmpty && !content) return;

        if (!groupCache[groupId]) {
            groupCache[groupId] = {
                lastContent: "",
                lastSenderId: "",
                repeatCount: 1,
                hasReplied: false
            };
        }
        const state = groupCache[groupId];

        if (content === state.lastContent) {
            if (senderId !== state.lastSenderId) {
                state.repeatCount += 1;
                state.lastSenderId = senderId;

                if (state.repeatCount >= CONFIG.triggerCount && !state.hasReplied) {
                    seal.replyToSender(ctx, msg, content);
                    state.hasReplied = true;
                }
            }
        } else {
            state.lastContent = content;
            state.lastSenderId = senderId;
            state.repeatCount = 1;
            state.hasReplied = false;
        }
    };

    seal.ext.register(ext);
})();