/**
 * Z締めテスト
 * Z締め実行・データリセット・CSV保存・パスワードリセット
 */
const { loadApp } = require('./helpers/loadApp');

describe('Z締め実行', () => {
  let win, csvSaved;

  beforeEach(() => {
    csvSaved = [];
    ({ win } = loadApp({
      electronAPI: {
        saveCsv: (filename, csv) => {
          csvSaved.push({ filename, csv });
          return Promise.resolve('/test/' + filename);
        },
        appendCsv: (filename, csv) => {
          csvSaved.push({ filename, csv });
          return Promise.resolve('/test/' + filename);
        },
        appendJournal: () => Promise.resolve('/test/journal.csv')
      }
    }));
    win.__setState({
      todayTotal: 5000,
      todayDetails: [
        { datetime: '2026/04/10 12:00:00', order: 1, name: '大阪焼', price: 150 },
        { datetime: '2026/04/10 12:00:00', order: 1, name: '加蛋', price: 30 }
      ],
      orderNumber: 15
    });
    win.localStorage.removeItem('pos_zdate');
  });

  test('Z締め後に本日売上が0にリセットされる', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    expect(win.__getState().todayTotal).toBe(0);
  });

  test('Z締め後に注文番号が1にリセットされる', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    expect(win.__getState().orderNumber).toBe(1);
  });

  test('Z締め後に本日明細がリセットされる', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    expect(win.__getState().todayDetails.length).toBe(0);
  });

  test('Z締め後にzdateが保存される', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    expect(win.localStorage.getItem('pos_zdate')).toBe(win.getToday());
  });

  test('Z締め後に売上履歴が保存される', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    const history = JSON.parse(win.localStorage.getItem('sales_history') || '[]');
    expect(history.length).toBeGreaterThan(0);
    const last = history[history.length - 1];
    expect(last.sales).toBe(5000);
  });

  test('Z締め後に売上CSVが保存される', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    const salesFile = csvSaved.find(f => f.filename.startsWith('sales_'));
    expect(salesFile).toBeDefined();
    expect(salesFile.csv).toContain('日付');
  });

  test('Z締め後に明細CSVが保存される', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    const detailFile = csvSaved.find(f => f.filename.startsWith('sales_detail_'));
    expect(detailFile).toBeDefined();
  });

  test('Z締め後にlocalStorageの売上がリセットされる', async () => {
    win.executeZ();
    await new Promise(r => setTimeout(r, 100));
    expect(parseInt(win.localStorage.getItem('pos_total') || '0')).toBe(0);
  });
});

describe('Z締め防止（当日2回目）', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.localStorage.setItem('pos_zdate', win.getToday());
  });

  test('当日2回目のZ締めはアラートが出てブロックされる', () => {
    win.zConfirm1();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[0]).toContain('すでに');
  });
});

describe('Z締めリセット（管理者）', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.__setState({ adminPassword: 'testpass123' });
    win.localStorage.setItem('pos_zdate', '2026-04-10');
  });

  test('正しいパスワードでZ締めをリセットできる', () => {
    win.document.getElementById('zResetPassInput').value = 'testpass123';
    win.checkZResetPass();
    expect(win.localStorage.getItem('pos_zdate')).toBeNull();
  });

  test('間違ったパスワードではリセットできない', () => {
    win.document.getElementById('zResetPassInput').value = 'wrongpass';
    win.checkZResetPass();
    expect(win.localStorage.getItem('pos_zdate')).toBe('2026-04-10');
  });

  test('間違ったパスワードでエラーメッセージが表示される', () => {
    win.document.getElementById('zResetPassInput').value = 'wrongpass';
    win.checkZResetPass();
    const errEl = win.document.getElementById('zResetPassError');
    expect(errEl.style.display).not.toBe('none');
  });
});
