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
    import subprocess
    (out/'original-reviews.html').write_text(page.content())
    rendered=subprocess.check_output(['php',str(root/'render-reviews.php'),str(out/'original-reviews.html'),str(root/'reviews-compiled.php'),'en']).decode()
    page.set_content(rendered,wait_until='networkidle')
    page.add_style_tag(content=(root/'reviews.css').read_text())
    expected=[re.sub(r'^(\\s*)5(?=I (?:bought|express)\\b)',r'\\1',t) for t in originals]
    assert page.locator('.wl-direct-review').count()==3
    assert page.locator('.wl-direct-review .source').all_text_contents()==['Client testimonial']*3
    assert page.locator('.wl-direct-review a[href*="google"]').count()==0
    for locale in ['ru','de','pl']:
        local=subprocess.check_output(['php',str(root/'render-reviews.php'),str(out/'original-reviews.html'),str(root/'reviews-compiled.php'),locale]).decode()
        assert all(name in local for name in ['Helen','Рэйчел','Александр'])
    report['direct-reviews']={'count':3,'names':page.locator('.wl-direct-review .by').all_text_contents(),'dates':page.locator('.wl-direct-review time').evaluate_all('(xs)=>xs.map(x=>x.dateTime)'),'ratings':page.locator('.wl-direct-review .note').all_text_contents(),'source':'direct client testimonials','languages':['en','ru','de','pl']}
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
        assert len(values['cards'])==9,values
        assert all(x['stars']==5 and x['oneRow'] and x['fits'] for x in values['cards']),values
        assert page.locator('.revgridtext-item:not(.wl-direct-review) .text').all_text_contents()==expected
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
    requests=[]
    page.on('request',lambda req: requests.append(req.url) if req.resource_type=='fetch' and '/realty/' in req.url else None)
    page.add_style_tag(content=(root/'catalog-scroll.css').read_text())
    page.add_script_tag(content=(root/'catalog-scroll.js').read_text())
    assert page.locator('.wl-catalog-load').count()==1
    before=page.locator('.re-item[data-card]').count()
    # Simulate one transport failure. No contact forms are submitted.
    blocked={'once':False}
    def fail_once(route):
        if not blocked['once'] and route.request.resource_type=='fetch' and 'plist=2' in route.request.url:
            blocked['once']=True;route.abort()
        else: route.continue_()
    page.route('**/realty/**',fail_once)
    page.locator('.wl-catalog-load').scroll_into_view_if_needed()
    page.wait_for_function('()=>document.querySelector(".wl-catalog-load-button")?.textContent==="Повторить"',timeout=20000)
    assert page.locator('.pagination').is_visible()
    page.locator('.wl-catalog-load-button').click()
    page.wait_for_function('(n)=>document.querySelectorAll(".re-item[data-card]").length>n',arg=before,timeout=30000)
    page.unroute('**/realty/**',fail_once)
    report['catalog-retry']={'ok':True,'before':before,'after':page.locator('.re-item[data-card]').count()}
    card=page.locator('.re-item[data-card]').nth(before)
    title=card.locator('h3').inner_text()
    card.locator('button.req').click()
    assert page.locator('.popup__wrap[data-modal="getPrice"].open').count()==1
    assert page.locator('.popup__wrap[data-modal="getPrice"] input[name="thisRealty"]').input_value()==title
    page.evaluate("()=>{document.querySelectorAll('.popup__wrap.open').forEach(x=>x.classList.remove('open'));document.querySelector('.page-overlay').classList.remove('active')}")
    # Check the real delegated favourite handler without changing public ratings.
    page.route('**/inc/setLike.php',lambda route:route.fulfill(status=200,body='1'))
    heart=card.locator('.heart');heart.click();assert 'liked' in heart.get_attribute('class')
    heart.click();assert 'liked' not in heart.get_attribute('class')
    page.evaluate("()=>{navigator.clipboard.writeText=(text)=>{window.__qaShared=text;return Promise.resolve()}}")
    share=card.locator('.share');share.click()
    assert page.evaluate('window.__qaShared')==share.get_attribute('data-href')
    report['new-card-actions']={'priceList':True,'project':title,'favouriteHandler':True,'shareHandler':True,'formSubmitted':False,'ratingRequestMocked':True}
    history=[page.locator('.re-item[data-card]').count()]
    for _ in range(8):
        if page.locator('.wl-catalog-load-button').is_hidden():break
        count=page.locator('.re-item[data-card]').count()
        page.locator('.wl-catalog-load').scroll_into_view_if_needed()
        page.wait_for_function('(n)=>document.querySelectorAll(".re-item[data-card]").length>n||document.querySelector(".wl-catalog-load-button").hidden',arg=count,timeout=30000)
        history.append(page.locator('.re-item[data-card]').count())
    ids=page.locator('.re-item[data-card]').evaluate_all('(xs)=>xs.map(x=>x.dataset.card)')
    assert len(ids)==len(set(ids))
    assert page.locator('.wl-catalog-load-button').is_hidden()
    from urllib.parse import urlsplit,parse_qs
    assert all(parse_qs(urlsplit(u).query).get('sort')==['price-low'] and parse_qs(urlsplit(u).query).get('price')==['0-1200000'] for u in requests)
    report['catalog-load']={'history':history,'count':len(ids),'unique':len(set(ids)),'requests':requests,'lastPageStopped':True,'status':page.locator('.wl-catalog-load').inner_text()}
    page.screenshot(path=str(out/'catalog.png'))
    # Mobile automatic loading; no manual Show more click.
    page.set_viewport_size({'width':390,'height':844})
    page.goto('https://welltonproperty.com/ru/realty/?sort=price-low&price=0-1200000',wait_until='networkidle',timeout=60000)
    page.add_style_tag(content=(root/'catalog-scroll.css').read_text())
    page.add_script_tag(content=(root/'catalog-scroll.js').read_text())
    before=page.locator('.re-item[data-card]').count()
    page.locator('.wl-catalog-load').scroll_into_view_if_needed()
    page.wait_for_function('(n)=>document.querySelectorAll(".re-item[data-card]").length>n',arg=before,timeout=30000)
    report['catalog-mobile']={'before':before,'after':page.locator('.re-item[data-card]').count(),'overflow':page.evaluate('document.documentElement.scrollWidth>innerWidth')}
    assert not report['catalog-mobile']['overflow']
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('WELLTON_QA_REPORT '+json.dumps(report,ensure_ascii=False))
