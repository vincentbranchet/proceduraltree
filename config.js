async function config() {
    const constants = await fetch('./config.json')
        .then(file => file.json())
        .catch(err => err)

    const seed = await fetch('./seed.json')
        .then(file => file.json())
        .then(seed => {
            seed.birthday = new Date(seed.birthday)
            return seed
        })
        .catch(err => err)

    let variables = {
        age: undefined,
        branchAngle: Math.PI / 2,
        branchAngleVariation: Math.PI / 16,
        branchColor: undefined,
        leafColor: undefined,
        skyColor: undefined,
        seedRandom: undefined
    }

    function pick(colors, random) {
        const index = Math.round(random('branches') * (colors.length - 1))
        return colors[index]
    }

    function pickDaily(colors, random) {
        const index = Math.round(random(new Date().toDateString()) * (colors.length - 1))
        return colors[index]
    }
    
    variables.seedRandom = createRandomGenerator(seed.name)
    variables.branchColor = pick(constants.colors.branch, variables.seedRandom)
    variables.leafColor = pick(constants.colors.leaf, variables.seedRandom)
    variables.skyColor = pickDaily(constants.colors.sky, variables.seedRandom)
    variables.age = Math.ceil((new Date().getTime() - seed.birthday.getTime()) / 1000 / 60 / 60 / 24)

    return { ...constants.params, ...variables }
}

export default await config()