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
    if (drawn <= AGE) {

        pipe.shift();

        // Dessiner la branche principale
        context.beginPath();
        context.moveTo(x, y);
        const endX = x + Math.cos(angle) * ((seedRandom(x, y) * (branchMaxLength - branchMinLength) + branchMinLength));
        const endY = y + Math.sin(angle) * ((seedRandom(x, y) * (branchMaxLength - branchMinLength) + branchMinLength));
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
            const d1 = getCurve(endX, endY, angle);
            const d2 = getCurve(endX + 1, endY + 1, angle);

            const thickness1 = getThickness(endY, thickness);
            const thickness2 = getThickness(endY, thickness);

            pipe.push({ x: endX, y: endY, angle: angle + branchAngleVariation, depth: depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y });
            pipe.push({ x: endX, y: endY, angle: angle - branchAngleVariation, depth: depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y });
        }

        if (pipe[0] && pipe[1]) {
            const next = pipe[0];
            const next2 = pipe[1];
            drawTree(next.x, next.y, next.angle, next.depth, next.thickness, next.ccpX, next.ccpY);
            drawTree(next2.x, next2.y, next2.angle, next2.depth, next2.thickness, next2.ccpX, next2.ccpY);
        }

        drawn++;
    }
}

function getCurve(x, y, angle) {
    const curveX = x + Math.cos(angle + branchAngle * (seedRandom(x) * branchAngleVariation)) * ((seedRandom(x) * (branchMaxLength - branchMinLength) + branchMinLength));
    const curveY = y + Math.sin(angle + branchAngle * (seedRandom(y) * branchAngleVariation)) * ((seedRandom(y) * (branchMaxLength - branchMinLength) + branchMinLength));
    return { curveX, curveY }
}

function getThickness(x, thickness) {
    const dice = thickness * (seedRandom(x) * (1 - branchThicknessVariation) + branchThicknessVariation)
    if (dice < branchThickness) {
        return dice
    } else return branchThickness
}