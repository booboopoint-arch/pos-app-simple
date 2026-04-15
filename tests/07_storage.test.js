/**
 * データ保存テスト
 * CSV変換・メニュー保存・日付処理・仕入れ管理・バックアップ
 */
const { loadApp } = require('./helpers/loadApp');

describe('CSVフィールド変換', () => {
  let win;
  beforeAll(() => {
    ({ win } = loadApp());
  });

  test('通常文字列はダブルクォートで囲まれる', () => {
    expect(win.csvField('大阪焼')).toBe('"大阪焼"');
  });

  test('ダブルクォートは二重エスケープされる', () => {
    expect(win.csvField('テスト"データ')).toBe('"テスト""データ"');
  });

  test('数値は文字列化される', () => {
    expect(win.csvField(150)).toBe('"150"');
  });

  test('nullは空文字になる', () => {
    expect(win.csvField(null)).toBe('""');
  });

  test('undefinedは空文字になる', () => {
    expect(win.csvField(undefined)).toBe('""');
  });

  test('カンマを含む値が正しく処理される', () => {
    expect(win.csvField('A,B,C')).toBe('"A,B,C"');
  });

  test('改行を含む値が正しく処理される', () => {
    expect(win.csvField('A\nB')).toBe('"A\nB"');
  });
});

describe('メニューデータ保存・読み込み', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.localStorage.clear();
  });

  test('メニューをlocalStorageに保存できる', () => {
    win.__setState({ menuData: [
      [{ name: 'テスト商品', price: 999, color: '#ff0000', textColor: '#ffffff' }],
      [], []
    ]});
    win.saveMenu();
    const saved = JSON.parse(win.localStorage.getItem('pos_menu'));
    expect(saved[0][0].name).toBe('テスト商品');
    expect(saved[0][0].price).toBe(999);
  });

  test('localStorageからメニューを読み込める', () => {
    const testMenu = [
      [{ name: 'カスタム商品', price: 500, color: '#000000', textColor: '#ffffff' }],
      [], []
    ];
    win.localStorage.setItem('pos_menu', JSON.stringify(testMenu));
    const loaded = win.loadMenu();
    expect(loaded[0][0].name).toBe('カスタム商品');
    expect(loaded[0][0].price).toBe(500);
  });

  test('localStorageが空の場合はデフォルトメニューを返す', () => {
    const loaded = win.loadMenu();
    expect(loaded[0].length).toBeGreaterThan(0);
    expect(loaded[0][0].name).toBe('大阪焼'); // デフォルト先頭商品
  });

  test('localStorageが壊れている場合はデフォルトメニューを返す', () => {
    win.localStorage.setItem('pos_menu', 'invalid json{{{');
    const loaded = win.loadMenu();
    expect(loaded[0][0].name).toBe('大阪焼');
  });
});

describe('日付処理', () => {
  let win;
  beforeAll(() => {
    ({ win } = loadApp());
  });

  test('getToday() が YYYY-MM-DD 形式を返す', () => {
    const today = win.getToday();
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('深夜3時前は前日扱い', () => {
    const RealDate = win.Date;
    // 2026-04-10 02:59 → 前日の2026-04-09 扱い
    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(2026, 3, 10, 2, 59, 0); // month is 0-indexed → April
        } else {
          super(...args);
        }
      }
    }
    win.Date = MockDate;
    const today = win.getToday();
    expect(today).toBe('2026-04-09');
    win.Date = RealDate;
  });

  test('深夜3時以降は当日扱い', () => {
    const RealDate = win.Date;
    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(2026, 3, 10, 3, 0, 0); // 3:00 AM
        } else {
          super(...args);
        }
      }
    }
    win.Date = MockDate;
    const today = win.getToday();
    expect(today).toBe('2026-04-10');
    win.Date = RealDate;
  });
});

describe('仕入れ管理', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.__setState({
      suppliers: ['業者A', '業者B'],
      shiireHistory: [],
      selectedSupplier: '業者A',
      selectedPay: '現金'
    });
  });

  test('仕入れを登録できる', () => {
    win.document.getElementById('shiireDate').value = '2026-04-10';
    win.document.getElementById('shiireAmount').value = '50000';
    win.document.getElementById('shiireMemo').value = 'テスト仕入れ';
    win.saveShiire();
    const history = win.__getState().shiireHistory;
    expect(history.length).toBe(1);
    expect(history[0].supplier).toBe('業者A');
    expect(history[0].amount).toBe(50000);
    expect(history[0].pay).toBe('現金');
  });

  test('仕入れ先未選択では登録できない', () => {
    win.__setState({ selectedSupplier: '' });
    win.document.getElementById('shiireAmount').value = '10000';
    win.saveShiire();
    expect(win.__getState().shiireHistory.length).toBe(0);
    expect(alerts.some(a => a.includes('仕入れ先を選択'))).toBe(true);
  });

  test('金額未入力では登録できない', () => {
    win.document.getElementById('shiireAmount').value = '';
    win.saveShiire();
    expect(win.__getState().shiireHistory.length).toBe(0);
    expect(alerts.some(a => a.includes('金額を入力'))).toBe(true);
  });

  test('仕入れ履歴がlocalStorageに保存される', () => {
    win.document.getElementById('shiireDate').value = '2026-04-10';
    win.document.getElementById('shiireAmount').value = '30000';
    win.saveShiire();
    const saved = JSON.parse(win.localStorage.getItem('pos_shiire') || '[]');
    expect(saved.length).toBeGreaterThan(0);
  });

  test('仕入れ先を追加できる', () => {
    win.__setState({ suppliers: [] });
    win.document.getElementById('supplierInput').value = '新業者C';
    win.addSupplier();
    expect(win.__getState().suppliers).toContain('新業者C');
  });

  test('重複した仕入れ先は登録できない', () => {
    win.document.getElementById('supplierInput').value = '業者A';
    win.addSupplier();
    expect(win.__getState().suppliers.filter(s => s === '業者A').length).toBe(1);
  });

  test('仕入れ先を削除できる', () => {
    win.__setState({ suppliers: ['業者X'] });
    win.deleteSupplier(0);
    expect(win.__getState().suppliers.length).toBe(0);
  });

  test('仕入れ履歴を月別に絞り込める', () => {
    win.__setState({
      shiireHistory: [
        { date: '2026-03-15', supplier: '業者A', amount: 10000, pay: '現金', memo: '' },
        { date: '2026-04-10', supplier: '業者B', amount: 20000, pay: '掛け', memo: '' }
      ],
      shiireViewMonth: '2026-04'
    });
    win.renderShiireList();
    const body = win.document.getElementById('shiireListBody').innerHTML;
    expect(body).toContain('業者B');
    expect(body).not.toContain('業者A');
  });
});

describe('バックアップ・復元', () => {
  let win, savedBackups;

  beforeEach(() => {
    savedBackups = [];
    ({ win } = loadApp({
      electronAPI: {
        saveCsv: () => Promise.resolve('/test/path'),
        appendCsv: () => Promise.resolve('/test/path'),
        appendJournal: () => Promise.resolve('/test/journal'),
        selectFolder: () => Promise.resolve('/test/folder'),
        saveBackup: (folderPath, filename, json) => {
          savedBackups.push({ folderPath, filename, json });
          return Promise.resolve(true);
        },
        shutdown: () => {}
      }
    }));
    win.__setState({ backupPath: '/test/backup' });
    win.localStorage.setItem('pos_shopname', 'テスト店舗');
    win.localStorage.setItem('pos_menu', JSON.stringify([[{ name: 'テスト商品', price: 100 }], [], []]));
  });

  test('バックアップにlocalStorageの全データが含まれる', async () => {
    win.doBackup();
    await new Promise(r => setTimeout(r, 100));
    expect(savedBackups.length).toBeGreaterThan(0);
    const data = JSON.parse(savedBackups[0].json);
    expect(data['pos_shopname']).toBe('テスト店舗');
    expect(data['pos_menu']).toBeDefined();
  });

  test('バックアップファイル名に年月が含まれる', async () => {
    win.doBackup();
    await new Promise(r => setTimeout(r, 100));
    expect(savedBackups[0].filename).toMatch(/POSBackup_\d{4}-\d{2}\.json/);
  });

  test('保存先未設定でバックアップ実行するとアラートが出る', () => {
    const { win: w, alerts: a } = loadApp();
    w.__setState({ backupPath: '' });
    w.doBackup();
    expect(a.some(msg => msg.includes('保存先'))).toBe(true);
  });
});
