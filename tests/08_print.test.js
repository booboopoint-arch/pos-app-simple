/**
 * 印刷・設定テスト
 * レシート印刷・仕入れ履歴印刷・勤怠印刷・メニュー設定
 */
const { loadApp } = require('./helpers/loadApp');

describe('レシート印刷', () => {
  let win, writtenDocs;

  beforeEach(() => {
    ({ win, writtenDocs } = loadApp());
    win.__setState({ shopName: 'テスト八兵衛', receiptWidth: 80 });
  });

  test('printReceipt で印刷ウィンドウが開く', () => {
    win.printReceipt(1, [{ name: '大阪焼', price: 150 }], 150);
    expect(writtenDocs.length).toBeGreaterThan(0);
  });

  test('レシートに店名が含まれる', () => {
    win.printReceipt(1, [{ name: '大阪焼', price: 150 }], 150);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('テスト八兵衛');
  });

  test('レシートに注文番号が含まれる', () => {
    win.printReceipt(42, [{ name: '大阪焼', price: 150 }], 150);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('42');
  });

  test('レシートに商品名が含まれる', () => {
    win.printReceipt(1, [{ name: '明太子美乃滋', price: 200 }], 200);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('明太子美乃滋');
  });

  test('レシートに合計金額が含まれる', () => {
    win.printReceipt(1, [
      { name: '大阪焼', price: 150 },
      { name: '加蛋', price: 30 }
    ], 180);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('180');
  });

  test('レシートに消費税8%が含まれる', () => {
    // 1080円 × 8/108 = 80円
    win.printReceipt(1, [{ name: '大阪焼', price: 1080 }], 1080);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('80');
  });

  test('レシート幅58mmが正しく設定される', () => {
    win.__setState({ receiptWidth: 58 });
    win.printReceipt(1, [{ name: '大阪焼', price: 150 }], 150);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('58mm');
  });

  test('レシート幅80mmが正しく設定される', () => {
    win.__setState({ receiptWidth: 80 });
    win.printReceipt(1, [{ name: '大阪焼', price: 150 }], 150);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('80mm');
  });

  test('お客様控えと店舗控えの両方が含まれる', () => {
    win.printReceipt(1, [{ name: '大阪焼', price: 150 }], 150);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('お客様控え');
    expect(content).toContain('店舗控え');
  });

  test('複数商品のレシートに全商品が含まれる', () => {
    win.printReceipt(1, [
      { name: '大阪焼', price: 150 },
      { name: '日本焼麺', price: 150 },
      { name: '牛肉焼麺', price: 250 }
    ], 550);
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('大阪焼');
    expect(content).toContain('日本焼麺');
    expect(content).toContain('牛肉焼麺');
  });
});

describe('仕入れ履歴印刷', () => {
  let win, writtenDocs;

  beforeEach(() => {
    ({ win, writtenDocs } = loadApp());
    win.__setState({
      shopName: 'テスト店',
      shiireHistory: [
        { date: '2026-04-01', supplier: '業者A', amount: 50000, pay: '現金', memo: '野菜' },
        { date: '2026-04-05', supplier: '業者B', amount: 30000, pay: '掛け', memo: '肉類' }
      ],
      shiireViewMonth: '2026-04'
    });
  });

  test('仕入れ履歴印刷でウィンドウが開く', () => {
    win.printShiireList();
    expect(writtenDocs.length).toBeGreaterThan(0);
  });

  test('仕入れ履歴に業者名が含まれる', () => {
    win.printShiireList();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('業者A');
    expect(content).toContain('業者B');
  });

  test('仕入れ履歴に金額が含まれる', () => {
    win.printShiireList();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('50');
    expect(content).toContain('30');
  });

  test('仕入れ履歴に店名が含まれる', () => {
    win.printShiireList();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('テスト店');
  });
});

describe('勤怠記録印刷', () => {
  let win, writtenDocs;

  beforeEach(() => {
    ({ win, writtenDocs } = loadApp());
    win.__setState({
      shopName: 'テスト店',
      adminViewStaff: '田中',
      adminViewMonth: '2026-04',
      tcRecords: [
        { staff: '田中', date: '2026-04-01', time: '09:00', type: '出勤' },
        { staff: '田中', date: '2026-04-01', time: '18:00', type: '退勤' }
      ]
    });
  });

  test('勤怠記録印刷でウィンドウが開く', () => {
    win.printAdminTc();
    expect(writtenDocs.length).toBeGreaterThan(0);
  });

  test('勤怠記録にスタッフ名が含まれる', () => {
    win.printAdminTc();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('田中');
  });

  test('勤怠記録に出退勤時刻が含まれる', () => {
    win.printAdminTc();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('09:00');
    expect(content).toContain('18:00');
  });

  test('勤怠記録に合計勤務時間が含まれる', () => {
    win.printAdminTc();
    const content = writtenDocs[0].chunks.join('');
    expect(content).toContain('9h'); // 9時間
  });
});

describe('設定・メニュー編集', () => {
  let win, alerts;

  beforeEach(() => {
    ({ win, alerts } = loadApp());
    win.__setState({ editData: JSON.parse(JSON.stringify(win.__getState().menuData)), editPage: 0 });
  });

  test('商品を追加できる', () => {
    const before = win.__getState().editData[0].length;
    win.addEditItem();
    expect(win.__getState().editData[0].length).toBe(before + 1);
  });

  test('1ページ最大12個まで', () => {
    const full = Array.from({ length: 12 }, (_, i) => ({
      name: `商品${i + 1}`, price: 100, color: '#000', textColor: '#fff'
    }));
    const editData = win.__getState().editData;
    editData[0] = full;
    win.__setState({ editData });
    win.addEditItem();
    expect(win.__getState().editData[0].length).toBe(12);
    expect(alerts.some(a => a.includes('12個'))).toBe(true);
  });

  test('商品を削除できる', () => {
    const before = win.__getState().editData[0].length;
    win.deleteItem(0);
    expect(win.__getState().editData[0].length).toBe(before - 1);
  });

  test('商品の順番を入れ替えできる', () => {
    const editData = win.__getState().editData;
    const first = editData[0][0].name;
    const second = editData[0][1].name;
    win.moveItem(0, 1); // 先頭を1つ下へ
    const updated = win.__getState().editData;
    expect(updated[0][0].name).toBe(second);
    expect(updated[0][1].name).toBe(first);
  });

  test('先頭アイテムは上に移動できない', () => {
    const snapshot = JSON.stringify(win.__getState().editData[0]);
    win.moveItem(0, -1); // 先頭を上に → 何もしない
    expect(JSON.stringify(win.__getState().editData[0])).toBe(snapshot);
  });

  test('設定保存で店名が反映される', () => {
    win.document.getElementById('shopNameInput').value = '新しい店名';
    win.saveEdit();
    expect(win.__getState().shopName).toBe('新しい店名');
    expect(win.localStorage.getItem('pos_shopname')).toBe('新しい店名');
  });

  test('設定保存でメニューが反映される', () => {
    const editData = win.__getState().editData;
    editData[0][0] = { name: '変更商品', price: 999, color: '#ff0000', textColor: '#ffffff' };
    win.__setState({ editData });
    win.saveEdit();
    const menuData = win.__getState().menuData;
    expect(menuData[0][0].name).toBe('変更商品');
    expect(menuData[0][0].price).toBe(999);
  });

  test('レシート幅58mmを設定できる', () => {
    win.setReceiptWidth(58);
    expect(win.__getState().receiptWidth).toBe(58);
    expect(parseInt(win.localStorage.getItem('pos_receipt_width'))).toBe(58);
  });

  test('レシート幅80mmを設定できる', () => {
    win.setReceiptWidth(80);
    expect(win.__getState().receiptWidth).toBe(80);
    expect(parseInt(win.localStorage.getItem('pos_receipt_width'))).toBe(80);
  });

  test('管理者パスワードを設定できる', () => {
    win.document.getElementById('adminPassSetting').value = 'newpass456';
    win.saveAdminPass();
    expect(win.__getState().adminPassword).toBe('newpass456');
    expect(win.localStorage.getItem('pos_admin_pass')).toBe('newpass456');
  });

  test('空パスワードは設定できない', () => {
    const original = win.__getState().adminPassword;
    win.document.getElementById('adminPassSetting').value = '';
    win.saveAdminPass();
    expect(win.__getState().adminPassword).toBe(original);
    expect(alerts.some(a => a.includes('パスワードを入力'))).toBe(true);
  });
});
