// Run with: dev-browser --browser f7t-design --headless --timeout 180 run <this-file>
// saveScreenshot/writeFile output goes to ~/.dev-browser/tmp. Copy outputs into evidence/.
const page = await browser.getPage('account');
const screens = ['home','login','register','forgot','reset','verification','confirmation','profile','security','passkeys','authenticator','challenge','recovery','deletion'];
const states = ['default','loading','error','success','empty'];
const selected = new Set(['passkeys:error','reset:error','profile:error','challenge:error','profile:loading','verification:success','deletion:success','passkeys:empty','recovery:empty']);
const evidence = [];
for(const direction of ['a','b']){
  for(const [viewport,size] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]]){
    await page.setViewportSize(size);
    for(const screen of screens){
      for(const state of states){
        const url=`http://127.0.0.1:4187/index-${direction}.html?screen=${screen}&state=${state}`;
        await page.goto(url,{waitUntil:'load'});
        await page.evaluate(()=>document.fonts.ready);
        const metrics=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,height:innerHeight,contentHeight:document.documentElement.scrollHeight,fontLoaded:document.fonts.check('16px "Public Sans"'),heading:document.querySelector('h1')?.textContent,inputsLabeled:[...document.querySelectorAll('input')].every(input=>input.labels?.length>0),buttonsSized:[...document.querySelectorAll('main button')].filter(button=>button.getBoundingClientRect().width>0).every(button=>button.getBoundingClientRect().height>=44)}));
        const row={direction,viewport,screen,state,url,...metrics};
        if(metrics.scrollWidth>metrics.width||!metrics.fontLoaded||!metrics.inputsLabeled||!metrics.buttonsSized) throw new Error(JSON.stringify(row));
        if(state==='default'||selected.has(`${screen}:${state}`)){
          const stem=`f7t-${direction}-${screen}-${state}-${viewport}`;
          row.screenshot=await saveScreenshot(await page.screenshot(),`${stem}.png`);
          if(state==='default') row.fullScreenshot=await saveScreenshot(await page.screenshot({fullPage:true}),`${stem}-full.png`);
        }
        evidence.push(row);
      }
    }
    await page.goto(`http://127.0.0.1:4187/index-${direction}.html?screen=deletion`,{waitUntil:'load'});
    await page.fill('#current-password','demo-only');
    await page.locator('#understand').check();
    await page.click('[data-demo=delete]');
    const dialog=await page.evaluate(()=>({open:document.querySelector('dialog').open,focused:document.activeElement.id}));
    if(!dialog.open||dialog.focused!=='cancel-dialog') throw new Error('Dialog focus failed');
    evidence.push({direction,viewport,screen:'deletion',state:'dialog',...dialog,screenshot:await saveScreenshot(await page.screenshot(),`f7t-${direction}-deletion-dialog-${viewport}.png`)});
    await page.press('#cancel-dialog','Escape');
    if(await page.evaluate(()=>document.querySelector('dialog').open)) throw new Error('Escape did not close dialog');
  }
}
console.log(await writeFile('f7t-account-evidence.json',JSON.stringify(evidence,null,2)));
console.log(JSON.stringify({verifiedViews:evidence.length,screenshots:evidence.filter(row=>row.screenshot).length,fullScreenshots:evidence.filter(row=>row.fullScreenshot).length}));
