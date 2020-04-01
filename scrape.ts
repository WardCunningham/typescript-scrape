// build and maintain site reference index
// usage: deno --allow-net --allow-read --allow-write scrape.ts sites.fed.wiki.org
// usage: diff <(curl -s http://ward.asia.wiki.org/assets/pages/search-over-the-horizon/scrape.ts) scrape.ts

type site = string
type slug = string
type todo = {site:site, slug?:slug}

let queue:todo[] = []
let doing:site[] = []


// G E T   S T A R T E D

for (let site of Deno.args) {
  queue.push({site})
  doing.push(site)
}

Deno.mkdir('data')

setInterval(work,1000)

async function work() {
  if(queue.length) {
    let job = queue.shift()
    if(job.slug)
      doslug(job.site, job.slug)
    else
      dosite(job.site)
  } else {
    await sleep(3000)
    Deno.exit()
  }
}

async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}


// E A C H   S I T E

async function dosite(site:site) {
  let url = `http://${site}/system/sitemap.json`
  try {
    let sitemap = await fetch(url).then(res=>res.json())
    if (sitemap.length == 0) throw 'empty sitemap'
    await Deno.mkdir(`data/${site}`) // new site
    for (let info of sitemap) {
      await update(info.slug, info.date)
    }
  } catch (e) {
    console.log('site trouble', site, e)
  }

  async function update(slug:slug, date) {
    try {
      let stat = await Deno.lstat(`data/${site}/${slug}.json`)
      if(date > stat.modified*1000) {
        queue.push({site,slug}) // revised page
        await sleep(300)
      }
    } catch (e) {
      queue.push({site,slug}) // new page
      await sleep(300)
    }
  }
}


// E A C H   S L U G

async function doslug(site:site, slug:slug) {
  let url = `http://${site}/${slug}.json`
  try {
    let page = await fetch(url).then(res=>res.json())
    let sites:site[] = []
    for (let item of page.story||[]) {
      if(item.site && !sites.includes(item.site)) {
        sites.push(item.site)
      }
    }
    for (let action of page.journal||[]) {
      if(action.site && !sites.includes(action.site)) {
        sites.push(action.site)
      }
    }
    await save(site, slug, sites)
    for (let maybe of sites) {
      if (!doing.includes(maybe)) {
        queue.push({site:maybe})
        doing.push(maybe)
      }
    }
  } catch (e) {
    console.log('slug trouble', site, slug, e)
  }

  async function save(site:site, slug:slug, sites:site[]) {
    let json = JSON.stringify(sites, null, 2)
    let text = new TextEncoder().encode(json)
    await Deno.writeFile(`data/${site}/${slug}.json`, text);
  }
}

