import { config } from "./config.js"
import { colorWithVariation, getCurve, getThickness } from "./helpers.js"

export class App {
    constructor() {
        this.pipe = [],
        this.blueprint = [],
        this.drawn = {value: 0},
        this.canvas = document.createElement('canvas'),
        this.context = this.canvas.getContext('2d'),
        this.container = document.getElementById('main-container')
        this.info = document.getElementById('info-text')
    }

    start() {
        this.buildCanvas()
        this.fillBackground()
        this.writeInfo()

        this.pipe.push({ endX: (this.canvas.width / 2), endY: this.canvas.height, angle: -Math.PI / 2, depth: 0, thickness: config.branchThickness });

        while (this.pipe.length > 0 && this.drawn.value <= config.age) {
            const next = this.pipe[0];

            this.blueprint.push({x: next.x, y: next.y, endX: next.endX, endY: next.endY, angle: next.angle, depth: next.depth, thickness: next.thickness, leafDice: next.leafDice})

            this.build(next.endX, next.endY, next.angle, next.depth, next.thickness, next.ccpX, next.ccpY);

            this.drawn.value++;
            this.pipe.shift();
        }

        window.requestAnimationFrame(this.animate.bind(this))
    }

    animate() {
        for(const branch of this.blueprint) {
            this.draw(branch.x, branch.y, branch.endX, branch.endY, branch.thickness, branch.leafDice)
        }
        
        window.requestAnimationFrame(this.animate.bind(this))
    }

    buildCanvas() {
        this.canvas.width = config.canvasWidth;
        this.canvas.height = config.canvasHeight;
        this.container.appendChild(this.canvas);

        this.context.fillStyle = config.skyColor;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    fillBackground() {
        this.container.style.backgroundColor = config.skyColor;
    }

    writeInfo() {
        this.info.innerHTML = `Cet arbre s'appelle ${config.seed.name}. Il pousse depuis ${config.age} jours.\n
Pour le partager et le retrouver facilement, copiez le lien de cette page depuis la barre d'adresse de votre navigateur, ou ci-dessous :\n
${window.location.href} \n\n
L'accès à cet arbre est libre et gratuit pour tout le monde, et le restera pour toujours.`
    }

    draw(x, y, endX, endY, thickness, leafDice, curveControlPointX = x, curveControlPointY = y) {
        this.context.beginPath();
        this.context.moveTo(x, y);

        this.context.quadraticCurveTo(curveControlPointX, curveControlPointY, endX, endY);
        this.context.strokeStyle = colorWithVariation(config.branchColor, config.branchColorVariation, endX, config.seedRandom);
        this.context.lineWidth = thickness;
        this.context.stroke();

        if (leafDice < config.leafProbability) {
            this.drawLeaf(endX, endY);
        }
    }

    build(x, y, angle, depth, thickness, curveControlPointX = x, curveControlPointY = y) {
        // Coordonnées du noeud suivant (endX, endY)
        const endX = x + Math.cos(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength));
        const endY = y + Math.sin(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength));

        // Spawn d'une feuille au noeud (x,y)
        const leafDice = config.seedRandom(x) - (depth - config.maxDepth) / 10;
    
        if (depth < config.maxDepth) {
            // Courbure des deux branches du noeud suivant
            const d1 = getCurve(endX, endY, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
            const d2 = getCurve(endX + 1, endY + 1, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
    
            // Epaisseur des deux branches du noeud suivant
            const thickness1 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
            const thickness2 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
    
            // Placement des deux branches suivantes sur la pile
            this.pipe.push({ x: x, y: y, endX: endX, endY: endY, angle: angle + config.branchAngleVariation, depth: depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y, leafDice: leafDice });
            this.pipe.push({ x: x, y: y, endX: endX, endY: endY, angle: angle - config.branchAngleVariation, depth: depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y, leafDice: leafDice });
        }
    }

    drawLeaf(x, y) {
        this.context.beginPath();
        this.context.ellipse(
            x,
            y,
            config.leafSize,
            config.leafSize * 2,
            config.seedRandom(y) * 360,
            0,
            2 * Math.PI
        );
        this.context.fillStyle = colorWithVariation(config.leafColor, config.leafColorVariation, x, config.seedRandom);
        this.context.fill();
    }
}