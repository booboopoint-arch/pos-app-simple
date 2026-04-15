/**
 * 会計処理テスト
 * 会計実行・売上累積・X点検
 */
const { loadApp } = require('./helpers/loadApp');

describe('会計処理', () => {
  let win, writtenDocs;
  beforeEach(() => {
    ({ win, writtenDocs } = loadApp());
    win.__setState({
      items: [{ name: '大阪焼', price: 150 }, { name: '加蛋', price: 30 }],
      money: '200',
      todayTotal: 0,
      todayDetails: [],
      orderNumber: 1
    });
  });

  test('会計後に注文がリセットされる', () => {
    win.checkout();
    const state = win.__getState();
    expect(state.items.length).toBe(0);
    expect(state.money).toBe('');
  });

  test('会計後に本日売上が加算される', () => {
    win.checkout(); // 150 + 30 = 180
    expect(win.__getState().todayTotal).toBe(180);
  });

  test('複数会計の売上が正しく累積される', () => {
    win.checkout();
    win.__setState({ items: [{ name: '日本焼麺', price: 150 }] });
    win.checkout();
    expect(win.__getState().todayTotal).toBe(330); // 180 + 150
  });

  test('会計後に注文番号がインクリメントされる', () => {
    win.checkout();
    expect(win.__getState().orderNumber).toBe(2);
  });

  test('会計時に売上詳細がlocalStorageに保存される', () => {
    win.checkout();
    const saved = JSON.parse(win.localStorage.getItem('pos_details') || '[]');
    expect(saved.length).toBeGreaterThan(0);
    expect(saved[0].name).toBe('大阪焼');
    expect(parseInt(saved[0].price)).toBe(150);
  });

  test('会計時に合計がlocalStorageに保存される', () => {
    win.checkout();
    const saved = parseInt(win.localStorage.getItem('pos_total') || '0');
    expect(saved).toBe(180);
  });

  test('会計時に印刷ウィンドウが開く', () => {
    win.checkout();
    expect(writtenDocs.length).toBeGreaterThan(0);
  });

  test('会計後に画面がリセットされる（合計0）', () => {
    win.checkout();
    expect(win.document.getElementById('total').textContent).toBe('合計 0');
  });
});

describe('X点検レポート', () => {
  let win, writtenDocs;
  beforeEach(() => {
    ({ win, writtenDocs } = loadApp());
    win.localStorage.setItem('pos_details', JSON.stringify([
      { datetime: '2026/04/10 12:00:00', order: 1, name: '大阪焼', price: 150 },
      { datetime: '2026/04/10 12:00:00', order: 1, name: '加蛋', price: 30 },
      { datetime: '2026/04/10 13:00:00', order: 2, name: '大阪焼', price: 150 },
      { datetime: '2026/04/10 13:00:00', order: 2, name: '日本焼麺', price: 150 }
    ]));
  });

  test('X点検でウィンドウが開く', () => {
    win.xReport();
    expect(writtenDocs.length).toBeGreaterThan(0);
  });

  test('X点検レポートに商品名が含まれる', () => {
    win.xReport();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('大阪焼');
    expect(content).toContain('加蛋');
    expect(content).toContain('日本焼麺');
  });

  test('X点検レポートに売上合計が含まれる', () => {
    win.xReport();
    const content = writtenDocs[0].chunks.join('');
    // 150+30+150+150 = 480
    expect(content).toContain('480');
  });

  test('X点検レポートに注文件数が含まれる', () => {
    win.xReport();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('2 件'); // 注文2件
  });

  test('X点検レポートに消費税が含まれる', () => {
    win.xReport();
    const content = writtenDocs[0].chunks.join('');
    // 480 * 8 / 108 ≒ 35円
    expect(content).toContain('35');
  });
});
