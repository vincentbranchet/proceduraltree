// Fonction pour dessiner une feuille à une position donnée
function drawLeaf(x, y) {
    context.beginPath();
    context.ellipse(
        x,
        y,
        leafSize,
        leafSize * 2,
        seedRandom(y) * 360,
        0,
        2 * Math.PI
    );
    context.fillStyle = colorWithVariation(leafColor, leafColorVariation, x);
    context.fill();
}

function colorWithVariation(hexColor, variation, position) {
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

// Fonction récursive pour dessiner l'arbre
function drawTree(x, y, angle, depth, thickness, curveControlPointX = x, curveControlPointY = y) {
    // Dessiner la branche principale
    context.beginPath();
    context.moveTo(x, y);
    const endX = x + Math.cos(angle) * ((seedRandom(x) * (branchMaxLength - branchMinLength) + branchMinLength));
    const endY = y + Math.sin(angle) * ((seedRandom(y) * (branchMaxLength - branchMinLength) + branchMinLength));
    context.quadraticCurveTo(curveControlPointX, curveControlPointY, endX, endY);
    context.strokeStyle = colorWithVariation(branchColor, branchColorVariation, endX);
    context.lineWidth = thickness;
    context.stroke();

    // Dessiner une feuille
    const leafDice = seedRandom(x) - (depth - maxDepth) / 10;

    if (leafDice < leafProbability) {
        drawLeaf(endX, endY);
    }

    if (depth < maxDepth) {
        // Dessiner les branches suivantes
        const dx1 = endX + Math.cos(angle + branchAngle * (seedRandom(endX) * branchAngleVariation)) * ((seedRandom(endX) * (branchMaxLength - branchMinLength) + branchMinLength));
        const dy1 = endY + Math.sin(angle + branchAngle * (seedRandom(endY) * branchAngleVariation)) * ((seedRandom(endY) * (branchMaxLength - branchMinLength) + branchMinLength));
        const dx2 = endX + Math.cos(angle - branchAngle * (seedRandom(endX + 1) * branchAngleVariation)) * ((seedRandom(endX + 1) * (branchMaxLength - branchMinLength) + branchMinLength));
        const dy2 = endY + Math.sin(angle - branchAngle * (seedRandom(endY + 1) * branchAngleVariation)) * ((seedRandom(endY + 1) * (branchMaxLength - branchMinLength) + branchMinLength));
        const thicknessDice1 = thickness * (seedRandom(endX) * (1 - branchThicknessVariation) + branchThicknessVariation);
        const thicknessDice2 = thickness * (seedRandom(endX) * (1 - branchThicknessVariation) + branchThicknessVariation);
        const thickness1 = thicknessDice1 < branchThickness ? thicknessDice1 : branchThickness;
        const thickness2 = thicknessDice2 < branchThickness ? thicknessDice2 : branchThickness;
        drawTree(endX, endY, angle + branchAngleVariation, depth + 1, thickness1, dx1, dy1);
        drawTree(endX, endY, angle - branchAngleVariation, depth + 1, thickness2, dx2, dy2);
    }
}