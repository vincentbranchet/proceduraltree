function colorWithVariation(hexColor, variation, position, seedRandom) {
    // Convertir le code couleur hexadécimal en valeurs RGB
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);

    // Calculer une valeur de sombritude aléatoire entre 0 et 1
    let randomVariation = seedRandom(position) * ((1 + variation) - (1 - variation)) + (1 - variation);

    // Appliquer la valeur de sombritude pour rendre la couleur plus sombre
    r = Math.min(Math.floor(r * randomVariation), 255);
    g = Math.min(Math.floor(g * randomVariation), 255);
    b = Math.min(Math.floor(b * randomVariation), 255);

    // Convertir les valeurs RGB en un code couleur hexadécimal
    let hexColorWithVariation = '#' + r.toString(16).padStart(2, '0') + g.toString(16).padStart(2, '0') + b.toString(16).padStart(2, '0');

    return hexColorWithVariation;
}

function getCurve(x, y, angle, branchAngle, branchAngleVariation, branchMaxLength, branchMinLength, seedRandom) {
    const curveX = x + Math.cos(angle + branchAngle * (seedRandom(x) * branchAngleVariation)) * ((seedRandom(x) * (branchMaxLength - branchMinLength) + branchMinLength));
    const curveY = y + Math.sin(angle + branchAngle * (seedRandom(y) * branchAngleVariation)) * ((seedRandom(y) * (branchMaxLength - branchMinLength) + branchMinLength));
    return { curveX, curveY }
}

function getThickness(x, thickness, branchThickness, branchThicknessVariation, seedRandom) {
    const dice = thickness * (seedRandom(x) * (1 - branchThicknessVariation) + branchThicknessVariation)
    if (dice < branchThickness) {
        return dice
    } else return branchThickness
}

// Fonction de hachage simple pour les chaînes de caractères
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash;
}

class Config {
    constructor(constants, seed) {    
        this.seedRandom = this.createRandomGenerator(seed.name)
        this.branchAngle = Math.PI / 2
        this.branchAngleVariation = Math.PI / 16
        this.branchColor = this.pick(constants.colors.branch, this.seedRandom)
        this.leafColor = this.pick(constants.colors.leaf, this.seedRandom)
        this.skyColor = this.pickDaily(constants.colors.sky, this.seedRandom)
        this.age = Math.ceil((new Date().getTime() - seed.birthday.getTime()) / 1000 / 60 / 60 / 24)

        this.parse(constants.params)
    }

    createRandomGenerator(seed) {
        return function(x = 0, y = 0) {
            const hashedSeed = hashCode(seed);
            const hashedX = hashCode(x.toString());
            const hashedY = hashCode(y.toString());
            const combinedSeed = hashedSeed + hashedX + hashedY;
            const random = Math.sin(combinedSeed) * 10000;
            return random - Math.floor(random);
        };
    }

    parse(obj) {
        for(let i in obj) {
            this[i] = obj[i]
        }
    }

    pick(colors, random) {
        const index = Math.round(random('branches') * (colors.length - 1))
        return colors[index]
    }

    pickDaily(colors, random) {
        const index = Math.round(random(new Date().toDateString()) * (colors.length - 1))
        return colors[index]
    }
}

const start = async () => {
    const constants = await fetch('/config')
        .then(file => file.json())
        .catch(err => err)
    
    const seed = await fetch('/../public/config/seed.json')
        .then(file => file.json())
        .then(seed => {
            seed.birthday = new Date(seed.birthday)
            return seed
        })
        .catch(err => err)
    
    const config = new Config(constants, seed)
    
    class App {
        constructor() {
            this.pipe = [],
            this.drawn = {value: 0},
            this.canvas = document.createElement('canvas'),
            this.context = this.canvas.getContext('2d')
        }
    
        start() {
            this.buildCanvas()
    
            this.pipe.push({ x: (this.canvas.width / 2), y: this.canvas.height, angle: -Math.PI / 2, depth: 0, thickness: config.branchThickness });
    
            while (this.pipe.length > 0 && this.drawn.value <= config.age) {
                const next = this.pipe[0];
    
                this.drawTree(next.x, next.y, next.angle, next.depth, next.thickness);
    
                this.drawn.value++;
                this.pipe.shift();
            }
        }
    
        buildCanvas() {
            this.canvas.width = document.body.clientWidth;
            this.canvas.height = window.innerHeight;
            document.body.appendChild(this.canvas);
    
            this.context.fillStyle = config.skyColor;
            this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    
        drawTree(x, y, angle, depth, thickness, curveControlPointX = x, curveControlPointY = y) {
            // Dessiner la branche principale
            this.context.beginPath();
            this.context.moveTo(x, y);
            const endX = x + Math.cos(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength));
            const endY = y + Math.sin(angle) * ((config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength));
            this.context.quadraticCurveTo(curveControlPointX, curveControlPointY, endX, endY);
            this.context.strokeStyle = colorWithVariation(config.branchColor, config.branchColorVariation, endX, config.seedRandom);
            this.context.lineWidth = thickness;
            this.context.stroke();
        
            // Dessiner une feuille
            const leafDice = config.seedRandom(x) - (depth - config.maxDepth) / 10;
        
            if (leafDice < config.leafProbability) {
                this.drawLeaf(endX, endY);
            }
        
            if (depth < config.maxDepth) {
                // Dessiner les branches suivantes
                const d1 = getCurve(endX, endY, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
                const d2 = getCurve(endX + 1, endY + 1, angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
        
                const thickness1 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
                const thickness2 = getThickness(endY, thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
        
                this.pipe.push({ x: endX, y: endY, angle: angle + config.branchAngleVariation, depth: depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y });
                this.pipe.push({ x: endX, y: endY, angle: angle - config.branchAngleVariation, depth: depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y });
            }
        }
    
        // Fonction pour dessiner une feuille à une position donnée
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

    const app = new App()
    app.start()
}

start()