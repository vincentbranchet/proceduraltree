import { config } from "./config.js"
import { colorWithVariation, getCurve, getThickness } from "./helpers.js"

export class App {
    constructor() {
        this.pipe = []
        this.animationPipe = []
        this.blueprint = []
        this.drawn = { value: 0 }
        this.windStrength = 0.5
        this.windDirection = 1
        this.windStep = this.windStrength / 10
        this.windRange = {low: 0 + ((1 - this.windStrength) / 2), high: 1 - ((1 - this.windStrength) / 2)}
        this.angleVariation = Math.random()
        this.lastFrameTime = null
        this.buildId = 0
        this.fps = 12 // TODO : browser crashes close to 24
    }

    start() {
        this.renderCanvas()
        this.fillBackground()
        this.fillInfoPanel()
        this.buildBlueprint()
        this.animate()
    }

    renderCanvas() {
        this.canvas = document.createElement('canvas')
        this.canvas.width = config.canvasWidth
        this.canvas.height = config.canvasHeight
        this.container = document.getElementById('main-container')
        this.container.appendChild(this.canvas)

        this.root = { x: this.canvas.width / 2, y: this.canvas.height }
    }

    fillBackground() {
        this.context = this.canvas.getContext('2d')
        this.context.fillStyle = config.skyColor
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
        this.container.style.backgroundColor = config.skyColor
    }

    fillInfoPanel() {
        this.info = document.getElementById('info-text')
        this.info.innerHTML = `Cet arbre s'appelle ${config.seed.name}. Il pousse depuis ${config.age} jours.\n
Pour le partager et le retrouver facilement, copiez le lien de cette page depuis la barre d'adresse de votre navigateur, ou ci-dessous :\n
${window.location.href} \n\n
L'accès à cet arbre est libre et gratuit pour tout le monde, et le restera pour toujours.`
    }

    buildBlueprint() {
        this.pipe.push({
            id: this.buildId,
            prevId: 0,
            x: this.root.x,
            y: this.root.y,
            angle: -Math.PI / 2,
            depth: 0,
            thickness: config.branchThickness,
            length: 0,
        })

        while (this.drawn.value <= config.age) {
            const current = this.pipe[0]

            const branch = this.buildBranch(current)
            this.blueprint.push(branch)

            this.getNextInPipe(branch)

            this.drawn.value++
            this.pipe.shift()
        }
    }

    buildBranch({ id, prevId, x, y, angle, depth, thickness }) {
        const { nextX, nextY } = this.nextCoordinates(x, y, angle)
        const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2))
        const leafDice = config.seedRandom(x) - (depth - config.maxDepth) / 10

        return {
            id: id,
            prevId: prevId,
            depth: depth,
            startNode: { x: x, y: y },
            endNode: { x: nextX, y: nextY },
            color: colorWithVariation(config.branchColor, config.branchColorVariation, nextX, config.seedRandom),
            length: length,
            thickness: thickness,
            angle: angle,
            leaf: { dice: leafDice, ellipse: config.seedRandom(y) * 360, color: colorWithVariation(config.leafColor, config.leafColorVariation, x, config.seedRandom) },
        }
    }

    nextCoordinates(x, y, angle) {
        const nextX = x + Math.cos(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength))
        const nextY = y + Math.sin(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength))

        return { nextX: nextX, nextY: nextY }
    }

    getNextInPipe(branch) {
        // TODO : check attended behavior
        const d1 = getCurve(branch.endNode.x, branch.endNode.y, branch.angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom)
        const d2 = getCurve(branch.endNode.x + 1, branch.endNode.y + 1, branch.angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom)

        // Epaisseur des deux branches du noeud suivant
        const thickness1 = getThickness(branch.endNode.y, branch.thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom)
        const thickness2 = getThickness(branch.endNode.y, branch.thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom)

        this.pipe = this.pipe.concat(this.getNextInBlueprint(branch, d1, d2, thickness1, thickness2))
    }

    getNextInBlueprint(branch, d1, d2, thickness1, thickness2) {
        this.buildId++
        const firstNext = { id: this.buildId, prevId: branch.id, x: branch.endNode.x, y: branch.endNode.y, angle: branch.angle + config.branchAngleVariation, length: branch.length, depth: branch.depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y, leafDice: branch.leaf.dice }
        this.buildId++
        const secondNext = { id: this.buildId, prevId: branch.id, x: branch.endNode.x, y: branch.endNode.y, angle: branch.angle - config.branchAngleVariation, length: branch.length, depth: branch.depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y, leafDice: branch.leaf.dice }

        return [firstNext, secondNext]
    }

    animate() {
        window.requestAnimationFrame(this.drawAnimationFrame.bind(this))
    }

    drawAnimationFrame() {
        const now = window.performance.now()
        const delta = (now - this.lastFrameTime)

        if (delta > (1000 / this.fps)) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)

            this.updateAngleVariation()
            const tree = this.buildAnimationTree()

            for (const branch of tree) {
                this.draw(branch.x, branch.y, branch.endX, branch.endY, branch.color, branch.thickness, branch.leaf)
            }

            this.lastFrameTime = now
        }

        window.requestAnimationFrame(this.animate.bind(this))
    }

    updateAngleVariation() {
        this.angleVariation += this.windDirection * this.windStep
        
        if(this.angleVariation >= this.windRange.high) {
            this.updateWindRange()
            this.windDirection = -1
        }
        else if (this.angleVariation <= this.windRange.low) {
            this.updateWindRange()
            this.windDirection = 1
        }
    }

    updateWindRange() {
        this.windRange = {
            low: 0 + ((1 - this.windStrength * Math.random()) / 2), 
            high: 1 - ((1 - this.windStrength * Math.random()) / 2)
        }
    }

    buildAnimationTree() {
        let pipe = []
        let branches = []

        pipe.push(this.blueprint[0])

        while (pipe.length > 0) {
            const current = pipe[0]
            const {endX, endY} = this.nextAnimatedCoordinates(current, this.angleVariation)
            const previous = branches.find(branch => branch.id === current.prevId)

            branches.push(this.getAnimationBranch(previous, current, endX, endY))

            const next = this.blueprint.find(branch => branch.id === current.id + 1)

            if (next) {
                pipe.push(next)
            }

            pipe.shift()
        }

        return branches
    }

    nextAnimatedCoordinates(blueprint) {
        const endX = blueprint.startNode.x + blueprint.length * Math.cos((blueprint.angle + (this.angleVariation * blueprint.depth / 20)))
        const endY = blueprint.startNode.y + blueprint.length * Math.sin((blueprint.angle + (this.angleVariation * blueprint.depth / 20)))
        
        return {endX, endY}
    }

    getAnimationBranch(previous, current, endX, endY) {
        return {
            x: previous ? previous.endX : this.root.x,
            y: previous ? previous.endY : this.root.y,
            endX: endX,
            endY: endY,
            color: current.color,
            thickness: current.thickness,
            leaf: current.leaf,
            id: current.id,
        }
    }

    draw(x, y, endX, endY, color, thickness, leaf, curveControlPointX = x, curveControlPointY = y) {
        this.context.beginPath()
        this.context.moveTo(x, y)

        this.context.quadraticCurveTo(curveControlPointX, curveControlPointY, endX, endY)
        this.context.strokeStyle = color
        this.context.lineWidth = thickness
        this.context.stroke()

        if (leaf.dice < config.leafProbability) {
            this.drawLeaf(endX, endY, leaf.ellipse, leaf.color)
        }
    }

    drawLeaf(x, y, ellipse, color) {
        this.context.beginPath()
        this.context.ellipse(
            x,
            y,
            config.leafSize,
            config.leafSize * 2,
            ellipse,
            0,
            2 * Math.PI
        )
        this.context.fillStyle = color
        this.context.fill()
    }
}