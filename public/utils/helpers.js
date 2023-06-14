export function colorWithVariation(hexColor, variation, position, seedRandom) {
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

export function getCurve(x, y, angle, branchAngle, branchAngleVariation, branchMaxLength, branchMinLength, seedRandom) {
    const curveX = x + Math.cos(angle + branchAngle * (seedRandom(x) * branchAngleVariation)) * ((seedRandom(x) * (branchMaxLength - branchMinLength) + branchMinLength));
    const curveY = y + Math.sin(angle + branchAngle * (seedRandom(y) * branchAngleVariation)) * ((seedRandom(y) * (branchMaxLength - branchMinLength) + branchMinLength));
    return { curveX, curveY }
}

export function getThickness(x, thickness, branchThickness, branchThicknessVariation, seedRandom) {
    const dice = thickness * (seedRandom(x) * (1 - branchThicknessVariation) + branchThicknessVariation)
    if (dice < branchThickness) {
        return dice
    } else return branchThickness
}

// Fonction de hachage simple pour les chaînes de caractères
export function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff;
    }
    return hash;
}