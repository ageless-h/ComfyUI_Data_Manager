const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();

    // 监听控制台错误
    const errors = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));

    // 打开 ComfyUI 页面
    console.log('正在打开 ComfyUI...');
    await page.goto('http://127.0.0.1:8188', { waitUntil: 'networkidle', timeout: 30000 });

    // 点击打开 Data Manager
    console.log('点击 Data Manager...');
    await page.click('text=Data Manager');
    await page.waitForTimeout(1000);

    // 点击切换到网格视图
    console.log('查找网格视图按钮...');
    const gridBtn = await page.locator('button[title="网格视图"]');
    if (await gridBtn.count() > 0) {
        await gridBtn.click();
        await page.waitForTimeout(500);
        console.log('切换到网格视图');
    }

    // 检查网格项
    const gridItems = await page.locator('.dm-grid-item').count();
    console.log('网格项数量:', gridItems);

    // 检查首格内容
    if (gridItems > 0) {
        const firstItem = await page.locator('.dm-grid-item').first();
        const firstText = await firstItem.textContent();
        console.log('首格内容:', firstText.replace(/\s+/g, ' ').trim());
    }

    if (errors.length > 0) {
        console.log('控制台错误:', errors);
    } else {
        console.log('无控制台错误');
    }

    await browser.close();
    console.log('测试完成');
})();
