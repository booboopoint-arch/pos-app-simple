/**
 * 計算系テスト
 * 釣銭計算・合計計算・テンキー・注文番号管理
 */
const { loadApp } = require('./helpers/loadApp');

describe('釣銭計算', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ items: [], money: '' });
  });

  test('正確な釣銭を計算する（合計200円・500円支払い）', () => {
    win.__setState({ items: [{ name: '大阪焼', price: 150 }, { name: '加蛋', price: 30 }, { name: '加麺', price: 20 }] });
    win.__setState({ money: '500' });
    expect(win.document.getElementById('total').textContent).toBe('合計 200');
    expect(win.document.getElementById('change').textContent).toBe('お釣り 300');
  });

  test('ちょうど払いはお釣り0', () => {
    win.__setState({ items: [{ name: '大阪焼', price: 150 }] });
    win.__setState({ money: '150' });
    expect(win.document.getElementById('change').textContent).toBe('お釣り 0');
  });

  test('預り金不足でもお釣りは0（マイナスにならない）', () => {
    win.__setState({ items: [{ name: '大阪焼', price: 150 }] });
    win.__setState({ money: '100' });
    expect(win.document.getElementById('change').textContent).toBe('お釣り 0');
  });

  test('注文なし・預り金なしは合計0・お釣り0', () => {
    win.__setState({ items: [], money: '' });
    expect(win.document.getElementById('total').textContent).toBe('合計 0');
    expect(win.document.getElementById('change').textContent).toBe('お釣り 0');
  });

  test('高額支払いの釣銭計算（10000円札）', () => {
    win.__setState({ items: [{ name: '大阪焼', price: 150 }] });
    win.__setState({ money: '10000' });
    expect(win.document.getElementById('change').textContent).toBe('お釣り 9850');
  });
});

describe('合計計算', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ items: [], money: '' });
  });

  test('複数商品の合計が正しい', () => {
    win.__setState({ items: [
      { name: '大阪焼', price: 150 },
      { name: '加蛋', price: 30 },
      { name: '加起司', price: 30 }
    ]});
    expect(win.document.getElementById('total').textContent).toBe('合計 210');
  });

  test('同じ商品を複数追加した場合グループ表示される', () => {
    win.addItem('大阪焼', 150);
    win.addItem('大阪焼', 150);
    win.addItem('大阪焼', 150);
    const listHtml = win.document.getElementById('list').innerHTML;
    expect(listHtml).toContain('×3');
    expect(listHtml).toContain('450');
  });

  test('異なる商品はそれぞれ表示される', () => {
    win.addItem('大阪焼', 150);
    win.addItem('日本焼麺', 150);
    const listHtml = win.document.getElementById('list').innerHTML;
    expect(listHtml).toContain('大阪焼');
    expect(listHtml).toContain('日本焼麺');
  });
});

describe('テンキー入力', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ items: [], money: '' });
  });

  test('数字キーで預り金が入力される', () => {
    win.num(1); win.num(0); win.num(0);
    expect(win.document.getElementById('money').textContent).toBe('預り金 100');
  });

  test('00キーが正しく動作する', () => {
    win.num(1); win.num00();
    expect(win.document.getElementById('money').textContent).toBe('預り金 100');
  });

  test('Cキーで預り金がリセットされる', () => {
    win.num(5); win.num(0); win.num(0);
    win.clearMoney();
    expect(win.document.getElementById('money').textContent).toBe('預り金 0');
  });

  test('呼出モード中のキー入力は番号入力になる', () => {
    win.readyButton(); // callMode ON
    win.num(1); win.num(2);
    // callInputは変わる、moneyは変わらない
    expect(win.document.getElementById('callInputDisplay').textContent).toContain('12');
    expect(win.document.getElementById('money').textContent).toBe('預り金 0');
  });
});

describe('注文番号管理', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ orderNumber: 1 });
  });

  test('最初の注文番号は1', () => {
    const n = win.getAndIncrementOrderNumber();
    expect(n).toBe(1);
  });

  test('注文ごとにインクリメントされる', () => {
    win.getAndIncrementOrderNumber();
    const n = win.getAndIncrementOrderNumber();
    expect(n).toBe(2);
  });

  test('99を超えると1に戻る（ループ）', () => {
    win.__setState({ orderNumber: 99 });
    const n99 = win.getAndIncrementOrderNumber();
    expect(n99).toBe(99);
    const n1 = win.getAndIncrementOrderNumber();
    expect(n1).toBe(1);
  });

  test('注文番号がlocalStorageに保存される', () => {
    win.__setState({ orderNumber: 5 });
    win.getAndIncrementOrderNumber();
    expect(parseInt(win.localStorage.getItem('orderNumber'))).toBe(6);
  });
});
