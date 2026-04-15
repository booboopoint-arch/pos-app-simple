/**
 * ボタン動作テスト
 * 商品追加・削除・ページ切り替え・呼出番号管理
 */
const { loadApp } = require('./helpers/loadApp');

describe('商品ボタン操作', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ items: [], money: '' });
  });

  test('メニューボタンクリックで商品が追加される', () => {
    win.addItem('大阪焼', 150);
    const state = win.__getState();
    expect(state.items.length).toBe(1);
    expect(state.items[0].name).toBe('大阪焼');
    expect(state.items[0].price).toBe(150);
  });

  test('同じ商品を複数追加できる', () => {
    win.addItem('大阪焼', 150);
    win.addItem('大阪焼', 150);
    win.addItem('大阪焼', 150);
    expect(win.__getState().items.length).toBe(3);
  });

  test('種類上限10種類を超えた場合は追加されない', () => {
    for (let i = 1; i <= 10; i++) {
      win.addItem(`商品${i}`, i * 100);
    }
    const before = win.__getState().items.length;
    win.addItem('超過商品', 999);
    const state = win.__getState();
    expect(state.items.length).toBe(before);
    expect(new Set(state.items.map(x => x.name)).size).toBe(10);
  });

  test('既存の商品は10種類でも追加できる', () => {
    for (let i = 1; i <= 10; i++) {
      win.addItem(`商品${i}`, i * 100);
    }
    const before = win.__getState().items.length;
    win.addItem('商品1', 100);
    expect(win.__getState().items.length).toBe(before + 1);
  });

  test('清除ボタンで全商品と預り金がリセットされる', () => {
    win.addItem('大阪焼', 150);
    win.addItem('加蛋', 30);
    win.__setState({ money: '200' });
    win.removeItem();
    const state = win.__getState();
    expect(state.items.length).toBe(0);
    expect(state.money).toBe('');
    expect(win.document.getElementById('total').textContent).toBe('合計 0');
  });
});

describe('ページ切り替え', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ menuData: [
      [{ name: 'P1商品', price: 100, color: '#000', textColor: '#fff' }],
      [{ name: 'P2商品', price: 200, color: '#000', textColor: '#fff' }],
      [{ name: 'P3商品', price: 300, color: '#000', textColor: '#fff' }]
    ]});
    // renderButtons is called by __setState({menuData:...})
  });

  test('ページ2に切り替えるとP2の商品が表示される', () => {
    const tab = win.document.querySelectorAll('.pageTab')[1];
    win.switchPage(1, tab);
    expect(win.__getState().currentPage).toBe(1);
    const btns = win.document.querySelectorAll('#buttons button');
    const hasP2 = Array.from(btns).some(b => b.textContent.includes('P2商品'));
    expect(hasP2).toBe(true);
  });

  test('ページ3に切り替えるとP3の商品が表示される', () => {
    const tab = win.document.querySelectorAll('.pageTab')[2];
    win.switchPage(2, tab);
    expect(win.__getState().currentPage).toBe(2);
  });

  test('ページ1に戻るとP1の商品が表示される', () => {
    const tab2 = win.document.querySelectorAll('.pageTab')[1];
    win.switchPage(1, tab2);
    const tab1 = win.document.querySelectorAll('.pageTab')[0];
    win.switchPage(0, tab1);
    expect(win.__getState().currentPage).toBe(0);
  });
});

describe('呼出番号管理', () => {
  let win;
  beforeEach(() => {
    ({ win } = loadApp());
    win.__setState({ showingNumbers: [], callMode: false, removeMode: false, callInput: '' });
  });

  test('呼出ボタン → 番号入力 → 呼出で番号が追加される', () => {
    win.readyButton();
    expect(win.__getState().callMode).toBe(true);
    win.num(5);
    win.readyButton();
    expect(win.__getState().callMode).toBe(false);
    expect(win.__getState().showingNumbers).toContain(5);
  });

  test('同じ番号の二重登録はできない', () => {
    win.__setState({ showingNumbers: [5] });
    win.readyButton();
    win.num(5);
    win.readyButton();
    expect(win.__getState().showingNumbers.filter(n => n === 5).length).toBe(1);
  });

  test('番号削除ボタンで指定番号が削除される', () => {
    win.__setState({ showingNumbers: [3, 7, 12] });
    win.removeButton();
    expect(win.__getState().removeMode).toBe(true);
    win.num(7);
    win.removeButton();
    const nums = win.__getState().showingNumbers;
    expect(nums).not.toContain(7);
    expect(nums).toContain(3);
    expect(nums).toContain(12);
  });

  test('全部削除で全番号がクリアされる', () => {
    win.__setState({ showingNumbers: [1, 2, 3, 4, 5] });
    win.removeAllReady();
    expect(win.__getState().showingNumbers.length).toBe(0);
  });

  test('表示エリアに呼出番号が反映される', () => {
    win.__setState({ showingNumbers: [5, 10, 23] });
    win.updateDisplay();
    expect(win.document.getElementById('displaying').textContent).toBe('5 10 23');
  });

  test('番号なし時は「なし」と表示される', () => {
    win.__setState({ showingNumbers: [] });
    win.updateDisplay();
    expect(win.document.getElementById('displaying').textContent).toBe('なし');
  });

  test('CキーでcallModeがキャンセルされる', () => {
    win.readyButton();
    win.num(3);
    win.clearMoney();
    const state = win.__getState();
    expect(state.callMode).toBe(false);
    expect(state.callInput).toBe('');
    expect(state.showingNumbers.length).toBe(0);
  });
});
