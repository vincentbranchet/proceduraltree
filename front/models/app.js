import { config } from "./config.js"
import { colorWithVariation, getCurve, getThickness } from "./helpers.js"

export class App {
    constructor() {
        this.pipe = []
        this.animationPipe = []
        this.blueprint = []
        this.drawn = { value: 0 }
        this.canvas = document.createElement('canvas')
        this.context = this.canvas.getContext('2d')
        this.container = document.getElementById('main-container')
        this.windResistance = 5
        this.info = document.getElementById('info-text')
        this.lastFrameTime = null
        this.buildId = 0
        this.fps = 12 // TODO : browser crashes close to 24
    }

    start() {
        this.buildCanvas()
        this.fillBackground()
        this.writeInfo()
        this.root = { x: this.canvas.width / 2, y: this.canvas.height }

        this.pipe.push({ id: this.buildId, prevId: 0, x: this.root.x, y: this.root.y, length: 0, angle: -Math.PI / 2, depth: 0, thickness: config.branchThickness });

        // enregistrer la structure de l'arbre dans le pipe
        while (this.pipe.length > 0 && this.drawn.value <= config.age) {
            const next = this.pipe[0]

            this.build(next.x, next.y, next.angle, next.depth, next.thickness, next.id, next.prevId)

            this.drawn.value++
            this.pipe.shift()
        }

        // déclencher la boucle d'animation
        window.requestAnimationFrame(this.animate.bind(this))
    }

    build(x, y, angle, depth, thickness, id, prevId) {
        // Coordonnées théoriques du noeud suivant (endX, endY)
        const endX = x + Math.cos(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength))
        const endY = y + Math.sin(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength))

        // Distance qui sépare le noeud actuel du noeud suivant
        const length = Math.sqrt(Math.pow(endX - x, 2) + Math.pow(endY - y, 2))

        // Spawn d'une feuille au noeud actuel
        const leafDice = config.seedRandom(x) - (depth - config.maxDepth) / 10

        // Enregistrement du blueprint de la branche
        this.blueprint.push({
            id: id,
            prevId: prevId,
            depth: depth,
            startNode: { x: x, y: y },
            endNode: { x: endX, y: endY },
            color: colorWithVariation(config.branchColor, config.branchColorVariation, endX, config.seedRandom),
            length: length,
            thickness: thickness,
            angle: angle,
            leaf: {dice: leafDice, ellipse: config.seedRandom(y) * 360, color: colorWithVariation(config.leafColor, config.leafColorVariation, x, config.seedRandom)},
        })

        // Courbure des deux branches du noeud suivant
        const d1 = getCurve(endX, endY, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom)
        const d2 = getCurve(endX + 1, endY + 1, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom)

        // Epaisseur des deux branches du noeud suivant
        const thickness1 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom)
        const thickness2 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom)

        // Placement des deux branches suivantes sur la pile
        this.buildId++
        this.pipe.push({ id: this.buildId, prevId: id, x: endX, y: endY, angle: angle + config.branchAngleVariation, length: length, depth: depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y, leafDice: leafDice })
        this.buildId++
        this.pipe.push({ id: this.buildId, prevId: id, x: endX, y: endY, angle: angle - config.branchAngleVariation, length: length, depth: depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y, leafDice: leafDice })
    }

    animate() {
        const now = window.performance.now()
        const delta = (now - this.lastFrameTime)

        if (delta > (1000 / this.fps)) {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height)
            
            const angleVariation = Math.random() * 1 / this.windResistance

            let pipe = []
            let framePipe = []

            pipe.push(this.blueprint[0])

            // enregistrer les branches à dessiner dans la frame
            while (pipe.length > 0) {
                const current = pipe[0]

                // On calcule les coordonnées en fonction de la distance et de l'angle inscrits dans le blueprint
                const endX = current.startNode.x + current.length * Math.cos((current.angle + (angleVariation * current.depth / 10))) // TODO : risk of failed behavior if depth >>> 10
                const endY = current.startNode.y + current.length * Math.sin((current.angle + (angleVariation * current.depth / 10))) // TODO : risk of failed behavior if depth >>> 10

                const previousBranch = framePipe.find(branch => branch.id === current.prevId)

                framePipe.push({
                    x: previousBranch ? previousBranch.endX : this.root.x,
                    y: previousBranch ? previousBranch.endY : this.root.y,
                    endX: endX,
                    endY: endY,
                    color: current.color,
                    thickness: current.thickness,
                    leaf: current.leaf,
                    id: current.id,
                })

                const next = this.blueprint.find(branch => branch.id === current.id + 1)

                if (next) {
                    pipe.push(next)
                }

                pipe.shift()
            }

            // dessiner la frame
            for (const branch of framePipe) {
                this.draw(branch.x, branch.y, branch.endX, branch.endY, branch.color, branch.thickness, branch.leaf)
            }

            this.lastFrameTime = now
        }

        window.requestAnimationFrame(this.animate.bind(this))
    }

    buildCanvas() {
        this.canvas.width = config.canvasWidth
        this.canvas.height = config.canvasHeight
        this.container.appendChild(this.canvas)

        this.context.fillStyle = config.skyColor
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }

    fillBackground() {
        this.container.style.backgroundColor = config.skyColor
    }

    writeInfo() {
        this.info.innerHTML = `Cet arbre s'appelle ${config.seed.name}. Il pousse depuis ${config.age} jours.\n
Pour le partager et le retrouver facilement, copiez le lien de cette page depuis la barre d'adresse de votre navigateur, ou ci-dessous :\n
${window.location.href} \n\n
L'accès à cet arbre est libre et gratuit pour tout le monde, et le restera pour toujours.`
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