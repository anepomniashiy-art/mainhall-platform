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
    expected=[re.sub(r'^(\s*)5(?=I (?:bought|express)\b)',r'\1',t) for t in originals]
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
    browser.close()
(out/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('WELLTON_QA_REPORT '+json.dumps(report,ensure_ascii=False))
