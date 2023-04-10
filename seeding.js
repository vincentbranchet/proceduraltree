function createRandomGenerator(seed) {
    return function (param = 0) {
        const hashedSeed = hashCode(seed.toString());
        const hashedParam = hashCode(param.toString());
        const combinedSeed = hashedSeed + hashedParam;
        const random = Math.sin(combinedSeed) * 10000;
        return random - Math.floor(random);
    };
}

// Fonction de hachage simple pour les chaînes de caractères
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash;
}
