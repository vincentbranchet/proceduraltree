import { hashCode } from "./helpers.js"

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

const constants = await fetch('/config')
    .then(file => file.json())
    .catch(err => err)

const seed = await fetch('/config')
    .then(file => file.json())
    .then(seed => {
        seed.birthday = new Date(seed.birthday)
        return seed
    })
    .catch(err => err)

export const config = new Config(constants, seed)