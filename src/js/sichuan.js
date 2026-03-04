/*!
 *  四川麻将血战到底 v2.5.0
 */
"use strict";

const { hide, show, scale } = Majiang.UI.Util;

// 全局暴露
window.sichuanGame = null;
let pai, audio;

$(function(){
    pai   = Majiang.UI.pai($('#loaddata'));
    audio = Majiang.UI.audio($('#loaddata'));
    
    $('#sichuan-file .start-btn').on('click', start);
    $(window).on('resize', ()=>scale($('#board'), $('#space')));
    hide($('#navi'));
});

function start() {
    hide($('#sichuan-file'));
    hide($('#file'));
    $('body').attr('class', 'board');
    scale($('#board'), $('#space'));
    
    // 全部 4 个都是 AI
    const players = [];
    for (let i = 0; i < 4; i++) {
        players[i] = new Majiang.AI();
    }
    
    const rule = Majiang.rule({
        '赤牌': { m: 0, p: 0, s: 0 },
        '裏ドラあり': false,
        '場数': 1
    });
    
    window.sichuanGame = new Majiang.Game(players, end, rule);
    window.sichuanGame.view = new Majiang.UI.Board($('#board .board'), pai, audio, window.sichuanGame.model);
    
    // 不创建 GameCtl（不需要人类玩家控制）
    window.sichuanGame.kaiju();
}

function end(paipu) {
    show($('#sichuan-file'));
    $('body').attr('class', 'file');
    if (paipu) console.log('游戏结束:', paipu);
}
