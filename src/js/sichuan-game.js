/*!
 *  四川麻将血战到底 - 游戏核心逻辑
 */
"use strict";

class SichuanGame {
    constructor(players, callback, rule) {
        this._players = players;
        this._callback = callback;
        this._rule = Object.assign({}, {
            suits: ['m', 'p', 's'],
            totalTiles: 108,
            xuezhandaodi: true,
            hule_liqu: true,
            max_hule: 3,
            yipaoduoxiang: true,
            huan_sanzhang: true,
            dingque: true,
            chi: false,
            peng: true,
            gang: true,
            check_huazhu: true,
            check_dajiao: true,
            min_fanshu: 1
        }, rule);
        
        this._state = {
            huan_sanzhang: true,
            dingque_done: false,
            hule_players: [],
            lique_players: [],
            gang_fen: {},
            huazhu_players: [],
            dajiao_players: [],
            tingpai_players: [],
            last_four: false
        };
        
        this._dingque = [-1, -1, -1, -1];
        this._model = null;
        this._view = null;
        this._shan = null;
        this._lunban = 0;
    }
    
    kaiju() {
        this._model = {
            jushu: 0,
            changbang: 0,
            lizhibang: 0,
            defen: this._players.map(() => 1000),
            qijia: 0
        };
        
        this._players.forEach((player, i) => {
            player.kaiju({
                id: i,
                qijia: this._model.qijia,
                title: '四川麻将',
                player: this._players.map(p => p._player || 'AI'),
                rule: this._rule
            });
        });
        
        this._view?.open();
        this._qipai();
    }
    
    _qipai() {
        const shan = new Majiang.Shan(this._rule);
        const qipai = [];
        
        for (let i = 0; i < 4; i++) {
            const count = (i === this._model.qijia) ? 14 : 13;
            const hand = [];
            for (let j = 0; j < count; j++) {
                hand.push(shan.zimo());
            }
            qipai.push(hand);
        }
        
        if (this._rule.huan_sanzhang) {
            this._huan_sanzhang(qipai, shan);
        } else {
            this._qipai_complete(qipai, shan);
        }
    }
    
    _huan_sanzhang(qipai, shan) {
        this._players.forEach((player, i) => {
            player.huan_sanzhang({
                qipai: qipai[i],
                rule: this._rule
            });
        });
        this._wait_huan_sanzhang(qipai, shan);
    }
    
    async _wait_huan_sanzhang(qipai, shan) {
        const exchanges = await Promise.all(this._players.map((player, i) => {
            return new Promise(resolve => {
                if (player instanceof Majiang.AI) {
                    const exchange = this._ai_select_huan(qipai[i]);
                    resolve({ id: i, exchange });
                } else {
                    player.once('huan_sanzhang_complete', (exchange) => {
                        resolve({ id: i, exchange });
                    });
                }
            });
        }));
        
        this._execute_exchange(qipai, exchanges);
        this._dingque_phase(qipai, shan);
    }
    
    _ai_select_huan(hand) {
        const count = { m: 0, p: 0, s: 0 };
        hand.forEach(p => {
            const suit = p[0];
            if (count[suit] !== undefined) count[suit]++;
        });
        const minSuit = Object.keys(count).reduce((a, b) => count[a] < count[b] ? a : b);
        return hand.filter(p => p[0] === minSuit).slice(0, 3);
    }
    
    _execute_exchange(qipai, results) {
        const pool = [];
        results.forEach(r => pool.push(...r.exchange));
        pool.sort(() => Math.random() - 0.5);
        
        let idx = 0;
        results.forEach(r => {
            r.exchange.forEach(() => {
                qipai[r.id].push(pool[idx++]);
            });
        });
    }
    
    _dingque_phase(qipai, shan) {
        this._players.forEach((player, i) => {
            player.dingque({ qipai: qipai[i], rule: this._rule });
        });
        this._wait_dingque(qipai, shan);
    }
    
    async _wait_dingque(qipai, shan) {
        const dingques = await Promise.all(this._players.map((player, i) => {
            return new Promise(resolve => {
                if (player instanceof Majiang.AI) {
                    const dingque = this._ai_dingque(qipai[i]);
                    resolve({ id: i, dingque });
                } else {
                    player.once('dingque_complete', (dingque) => {
                        resolve({ id: i, dingque });
                    });
                }
            });
        }));
        
        dingques.forEach(r => this._dingque[r.id] = r.dingque);
        this._qipai_complete(qipai, shan);
    }
    
    _ai_dingque(hand) {
        const count = { m: 0, p: 0, s: 0 };
        hand.forEach(p => {
            const suit = p[0];
            if (count[suit] !== undefined) count[suit]++;
        });
        const minSuit = Object.keys(count).reduce((a, b) => count[a] < count[b] ? a : b);
        return { m: 0, p: 1, s: 2 }[minSuit];
    }
    
    _qipai_complete(qipai, shan) {
        const shoupai = qipai.map(q => new Majiang.Shoupai(q).toString());
        
        this._players.forEach((player, i) => {
            player.qipai({
                zhuangfeng: 0,
                jushu: 0,
                changbang: 0,
                lizhibang: 0,
                defen: this._model.defen.concat(),
                baopai: shan.baopai[0],
                shoupai: shoupai
            });
        });
        
        this._shan = shan;
        this._lunban = this._model.qijia;
        
        if (!this._check_tianhu(shoupai)) {
            this._next_player();
        }
    }
    
    _check_tianhu(shoupai) {
        const zhuang = shoupai[this._model.qijia];
        if (Majiang.Util.hule(zhuang)) {
            this._zimo_hule(this._model.qijia, null);
            return true;
        }
        return false;
    }
    
    _next_player() {
        if (this._check_game_end()) return;
        
        if (this._shan.paishu <= 4) {
            this._state.last_four = true;
        }
        
        if (this._state.lique_players.includes(this._lunban)) {
            this._lunban = (this._lunban + 1) % 4;
            this._next_player();
            return;
        }
        
        const player = this._players[this._lunban];
        const p = this._shan.zimo();
        
        if (player.select_hule && player.select_hule({ l: this._lunban, p })) {
            this._zimo_hule(this._lunban, p);
            return;
        }
        
        if (player.select_gang) {
            const gang = player.select_gang();
            if (gang) {
                this._gang(this._lunban, gang);
                return;
            }
        }
        
        if (player.select_dapai) {
            const dapai = player.select_dapai();
            this._dapai(this._lunban, dapai);
        }
    }
    
    _dapai(lunban, dapai) {
        this._players.forEach(player => {
            player.dapai({ l: lunban, p: dapai });
        });
        
        this._check_yipaoduoxiang(lunban, dapai);
        
        this._lunban = (this._lunban + 1) % 4;
        this._next_player();
    }
    
    _check_yipaoduoxiang(dianpao_lunban, dapai) {
        const hule_players = [];
        
        for (let i = 0; i < 4; i++) {
            if (i === dianpao_lunban) continue;
            if (this._state.lique_players.includes(i)) continue;
            
            const player = this._players[i];
            if (player.select_hule && player.select_hule({ l: dianpao_lunban, p: dapai })) {
                hule_players.push(i);
            }
        }
        
        if (hule_players.length > 0) {
            hule_players.forEach(lunban => {
                this._dianpao_hule(lunban, dianpao_lunban, dapai);
            });
            
            if (hule_players.length >= 3 || this._state.last_four) {
                setTimeout(() => this._game_end(), 1000);
                return;
            }
            
            hule_players.forEach(lunban => {
                this._state.lique_players.push(lunban);
            });
        }
    }
    
    _dianpao_hule(hule_lunban, dianpao_lunban, pai) {
        this._hule_settlement(hule_lunban, dianpao_lunban, pai, false);
        this._state.hule_players.push(hule_lunban);
        
        if (this._state.hule_players.length >= 3) {
            setTimeout(() => this._game_end(), 1000);
        } else {
            this._state.lique_players.push(hule_lunban);
        }
    }
    
    _zimo_hule(lunban, pai) {
        this._players.forEach(player => {
            player.hule({ l: lunban, p: pai });
        });
        
        this._hule_settlement(lunban, null, pai, true);
        this._state.hule_players.push(lunban);
        
        if (this._state.hule_players.length >= 3) {
            setTimeout(() => this._game_end(), 1000);
        } else {
            this._state.lique_players.push(lunban);
        }
    }
    
    _hule_settlement(hule_lunban, dianpao_lunban, pai, zimo) {
        const player = this._players[hule_lunban];
        const shoupai = player.shoupai;
        const fanshu = this._calc_fanshu(shoupai, pai, zimo);
        const difen = 1;
        let defen = difen * fanshu;
        
        if (zimo) {
            for (let i = 0; i < 4; i++) {
                if (i === hule_lunban) continue;
                if (this._state.lique_players.includes(i)) continue;
                this._model.defen[i] -= defen;
                this._model.defen[hule_lunban] += defen;
            }
        } else {
            this._model.defen[dianpao_lunban] -= defen;
            this._model.defen[hule_lunban] += defen;
        }
        
        this._players.forEach((player, i) => {
            player.jiesuan({
                type: 'hule',
                hule_lunban,
                dianpao_lunban,
                zimo,
                fanshu,
                defen
            });
        });
    }
    
    _calc_fanshu(shoupai, pai, zimo) {
        let fanshu = 1;
        if (this._is_qingyise(shoupai)) fanshu *= 4;
        if (this._is_duizi(shoupai)) fanshu *= 2;
        if (this._is_qidui(shoupai)) {
            fanshu *= 4;
            if (this._is_longqidui(shoupai)) fanshu *= 2;
        }
        if (zimo) fanshu *= 2;
        return fanshu;
    }
    
    _gang(lunban, gang) {
        const is_an = gang.match(/^[mpsz]\d{4}$/);
        const is_bu = gang.match(/^[mpsz]\d{3}0$/);
        const gang_fen = is_an ? 2 : 1;
        
        this._players.forEach(player => {
            player.gang({ l: lunban, m: gang });
        });
        
        this._gang_settlement(lunban, gang_fen);
        
        const p = this._shan.zimo();
        const player = this._players[lunban];
        
        if (player.select_hule && player.select_hule({ l: lunban, p })) {
            this._gangshanghua(lunban, p);
            return;
        }
        
        if (player.select_dapai) {
            const dapai = player.select_dapai();
            this._dapai(lunban, dapai);
        }
    }
    
    _gang_settlement(lunban, fen) {
        for (let i = 0; i < 4; i++) {
            if (i === lunban) continue;
            if (this._state.lique_players.includes(i)) continue;
            this._model.defen[i] -= fen;
            this._model.defen[lunban] += fen;
        }
        
        if (!this._state.gang_fen[lunban]) this._state.gang_fen[lunban] = 0;
        this._state.gang_fen[lunban] += fen;
    }
    
    _gangshanghua(lunban, pai) {
        this._hule_settlement(lunban, lunban, pai, true);
        this._state.hule_players.push(lunban);
        
        if (this._state.hule_players.length >= 3) {
            setTimeout(() => this._game_end(), 1000);
        } else {
            this._state.lique_players.push(lunban);
        }
    }
    
    _game_end() {
        if (this._state.hule_players.length < 3 && this._shan.paishu <= 0) {
            this._liuju_settlement();
        }
        
        const paipu = {
            title: '四川麻将',
            player: this._players.map(p => p._player || 'AI'),
            rule: this._rule,
            defen: this._model.defen,
            data: []
        };
        
        this._players.forEach(player => {
            player.jiesuan({
                type: 'end',
                defen: this._model.defen
            });
        });
        
        if (this._callback) {
            this._callback(paipu);
        }
    }
    
    _liuju_settlement() {
        const hule_players = this._state.hule_players;
        const liju_players = this._players.filter((_, i) => !hule_players.includes(i));
        
        const huazhu = [];
        liju_players.forEach(player => {
            const suits = this._get_suits(player.shoupai);
            if (suits.length === 3) huazhu.push(player._id);
        });
        
        huazhu.forEach(hz_id => {
            const hz_fen = 8;
            for (let i = 0; i < 4; i++) {
                if (i === hz_id || huazhu.includes(i)) continue;
                this._model.defen[hz_id] -= hz_fen;
                this._model.defen[i] += hz_fen;
            }
        });
        
        const tingpai = liju_players.filter(p => Majiang.Util.xiangting(p.shoupai) === 0);
        const dajiao = liju_players.filter(p => Majiang.Util.xiangting(p.shoupai) > 0);
        
        dajiao.forEach(dj => {
            const max_fanshu = 8;
            tingpai.forEach(tp => {
                this._model.defen[dj._id] -= max_fanshu;
                this._model.defen[tp._id] += max_fanshu;
            });
            
            const gang_fen = this._state.gang_fen[dj._id] || 0;
            this._model.defen[dj._id] += gang_fen;
        });
        
        this._players.forEach(player => {
            player.jiesuan({
                type: 'liuju',
                huazhu,
                tingpai: tingpai.map(p => p._id),
                dajiao: dajiao.map(p => p._id),
                defen: this._model.defen
            });
        });
    }
    
    _get_suits(shoupai) {
        const suits = new Set();
        const paistr = shoupai.toString();
        for (let i = 0; i < paistr.length; i += 2) {
            const suit = paistr[i];
            if (['m', 'p', 's'].includes(suit)) suits.add(suit);
        }
        return Array.from(suits);
    }
    
    _check_game_end() {
        if (this._state.hule_players.length >= 3) {
            this._game_end();
            return true;
        }
        if (this._shan.paishu <= 0) {
            this._game_end();
            return true;
        }
        return false;
    }
    
    _is_pinghu(shoupai) { return true; }
    
    _is_duizi(shoupai) {
        const paistr = shoupai.toString();
        const count = {};
        for (let i = 0; i < paistr.length; i += 2) {
            const pai = paistr.slice(i, i + 2);
            count[pai] = (count[pai] || 0) + 1;
        }
        const duizi = Object.values(count).filter(c => c === 2).length;
        const kezi = Object.values(count).filter(c => c === 3).length;
        return duizi + kezi === 4 && kezi > 0;
    }
    
    _is_qingyise(shoupai) {
        return this._get_suits(shoupai).length === 1;
    }
    
    _is_qidui(shoupai) {
        const paistr = shoupai.toString();
        const count = {};
        for (let i = 0; i < paistr.length; i += 2) {
            const pai = paistr.slice(i, i + 2);
            count[pai] = (count[pai] || 0) + 1;
        }
        return Object.values(count).filter(c => c >= 2).length === 7;
    }
    
    _is_longqidui(shoupai) {
        const paistr = shoupai.toString();
        const count = {};
        for (let i = 0; i < paistr.length; i += 2) {
            const pai = paistr.slice(i, i + 2);
            count[pai] = (count[pai] || 0) + 1;
        }
        return Object.values(count).some(c => c === 4);
    }
}

global.Majiang.SichuanGame = SichuanGame;
