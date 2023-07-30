import puppeteer from "puppeteer-core"

class Puppeteer {
    path
    browser

    constructor(path) {
        this.path = path
    }
    
    async launch() {
        this.browser = await puppeteer.launch({
            headless: true,
            executablePath: this.path,
        })
    }

    async draw(js) {
        const page = await this.browser.newPage()

        await page.setViewport({ width: 1920, height: 1080 })
        await page.goto('file:///C:\\Users\\vince\\OneDrive\\Bureau\\Dev\\Projets\\procedural-tree\\front\\views\\generator.html')

        // Dessiner un carré rouge sur le canevas (position x=100, y=100, largeur=100, hauteur=100)
        await page.evaluate(js)

        // Prendre une capture d'écran du canevas
        const imageBuffer = await page.screenshot({ encoding: 'binary', omitBackground: true })

        return imageBuffer
    }
}

export const browser = new Puppeteer('C:\\Program Files (x86)\\chrome-win\\chrome.exe')