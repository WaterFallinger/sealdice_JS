// ==UserScript==
// @name         深夜梦呓
// @author       痛吃心肺
// @version      1.0
// @description  深夜时段概率提醒睡觉，每群每天最多3次。文案适配自家骰子，可按需修改 TALK_LIST。注：文案中<<$t玩家>>自动替换为触发深夜梦呓群员昵称。
// ==/UserScript==
(function() {
    'use strict';

    // ========== 通用防重载修复（固定模板） ==========
    const NOW_TIME = Date.now();
    if (!globalThis.DREAM_PLUGIN_TIME) globalThis.DREAM_PLUGIN_TIME = 0;
    globalThis.DREAM_PLUGIN_TIME = NOW_TIME;
    const PLUGIN_NAME = "dream_talk_" + Math.random().toString(36).slice(2, 8);
    const ext = seal.ext.new(PLUGIN_NAME, "深夜梦呓", "1.0");

    // ========== 功能配置区（可自定义修改） ==========
    const TRIGGER_RATE = 0.05;        // 触发概率 5%
    const DAILY_MAX_COUNT = 3;        // 单群每日最大触发次数
    const START_HOUR = 23;            // 生效开始时间 23点
    const END_HOUR = 3;               // 生效结束时间 次日3点

    // 随机梦呓语录（等概率抽取）
    const TALK_LIST = [
        "zZ…不可名状的呓语在<<$t玩家>>耳边回荡…(￣﹃￣)…zZ",
        "深夜水群，<<{$t玩家}>>理智-1…(；ﾟДﾟ)",
        "<<$t玩家>>听见有什么在黑暗中滚动……雪女打了个哈欠(´～` )…zZ",
        "<<$t玩家>>冒着被猎犬追杀的风险穿越回到了昨夜，并看到了他自己<<$t玩家>>：‘别再水群了，乖乖睡觉…’…(∪｡∪)…zzz",
        "<<$t玩家>>翻了个身，嘟囔着‘KP…KP…我要孤注一掷…体、体质…zzz’"
    ];

    // ========== 数据缓存（群每日触发计数，自动跨天清零） ==========
    const groupRecord = {};

    // ========== 工具函数 ==========
    // 获取当日日期，用于每日计数重置
    function getTodayDate() {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    // 判断是否在深夜生效时段
    function isInNightTime() {
        const hour = new Date().getHours();
        return hour >= START_HOUR || hour <= END_HOUR;
    }

    // 随机获取语录并替换玩家昵称占位符
    function getRandomTalk(nickname) {
        const idx = Math.floor(Math.random() * TALK_LIST.length);
        return TALK_LIST[idx].replace(/<\$t玩家>/g, nickname);
    }

    // 概率判断
    function canTrigger() {
        return Math.random() < TRIGGER_RATE;
    }

    // ========== 消息监听主逻辑 ==========
    ext.onNotCommandReceived = (ctx, msg) => {
        // 过滤旧实例，避免无效执行
        if (globalThis.DREAM_PLUGIN_TIME !== NOW_TIME) return;

        // 仅处理群消息
        const groupId = msg.groupId || msg.group_id;
        if (!groupId) return;

        // 解析消息内容，兼容文本/消息段数组格式
        let rawMsg = "";
        if (typeof msg.message === "string") {
            rawMsg = msg.message.trim();
        } else if (Array.isArray(msg.message)) {
            rawMsg = msg.message.map(seg => seg.type === "text" ? seg.data.text : "").join("").trim();
        }
        if (!rawMsg) return;

        // 获取发送者昵称
        const senderNick = msg.sender?.nickname || "调查员";

        // 非深夜时段直接跳过
        if (!isInNightTime()) return;
        
        const today = getTodayDate();
        // 初始化计数 / 跨天重置计数
        if (!groupRecord[groupId] || groupRecord[groupId].date !== today) {
            groupRecord[groupId] = {
                date: today,
                count: 0
            };
        }
        const record = groupRecord[groupId];

        // 达到每日次数上限，不再触发
        if (record.count >= DAILY_MAX_COUNT) return;

        // 概率触发梦呓
        if (canTrigger()) {
            record.count += 1;
            const replyText = getRandomTalk(senderNick);
            seal.replyToSender(ctx, msg, replyText);
        }
    };

    seal.ext.register(ext);
})();