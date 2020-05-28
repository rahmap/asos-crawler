const Apify = require('apify')

const {
  utils: {
    log
  }
} = Apify

const products = []

Apify.main(async () => {
  const inputArr = await Apify.getInput('MYINPUT')

  if (!inputArr || !inputArr.length) throw new Error('Invalid input, must be a JSON object with the "url" field!')

  const listName = Date.now().toString()
  const requestList = await Apify.openRequestList(listName, inputArr)

  const crawler = new Apify.PuppeteerCrawler({
    requestList,
    handlePageFunction: async ({
      request,
      page
    }) => {
      console.log(`Processing ${request.url}...`)
      await Apify.utils.puppeteer.infiniteScroll(page, {
        timeoutSecs: 0,
        waitForSecs: 8
      }).then(async function () {
        const title = (await page.$eval('.css-1bjwylw', el => el.textContent)).trim() //class judul produk
        const results = {
          url: request.url,
          title,
        }

        products.push(results)

        await Apify.setValue('OUTPUT', products) // save to json

        return results
      })

    },

    handleFailedRequestFunction: async ({
      request
    }) => {
      console.log(`Request ${request.url} failed too many times`)
      await Apify.pushData({
        '#debug': Apify.utils.createRequestDebugInfo(request)
      })
    }
  })

  log.info('Starting the crawl.')
  await crawler.run()
  log.info('Crawl finished.')
})