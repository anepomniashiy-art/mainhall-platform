import json,os,re
from pathlib import Path
from playwright.sync_api import sync_playwright
root=Path('.wellton-maintenance')
out=Path('/tmp/wellton-qa');out.mkdir(exist_ok=True)
report={}
with sync_playwright() as p:
    browser=p.chromium.launch()
    page=browser.new_page(viewport={'width':1440,'height':1000},device_scale_factor=1)
    page.goto('https://welltonproperty.com/reviews/',wait_until='networkidle',timeout=60000)
    originals=page.locator('.revgridtext-item .text').all_text_contents()
    page.add_style_tag(content=(root/'reviews.css').read_text())
    page.evaluate("""() => {
      const grid=document.querySelector('.revgridtext');
      const strip=document.createElement('div');strip.className='wl-review-platforms';
      for(const name of ['Yelp','Trustpilot','Google','Tripadvisor']){
        const item=document.createElement(name==='Google'?'a':'div');item.className='wl-review-platform';
        const img=document.createElement('img');img.src='/wp-content/uploads/2024/09/brand-'+name.toLowerCase()+'.png';img.alt=name;
        item.append(img);strip.append(item);
      }
      grid.before(strip);
    }""")
    for width in [1440,1024,390,320]:
        page.set_viewport_size({'width':width,'height':1000})
        page.locator('.revgridtext').scroll_into_view_if_needed()
        page.wait_for_timeout(600)
        values=page.evaluate("""() => ({
          width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
          cards:Array.from(document.querySelectorAll('.revgridtext-item')).map(c=>{
            const stars=Array.from(c.querySelectorAll('.notebar .star')).map(s=>s.getBoundingClientRect());
            const box=c.getBoundingClientRect(),bar=c.querySelector('.notebar').getBoundingClientRect();
            return {stars:stars.length,oneRow:stars.every(s=>Math.abs(s.y-stars[0].y)<1),fits:bar.right<=box.right,
              font:getComputedStyle(c.querySelector('.text')).fontSize};
          }),
          logos:Array.from(document.querySelectorAll('.wl-review-platform img')).map(i=>({alt:i.alt,width:i.naturalWidth,height:i.naturalHeight,display:i.getBoundingClientRect().width}))
        })""")
        report['reviews-'+str(width)]=values
        assert len(values['cards'])==6,values
        assert all(x['stars']==5 and x['oneRow'] and x['fits'] for x in values['cards']),values
        assert page.locator('.revgridtext-item .text').all_text_contents()==originals
        page.screenshot(path=str(out/('reviews-'+str(width)+'.png')))
        if width in [1440,390]:
            import base64
            print('QA_IMAGE_'+str(width)+' '+base64.b64encode(page.screenshot(type='jpeg',quality=70)).decode())
    page.set_viewport_size({'width':1440,'height':1000})
    page.goto('https://welltonproperty.com/ru/realty/?sort=price-low&price=0-1200000',wait_until='networkidle',timeout=60000)
    report['catalog-before']=page.evaluate("""() => ({
       count:document.querySelectorAll('.re-item[data-card]').length,
       cards:Array.from(document.querySelectorAll('.re-item[data-card]')).map(n=>n.dataset.card),
       pager:Array.from(document.querySelectorAll('a,button,span,li')).filter(a=>/^[1-9]$/.test(a.textContent.trim())).slice(-25).map(a=>({html:a.outerHTML,parent:a.parentElement.outerHTML.slice(0,4000)})),
       first:document.querySelector('.re-item')?.outerHTML.slice(0,6000),
       events:typeof jQuery==='function'?Array.from(document.querySelectorAll('.re-item:first-child .heart,.re-item:first-child .req,.re-item:first-child .share')).map(n=>({
         html:n.outerHTML,events:Object.entries(jQuery._data(n,'events')||{}).map(([type,hs])=>({type,handlers:hs.map(h=>String(h.handler).slice(0,1800))}))
       })):[],
       delegates:typeof jQuery==='function'?Object.entries(jQuery._data(document,'events')||{}).map(([type,hs])=>({type,handlers:hs.filter(h=>h.selector).map(h=>({selector:h.selector,handler:String(h.handler).slice(0,1500)}))})):[]
    })""")
    page.add_style_tag(content=(root/'catalog-scroll.css').read_text())
    page.add_script_tag(content=(root/'catalog-scroll.js').read_text())
    if page.locator('.wl-catalog-load').count():
        before=page.locator('.re-item[data-card]').count()
        page.locator('.wl-catalog-load').scroll_into_view_if_needed()
        try:
            page.wait_for_function('(n)=>document.querySelectorAll(".re-item[data-card]").length>n',arg=before,timeout=30000)
            report['catalog-load']={'before':before,'after':page.locator('.re-item[data-card]').count(),'status':page.locator('.wl-catalog-load').inner_text()}
        except Exception as exc:
            report['catalog-load']={'before':before,'after':page.locator('.re-item[data-card]').count(),'error':type(exc).__name__,'status':page.locator('.wl-catalog-load').inner_text()}
    else:
        report['catalog-load']={'error':'Enhancement did not recognize catalogue or pagination'}
    page.screenshot(path=str(out/'catalog.png'))
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('WELLTON_QA_REPORT '+json.dumps(report,ensure_ascii=False))
