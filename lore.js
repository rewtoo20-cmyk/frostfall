// FROSTFALL: сказания (зачарованные мечи, жители столицы, задания). Только логика, без рисования.
(function (root) {
  'use strict';
  const Core = root.Core, W = Core.World, H = Core.H, F = Core.fmt;

  // ---------- зачарованные мечи ----------
  // fx: ключ -> [значение на 1 уровне, прирост за уровень]. proc: особый удар.
  const RARC = [null, { name: 'Эпический', col: '#b66cff' }, { name: 'Легендарный', col: '#ff9c2a' }, { name: 'Мифический', col: '#ff4d6d' }];
  const ARTS = [
    { id: 'frost', name: 'Ледяной Клык', rar: 1, shape: 'zig', pal: ['#e4f6ff', '#5bc0ff', '#ffffff'], src: 'Задание Ингеборг', story: 'Выточен из сердца ледника. На морозе тихо поёт.',
      fx: { dmg: [10, 5] }, proc: { p: 0.06, m0: 4, ml: 0.6, name: 'Заморозка!', col: '#9fe8ff' } },
    { id: 'dawn', name: 'Жало Рассвета', rar: 1, shape: 'str', pal: ['#fff2c8', '#ffd24a', '#ffffff'], src: 'Задание Ингеборг', story: 'Тонкий клинок. Бьёт туда, где у врага больнее всего.',
      fx: { crit: [3, 1.2], click: [15, 8] } },
    { id: 'thunder', name: 'Громобой', rar: 1, shape: 'zig', pal: ['#fffbb0', '#ffe14a', '#ffffff'], src: 'Задание ярла Гуннара', story: 'Старая реликвия арсенала. Каждый восьмой удар зовёт молнию.',
      fx: { dmg: [6, 3] }, proc: { every: 8, m0: 4, ml: 0.5, name: 'Молния!', col: '#ffe14a' } },
    { id: 'ember', name: 'Клинок Пепла', rar: 2, shape: 'wide', pal: ['#ffd9a0', '#ff6a1a', '#fff2c8'], src: 'Задание кузнеца Бьёрна', story: 'Закалён в углях, которые не гаснут даже в метель.',
      fx: { dmg: [15, 7], click: [20, 10] }, proc: { p: 0.08, m0: 3, ml: 0.5, name: 'Пламя!', col: '#ff9c2a' } },
    { id: 'gold', name: 'Златожор', rar: 2, shape: 'wide', pal: ['#fff0a0', '#e8b020', '#ffffff'], src: 'Задание скальда Эйнара', story: 'Проиграл в споре. Жадный меч: чем больше добычи, тем острее.',
      fx: { gold: [25, 12], dmg: [5, 2] }, proc: { p: 0.05, m0: 5, ml: 0.6, name: 'Золотой удар!', col: '#ffd24a' } },
    { id: 'eye', name: 'Око Вьюги', rar: 2, shape: 'str', pal: ['#d8f0ff', '#7fa0ff', '#ffffff'], src: 'Задание Ингеборг', story: 'В навершии спит маленькая буря. Умения от неё быстрее.',
      fx: { cd: [8, 2], storm: [20, 10], dmg: [8, 3] }, proc: { every: 12, m0: 6, ml: 0.8, name: 'Буря!', col: '#9fe8ff' } },
    { id: 'void', name: 'Голод Бездны', rar: 2, shape: 'zig', pal: ['#d0a0ff', '#6a2ab0', '#ff7ae0'], src: 'Редко падает с боссов и из руин', story: 'Меч, который никогда не наедается. Босс рядом с ним дрожит.',
      fx: { dmg: [20, 8], boss: [2, 0.5] }, proc: { p: 0.04, m0: 10, ml: 1.2, name: 'Пожирание!', col: '#ff7ae0' } },
    { id: 'heart', name: 'Сердце Зимы', rar: 3, shape: 'wide', pal: ['#ffffff', '#7fe0ff', '#fff2c8'], src: 'Последнее задание ярла', story: 'Сама Зима отдала его защитникам. Светится изнутри.',
      fx: { dmg: [30, 12], gold: [15, 6], crit: [4, 1] }, proc: { every: 10, m0: 8, ml: 1, name: 'Сердце зимы!', col: '#ffffff' } },
    { id: 'king', name: 'Меч Короля Мороза', rar: 3, shape: 'wide', pal: ['#ffd0d8', '#e0325a', '#9fe8ff'], src: 'Задание Тени из Храма', story: 'Им правил мёртвый король. Теперь он слушается тебя. Пока.',
      fx: { dmg: [45, 15], ally: [20, 8], click: [30, 10] }, proc: { p: 0.1, m0: 6, ml: 0.8, name: 'Воля короля!', col: '#ff4d6d' } },
  ];
  const AID = {}; ARTS.forEach((a) => { AID[a.id] = a; });
  const MAXL = 10;
  const FXN = { dmg: 'Урон', gold: 'Золото', crit: 'Шанс крита', click: 'Урон клика', ally: 'Урон союзников', boss: 'Время босса', cd: 'Умения быстрее', storm: 'Сила шторма' };
  const fxVal = (a, k, L) => a.fx[k][0] + a.fx[k][1] * (L - 1);
  const fxStr = (k, v) => FXN[k] + ' +' + (Math.round(v * 10) / 10).toString().replace('.', ',') + (k === 'boss' ? ' с' : '%');
  const lore = (s) => s.city.lore;
  const owned = (s) => ARTS.filter((a) => lore(s).art[a.id] > 0);
  const lvOf = (s, id) => lore(s).art[id] | 0;
  const equipped = (s) => { const id = lore(s).eq; return id && lvOf(s, id) ? AID[id] : null; };
  const procMult = (a, L) => a.proc.m0 + a.proc.ml * (L - 1);
  const procText = (a, L) => a.proc ? (a.proc.every ? 'Каждый ' + a.proc.every + '-й удар' : 'Шанс ' + Math.round(a.proc.p * 100) + '%') + ': ×' + (Math.round(procMult(a, L || 1) * 10) / 10).toString().replace('.', ',') + ' урона' : '';
  const upCost = (L) => ({ iron: Math.round(25 * Math.pow(1.5, L)), gems: Math.ceil(L * 1.5) });
  const colBonus = (s) => owned(s).length * 2; // % урона за коллекцию
  function artInfo(s, id) {
    const a = AID[id], L = lvOf(s, id), cost = L && L < MAXL ? upCost(L) : null;
    return { a, L, have: L > 0, eq: lore(s).eq === id && L > 0, cost, can: !!cost && s.city.res.iron >= cost.iron && s.gems >= cost.gems, maxed: L >= MAXL };
  }
  function giveArt(s, id) { // выдать меч (повтор = +1 уровень)
    const a = AID[id], l = lore(s); if (!a) return null;
    if (!l.art[id]) { l.art[id] = 1; if (!l.eq || (AID[l.eq] && AID[l.eq].rar < a.rar)) l.eq = id; W.bump(s); if (s.rt) Core.ev(s, { t: 'art', id }); return { id, fresh: true }; }
    if (l.art[id] < MAXL) { l.art[id]++; W.bump(s); if (s.rt) Core.ev(s, { t: 'art', id, up: true }); return { id, fresh: false }; }
    s.gems += 5; return { id, fresh: false, gems: 5 };
  }
  function artEquip(s, id) { if (!lvOf(s, id)) return false; lore(s).eq = id; W.bump(s); return true; }
  function artUp(s, id) { const i = artInfo(s, id); if (!i.have || !i.can) return false; s.city.res.iron -= i.cost.iron; s.gems -= i.cost.gems; lore(s).art[id]++; W.bump(s); return true; }
  function dropArt(s) { // редкая находка (босс / руины): сначала «Голод Бездны», потом усиление найденных мечей
    if (!lvOf(s, 'void')) return giveArt(s, 'void');
    const have = owned(s); return giveArt(s, have[Math.floor(Math.random() * have.length)].id);
  }

  // ---------- бонусы мечей ----------
  W.modFns = W.modFns || [];
  W.modFns.push((s, m, cd) => {
    const l = lore(s); if (!l) return;
    m.dmg *= 1 + colBonus(s) / 100;
    const a = equipped(s); if (!a) return; const L = lvOf(s, a.id);
    for (const k in a.fx) { const v = fxVal(a, k, L);
      if (k === 'dmg') m.dmg *= 1 + v / 100; else if (k === 'gold') m.gold *= 1 + v / 100; else if (k === 'crit') m.crit += v / 100; else if (k === 'click') m.click *= 1 + v / 100;
      else if (k === 'ally') m.ally *= 1 + v / 100; else if (k === 'boss') m.boss += v; else if (k === 'cd') cd.push(v); else if (k === 'storm') m.storm *= 1 + v / 100; }
  });
  // особые удары
  H.strike = (s, crit) => {
    const a = equipped(s); if (!a || !a.proc) return null; const L = lvOf(s, a.id), p = a.proc, rt = s.rt; let go = false;
    if (p.every) { rt.lc = (rt.lc | 0) + 1; if (rt.lc >= p.every) { rt.lc = 0; go = true; } } else go = Math.random() < p.p;
    return go ? { m: procMult(a, L), name: p.name, col: p.col, id: a.id } : null;
  };
  const prevKill = H.kill;
  H.kill = (s, i) => { prevKill(s, i); if (i.boss && Math.random() < 0.05) dropArt(s); };

  // ---------- жители и задания ----------
  const NPCS = [
    { id: 'gunnar', name: 'Ярл Гуннар', title: 'Правитель', key: 'n_gunnar', x: 189, where: 'у Ратуши' },
    { id: 'einar', name: 'Эйнар', title: 'Скальд', key: 'n_einar', x: 127, where: 'у Таверны' },
    { id: 'bjorn', name: 'Бьёрн', title: 'Кузнец', key: 'n_bjorn', x: 251, where: 'у Кузницы' },
    { id: 'ulf', name: 'Ульф', title: 'Торговец', key: 'n_ulf', x: 313, where: 'на рынке' },
    { id: 'ing', name: 'Ингеборг', title: 'Провидица', key: 'n_ing', x: 65, where: 'у Башни магов' },
    { id: 'shade', name: 'Тень', title: 'Страж Храма', key: 'n_shade', x: 374, where: 'у Храма', ghost: true },
  ];
  const NID = {}; NPCS.forEach((n) => { NID[n.id] = n; });
  const bl = (id, v) => ({ k: 'bld', id, v });
  const REQ = { stage: (v) => ({ k: 'stage', v }), boss: (v) => ({ k: 'boss', v }), kills: (v) => ({ k: 'kills', v }), heroes: (v) => ({ k: 'heroes', v }), art: (v) => ({ k: 'art', v }), bld: bl };
  function reqCur(s, r) {
    switch (r.k) { case 'bld': return W.lvl(s, r.id); case 'stage': return s.maxN + 1; case 'boss': return s.st.bosses | 0; case 'kills': return s.st.kills | 0; case 'heroes': return Object.keys(s.city.heroes).length; case 'art': return owned(s).length; }
    return 0;
  }
  function reqText(r) {
    switch (r.k) { case 'bld': return W.BID[r.id].name + ' ' + r.v + ' ур.'; case 'stage': return 'Дойти до этапа ' + r.v; case 'boss': return 'Победить боссов: ' + r.v; case 'kills': return 'Победить монстров: ' + r.v; case 'heroes': return 'Героев в столице: ' + r.v; case 'art': return 'Зачарованных мечей: ' + r.v; }
    return '';
  }
  const reqs = (s, q) => q.req.map((r) => { const cur = reqCur(s, r); return { t: reqText(r), cur: Math.min(cur, r.v), max: r.v, ok: cur >= r.v }; });
  // награда: g - золото (в ценах текущего этапа), res - материалы (множитель роста), gems, art, frag
  const gsc = (s) => Core.stageInfo(s.maxN).gold, rsc = (s) => 1 + W.lvl(s, 'hall') * 0.5 + s.maxN * 0.1;
  function rewardOf(s, q) {
    const r = q.rw, o = { gold: 0, res: {}, gems: r.gems | 0, art: r.art || null, frag: r.frag || null };
    if (r.g) o.gold = Math.round(gsc(s) * r.g);
    for (const k of ['wood', 'stone', 'iron']) if (r[k]) o.res[k] = Math.round(r[k] * rsc(s));
    return o;
  }
  function rewardLines(o) {
    const L = []; if (o.gold) L.push(F(o.gold) + ' золота'); if (o.gems) L.push(o.gems + ' самоцв.');
    for (const k in o.res) L.push(F(o.res[k]) + ' ' + { wood: 'дерева', stone: 'камня', iron: 'железа' }[k]);
    if (o.frag) for (const id in o.frag) L.push(o.frag[id] + ' осколков: ' + W.HID[id].name.split(' ')[0]);
    if (o.art) L.push('меч «' + AID[o.art].name + '»');
    return L;
  }
  const QS = [
    { id: 'g1', npc: 'gunnar', title: 'Крыша над головой', req: [bl('sawmill', 1), bl('quarry', 1)], rw: { g: 120, gems: 3, wood: 40, stone: 30 },
      o: 'Путник! Фростхольм держится на честном слове и на снегу. Построй Лесопилку и Каменоломню, иначе мы начнём жечь мебель. Мою тоже.',
      w: 'Лесопилка и Каменоломня, помнишь? Руби, тащи, строй. Мебель пока цела, но я нервничаю.',
      r: 'Слышишь стук топоров? Это музыка, друг. Такой город не стыдно оборонять. Держи награду.' },
    { id: 'g2', npc: 'gunnar', pre: 'g1', title: 'Свой отряд', req: [bl('tavern', 1), REQ.heroes(1)], rw: { g: 200, gems: 4, frag: { lira: 10 } },
      o: 'Одному воевать скучно. Построй Таверну и найми Эйрика: он давно просится в бой. Остальных героев найдёшь по осколкам.',
      w: 'Таверна и хоть один нанятый герой. Эйрик уже начистил меч и всем про это рассказал.',
      r: 'Вот это отряд! Лира тоже просится к тебе: меткая, но обидчивая. Берёшь, и спорить не буду.' },
    { id: 'g3', npc: 'gunnar', pre: 'g2', title: 'Зубы вьюги', req: [REQ.boss(3)], rw: { g: 400, gems: 8, iron: 30 },
      o: 'Боссы стоят у ворот каждой земли. Победи троих, и остальные дважды подумают. Ну, может, подумают.',
      w: 'Боссов пока меньше трёх. Они сами не придут... хотя нет, они как раз придут. Подготовься.',
      r: 'Три босса! Мои дозорные теперь спят спокойно. Ну, хотя бы днём. Награда твоя.' },
    { id: 'g4', npc: 'gunnar', pre: 'g3', title: 'Тёмная башня', req: [REQ.stage(30), bl('walls', 3)], rw: { g: 800, gems: 10, art: 'thunder' },
      o: 'На дальнем перевале растёт тёмная башня. Укрепи Стены и дойди до 30-го этапа. В арсенале у меня лежит кое-что на этот случай.',
      w: 'Стены третьего уровня и тридцатый этап. Башня не ждёт, но и ты не спеши умирать.',
      r: 'Дошёл! Вот, держи Громобой. Он старше меня и громче моего тестя. Береги его.' },
    { id: 'g5', npc: 'gunnar', pre: 'g4', title: 'Сердце Зимы', req: [bl('hall', 10), REQ.stage(50), REQ.art(3)], rw: { g: 2000, gems: 25, art: 'heart' },
      o: 'Говорят, где-то бьётся Сердце Зимы. Станешь настоящим градоначальником, соберёшь три зачарованных меча, дойдёшь до 50-го этапа, и оно придёт к тебе само.',
      w: 'Ратуша на 10 уровне, три меча и 50-й этап. Дело большое, но ты же герой.',
      r: 'Ты сделал это. Зима отдаёт тебе своё сердце. Не потеряй, второго не будет.' },
    { id: 'i1', npc: 'ing', title: 'Клинок во льдах', req: [REQ.boss(1)], rw: { g: 150, gems: 2, art: 'frost' },
      o: 'Я видела сон: меч во льду зовёт тебя по имени. Имя, правда, перепутала. Победи первого босса, и он освободится.',
      w: 'Первый босс ещё жив? Тогда и меч ещё во льду. Всё просто, милый.',
      r: 'Слышишь звон? Это Ледяной Клык. Он выбрал тебя. Меня он тоже выбирал, но я отказалась: у меня спина.' },
    { id: 'i2', npc: 'ing', pre: 'i1', title: 'Рассветная руна', req: [bl('forge', 2), REQ.boss(5)], rw: { g: 300, iron: 40, art: 'dawn' },
      o: 'Руна на рассвете проступает на льду. Нужна Кузница, чтобы её отлить, и пяток побеждённых боссов, чтобы она тебя уважала.',
      w: 'Кузница второго уровня и пять боссов. Руна терпелива, в отличие от меня.',
      r: 'Вот и Жало Рассвета. Бьёт точно, но не любит, когда его называют иголкой.' },
    { id: 'i3', npc: 'ing', pre: 'i2', title: 'Око бури', req: [bl('mage', 3), REQ.stage(25)], rw: { g: 600, gems: 6, art: 'eye' },
      o: 'Маленькая буря заперта в хрустале. Вырасти Башню магов и дойди до 25-го этапа, тогда она сама скажет, куда ей лететь.',
      w: 'Башня магов третьего уровня и 25-й этап. Буря скучает, а скучающая буря опаснее.',
      r: 'Око Вьюги открылось. Не заглядывай в него дольше секунды, у меня потом борода три дня гудела. Да, борода.' },
    { id: 'b1', npc: 'bjorn', title: 'Уголь да молот', req: [bl('forge', 2), bl('mine', 1)], rw: { g: 150, gems: 3, iron: 50 },
      o: 'Мне нужен хороший огонь и хорошее железо. Улучши Кузницу, построй рудник, и я покажу, как зачаровывают мечи. Только не мешай, я творю.',
      w: 'Кузница на втором и рудник. Без них я просто громко стучу молотом.',
      r: 'Вот это огонь! Теперь можно работать. Заходи, как будет меч, я его зачарую по-настоящему.' },
    { id: 'b2', npc: 'bjorn', pre: 'b1', title: 'Пепел и сталь', req: [bl('forge', 5), REQ.art(2)], rw: { g: 800, gems: 6, art: 'ember' },
      o: 'Один меч есть, а нужны два: один в бою, второй на замену, когда первый обидится. Прокачай Кузницу до пятого, найди ещё один клинок, и я отдам тебе своё лучшее.',
      w: 'Кузница на пятом и два меча в коллекции. Я жду. Вернее, молчу и стучу.',
      r: 'Клинок Пепла. Ковал его, пока у меня не загорелась борода. Дважды. Носи с гордостью.' },
    { id: 'e1', npc: 'einar', title: 'Песнь о герое', req: [REQ.kills(300)], rw: { g: 200, gems: 4 },
      o: 'Я пишу песню о герое! Не знаю, о каком, но рифма «монстр - костёр» уже готова. Победи триста тварей, чтобы было о чём петь.',
      w: 'Ещё не триста? Я придумал только припев: «Тра-ля-ля, да здравствует щит!» Нужны подвиги.',
      r: 'Триста монстров! Песня готова: «Он шёл, он бил, он снова бил...» Дальше пока сам не знаю. Держи за вдохновение.' },
    { id: 'e2', npc: 'einar', pre: 'e1', title: 'Спор за кружку', req: [bl('tavern', 3), REQ.stage(20)], rw: { g: 500, gems: 5, art: 'gold' },
      o: 'Я поспорил с гномом, что ты дойдёшь до двадцатого этапа. Проиграл ему меч, зато выиграл кружку. Или наоборот. Короче, дойди и подними Таверну!',
      w: 'Таверна третьего и двадцатый этап. Гном ждёт, я уже допиваю...',
      r: 'Дошёл! Гном отдал мне Златожор, лишь бы я замолчал. Забирай. Только не показывай его моей жене, он золотой.' },
    { id: 'u1', npc: 'ulf', title: 'Золотая лихорадка', req: [bl('treasury', 2)], rw: { g: 300, gems: 5, iron: 60 },
      o: 'Слушай, друг, у меня идея на миллион! Построй Казну, и я продам тебе то, что ты сам же мне принесёшь. Гениально, да?',
      w: 'Казна ещё не второго уровня. Деньги любят порядок и толстые стены.',
      r: 'Казна блестит, а я уже считаю прибыль! Вот твоя доля, только не говори налоговой, что я это сказал.' },
    { id: 't1', npc: 'shade', pre: 'tmp', title: 'Корона без короля', req: [REQ.boss(15), REQ.art(4)], rw: { g: 3000, gems: 20, art: 'king' },
      o: 'Я служил королю, которого уже нет. Его меч ждёт достойного. Победи пятнадцать боссов и собери четыре меча, и он твой.',
      w: 'Пятнадцать боссов и четыре меча. Время для меня давно ничего не значит. Для тебя оно значит.',
      r: 'Четыре клинка и пятнадцать побед. Король признал бы тебя. Забирай его меч, мой долг выполнен. Наконец-то.' },
  ];
  const QID = {}; QS.forEach((q) => { QID[q.id] = q; });
  const qst = (s, id) => lore(s).q[id] | 0; // 0 нет, 1 принято, 2 сдано
  const qAvail = (s, q) => !q.pre || (q.pre === 'tmp' ? W.lvl(s, 'temple') >= 1 : qst(s, q.pre) === 2);
  const qAllOk = (s, q) => reqs(s, q).every((r) => r.ok);
  function npcQuest(s, npcId) { return QS.find((q) => q.npc === npcId && qst(s, q.id) !== 2 && qAvail(s, q)) || null; }
  // состояние жителя: offer ! / ready ? / wait / idle
  function npcMode(s, npcId) {
    const q = npcQuest(s, npcId); if (!q) return { mode: 'idle', q: null };
    if (qst(s, q.id) === 0) return { mode: 'offer', q }; return { mode: qAllOk(s, q) ? 'ready' : 'wait', q };
  }
  const npcVisible = (s, n) => n.id !== 'shade' || W.lvl(s, 'temple') >= 1;
  function activeQuests(s) { return QS.filter((q) => qst(s, q.id) === 1); }
  function nextHint(s) { // что показать в «Задании» на экране
    const act = activeQuests(s).sort((a, b) => (qAllOk(s, b) ? 1 : 0) - (qAllOk(s, a) ? 1 : 0))[0]; if (act) return { q: act, ready: qAllOk(s, act) };
    const off = NPCS.map((n) => npcMode(s, n.id)).find((m) => m.mode === 'offer' && npcVisible(s, NID[m.q.npc])); return off ? { q: off.q, offer: true } : null;
  }
  function claim(s, q) {
    if (qst(s, q.id) !== 1 || !qAllOk(s, q)) return null; const o = rewardOf(s, q);
    s.gold += o.gold; s.gems += o.gems; for (const k in o.res) s.city.res[k] += o.res[k]; if (o.frag) for (const id in o.frag) s.city.frag[id] = (s.city.frag[id] | 0) + o.frag[id];
    lore(s).q[q.id] = 2; if (o.art) giveArt(s, o.art); W.bump(s); return o;
  }

  // ---------- разговоры ----------
  const CHAT = {
    gunnar: ['Город стоит, снег идёт, а я устал. Но Фростхольм не сдаётся. Я проверял, он очень упрямый.', 'Дозорные говорят, что на перевале кто-то поёт. Я велел не слушать. Слишком фальшиво.', 'Мой дед говорил: «Если мороз крепчает, строй стены». Мой отец говорил: «Если мороз крепчает, строй баню». Я строю и то, и то.'],
    einar: ['Рифма дня: «меч» и «печь». Печь, конечно, лучше. Но меч кричит громче.', 'Знаешь, чем скальд отличается от героя? Скальд возвращается и рассказывает. Поэтому я осторожен.', 'Я спел драконам колыбельную. Они не уснули, но один заплакал. Считаю успехом.'],
    bjorn: ['Не трогай раскалённое. Я серьёзно. Я по глазам вижу, что ты хотел потрогать.', 'Хороший меч слышно издалека. Плохой слышно ещё дальше, обычно по крикам владельца.', 'Железо терпеливое. В отличие от заказчиков.'],
    ulf: ['Всё, что я продаю, абсолютно законно! Почти. Местами. Ладно, я стою на улице в мороз, давай без вопросов.', 'Хочешь скидку? У меня есть скидка. Она для тех, кто не спрашивает про скидку. Так что молчи и плати.', 'Я продал волку шарф. Он не вернулся. Хороший знак, думаю, ему тепло.'],
    ing: ['Звёзды сегодня шепчут... или это ветер. Или Бьёрн опять стучит. Не разберёшь.', 'Я вижу твоё будущее. Там много снега. Очень много снега. И чай. Это хороший знак.', 'Не бойся Зиму, дитя. Она просто одинокая. Как все, кто холодный снаружи.'],
    shade: ['Ты слышишь шорох? Это не ветер. Хотя, возможно, и ветер.', 'Холод привычнее тепла. Спроси любого мёртвого.', 'Я охраняю этот Храм уже... не помню. Время тут не идёт, но тянется.'],
  };
  const NODES = {};
  const say = (who, t, c) => ({ who, t, c: c || [{ t: 'Понятно' }] });
  const dealNode = (who, t) => say(who, t, [{ t: 'Ещё сделку' , go: 'ulf.deals' }, { t: 'Хватит' }]);
  const hint = ['Золото копится, даже пока тебя нет. А вот сумку придётся разгружать самому.', 'Каждый босс может дать осколки героя. Бей их почаще.', 'Вылазки идут по реальному времени, даже когда игра закрыта.', 'Мечи в «Мечах» можно прокачать железом и самоцветами.', 'Стены добавляют время на босса. Не скупись на камень.', 'Таверна даёт места в отряде. Без неё герои только сидят и пьют.'];
  NODES['ulf.deals'] = { who: 'ulf', t: 'Выбирай, дорогой! Всё честно, как в трёх соснах.', c: [
    { t: 'Мешок железа (3 самоц.)', can: (s) => s.gems >= 3, go: (s) => { s.gems -= 3; const n = Math.round(60 * rsc(s)); s.city.res.iron += n; return dealNode('ulf', 'Держи, ' + F(n) + ' железа. Никто не узнает, откуда оно у меня.'); } },
    { t: 'Кости: ставка 10% золота', can: (s) => s.gold > 50, go: (s) => { const b = Math.floor(s.gold * 0.1); if (Math.random() < 0.48) { s.gold += b; return dealNode('ulf', 'Выпало шесть и шесть! Твоя взяла, держи +' + F(b) + ' золота. Это случайность, это всегда случайность.'); } s.gold -= b; return dealNode('ulf', 'Ох, не повезло. Минус ' + F(b) + ' золота. Кости у меня честные, просто ты невезучий.'); } },
    { t: 'Слух за 1 самоц.', can: (s) => s.gems >= 1, go: (s) => { s.gems -= 1; return dealNode('ulf', 'Слушай: ' + hint[Math.floor(Math.random() * hint.length)]); } },
    { t: 'Уйти' } ] };
  NODES['bjorn.arts'] = { who: 'bjorn', t: 'Принёс клинок? Покажи. Я умею зачаровывать железом и самоцветами. Только не кричи на меня, пока я стучу.', c: [{ t: 'Показать мечи', tab: 'arts' }, { t: 'В другой раз' }] };
  NODES['einar.beer'] = { who: 'einar', t: 'Налить тебе кружку? Всего за пригоршню золота, а я за это спою!', c: [
    { t: 'Угостить скальда', can: (s) => s.gold >= 20 * gsc(s), go: (s) => { const p = Math.round(20 * gsc(s)), l = lore(s), now = Date.now(); s.gold -= p; if (now - (l.beer | 0) > 600000 && Math.random() < 0.5) { l.beer = now; s.gems += 1; return say('einar', 'Хорошая кружка! В благодарность прошептал тебе легенду. Держи самоцвет, нашёл в кармане.', [{ t: 'Спасибо' }]); } l.beer = now; return say('einar', 'Ох! Спасибо! Песня выйдет такая, что даже снег заслушается. Ну, или заглохнет.', [{ t: 'Звучит страшно' }]); } },
    { t: 'Не сейчас' }] };
  function chatNode(s, npcId) {
    const n = NID[npcId], t = CHAT[npcId], c = [];
    if (npcId === 'bjorn') c.push({ t: 'Зачаровать меч', go: 'bjorn.arts' });
    if (npcId === 'ulf') c.push({ t: 'Посмотреть товары', go: 'ulf.deals' });
    if (npcId === 'einar') c.push({ t: 'Угостить кружкой', go: 'einar.beer' });
    c.push({ t: 'Пока' });
    return { who: n.id, t: t[Math.floor(Math.random() * t.length)], c };
  }
  // диалог при нажатии на жителя
  function start(s, npcId) {
    const m = npcMode(s, npcId), n = NID[npcId], q = m.q;
    if (m.mode === 'offer') {
      const o = rewardOf(s, q), lines = rewardLines(o);
      return { who: n.id, t: q.o, quest: q.id, c: [
        { t: 'Возьмусь! (' + q.title + ')', do: (s2) => { lore(s2).q[q.id] = 1; }, go: () => say(n.id, 'Награда: ' + lines.join(', ') + '. Загляни в «Задания», там всё записано.', [{ t: 'Отлично' }]) },
        { t: 'Не сейчас' }] };
    }
    if (m.mode === 'wait') return { who: n.id, t: q.w, c: [{ t: 'Задание: ' + q.title, tab: 'quests' }, { t: 'Пока' }].concat(npcId === 'bjorn' ? [{ t: 'Зачаровать меч', go: 'bjorn.arts' }] : npcId === 'ulf' ? [{ t: 'Товары', go: 'ulf.deals' }] : []) };
    if (m.mode === 'ready') return { who: n.id, t: q.r, c: [{ t: 'Забрать награду', green: 1, go: (s2) => { const o = claim(s2, q); return o ? { who: n.id, t: 'Ты получил: ' + rewardLines(o).join(', ') + '.', c: [{ t: 'Здорово' }] } : null; } }] };
    return chatNode(s, npcId);
  }

  // ---------- сохранение ----------
  const newLore = () => ({ art: {}, eq: null, q: {}, beer: 0 });
  const prevNew = H.newCity, prevLoad = H.loadCity;
  H.newCity = () => { const c = prevNew(); c.lore = newLore(); return c; };
  H.loadCity = (d) => {
    const c = prevLoad(d), l = newLore(), x = d && d.lore; c.lore = l; if (!x || typeof x !== 'object') return c;
    for (const a of ARTS) { const v = x.art && x.art[a.id]; if (Number.isFinite(v) && v >= 1) l.art[a.id] = Math.min(MAXL, v | 0); }
    if (typeof x.eq === 'string' && l.art[x.eq]) l.eq = x.eq; else { const b = ARTS.filter((a) => l.art[a.id]).sort((a, b2) => b2.rar - a.rar)[0]; l.eq = b ? b.id : null; }
    for (const q of QS) { const v = x.q && x.q[q.id]; if (v === 1 || v === 2) l.q[q.id] = v; }
    l.beer = Number.isFinite(x.beer) ? x.beer : 0; return c;
  };
  Core.ACH.push({ id: 'art1', name: 'Зачарованный', desc: 'Получи первый зачарованный меч', gems: 5, ok: (s) => owned(s).length >= 1 },
    { id: 'art5', name: 'Оружейник', desc: 'Собери 5 зачарованных мечей', gems: 15, ok: (s) => owned(s).length >= 5 },
    { id: 'art9', name: 'Коллекционер легенд', desc: 'Собери все 9 мечей', gems: 40, ok: (s) => owned(s).length >= 9 },
    { id: 'artmax', name: 'Мастер зачарования', desc: 'Прокачай меч до 10 уровня', gems: 20, ok: (s) => ARTS.some((a) => lvOf(s, a.id) >= MAXL) },
    { id: 'quest5', name: 'Помощник ярла', desc: 'Выполни 5 заданий', gems: 10, ok: (s) => QS.filter((q) => qst(s, q.id) === 2).length >= 5 });

  // экспедиция «Древние руины» иногда находит меч
  const prevClaim = W.expClaim;
  W.expClaim = function (s, idx) { const x = s.city.exp[idx], r = prevClaim(s, idx); if (r && x && x.k === 'ruins' && Math.random() < 0.12) r.art = dropArt(s); return r; };

  Core.Lore = { ARTS, AID, RARC, MAXL, NPCS, NID, QS, QID, FXN, fxVal, fxStr, procText, artInfo, owned, equipped, lvOf, upCost, colBonus, giveArt, artEquip, artUp, dropArt, reqs, reqCur, rewardOf, rewardLines, npcMode, npcVisible, npcQuest, qst, activeQuests, nextHint, claim, start, NODES, qAllOk };
  if (typeof module !== 'undefined' && module.exports) module.exports = Core.Lore;
})(typeof window !== 'undefined' ? window : globalThis);
