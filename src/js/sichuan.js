/*!
 *  四川麻将血战到底 v2.5.0
 *
 *  Copyright(C) 2017 Satoshi Kobayashi
 *  Released under the MIT license
 *  https://github.com/kobalab/Majiang/blob/master/LICENSE
 */
"use strict";

const { hide, show, fadeIn, scale } = Majiang.UI.Util;

let game;
let pai, audio;
let pref;

$(function(){

    pai   = Majiang.UI.pai($('#loaddata'));
    audio = Majiang.UI.audio($('#loaddata'));
    pref  = JSON.parse(localStorage.getItem('Majiang.pref')||'{}');
    
    // 开始游戏按钮
    $('#sichuan-file .start-btn').on('click', start);
    
    // 窗口缩放
    $(window).on('resize', ()=>scale($('#board'), $('#space')));
    
    // 隐藏导航
    hide($('#navi'));
});

function start() {
    // 隐藏文件界面
    hide($('#sichuan-file'));
    hide($('#file'));
    
    // 显示游戏界面
    $('body').attr('class', 'board');
    scale($('#board'), $('#space'));
    
    // 创建玩家（4 个 AI 或 1 人 +3AI）
    const players = [ new Majiang.UI.Player($('#board'), pai, audio) ];
    for (let i = 1; i < 4; i++) {
        players[i] = new Majiang.AI();
    }
    
    // 创建四川麻将游戏
    game = new Majiang.SichuanGame(players, end, {});
    game.view = new Majiang.UI.Board($('#board .board'), pai, audio, game.model);
    
    // 创建控制器
    new Majiang.UI.GameCtl($('#board'), 'Majiang.pref', game, game._view);
    
    // 开始游戏
    game.kaiju();
}

function end(paipu) {
    // 游戏结束
    show($('#sichuan-file'));
    $('body').attr('class', 'file');
    
    // 保存牌谱
    if (paipu) {
        // TODO: 保存到 localStorage
        console.log('牌谱保存:', paipu);
    }
    
    // 显示最终分数
    show_stat(paipu);
}

function show_stat(paipu) {
    // TODO: 显示统计信息
    console.log('游戏结束，分数:', paipu?.defen);
}
