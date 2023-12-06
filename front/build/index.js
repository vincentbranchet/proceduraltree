(() => {
  // front/models/helpers.js
  function colorWithVariation(hexColor, variation, position, seedRandom) {
    let r = parseInt(hexColor.substr(1, 2), 16);
    let g = parseInt(hexColor.substr(3, 2), 16);
    let b = parseInt(hexColor.substr(5, 2), 16);
    let randomVariation = seedRandom(position) * (1 + variation - (1 - variation)) + (1 - variation);
    r = Math.min(Math.floor(r * randomVariation), 255);
    g = Math.min(Math.floor(g * randomVariation), 255);
    b = Math.min(Math.floor(b * randomVariation), 255);
    let hexColorWithVariation = "#" + r.toString(16).padStart(2, "0") + g.toString(16).padStart(2, "0") + b.toString(16).padStart(2, "0");
    return hexColorWithVariation;
  }
  function getCurve(x, y, angle, branchAngle, branchAngleVariation, branchMaxLength, branchMinLength, seedRandom) {
    const curveX = x + Math.cos(angle + branchAngle * (seedRandom(x) * branchAngleVariation)) * (seedRandom(x) * (branchMaxLength - branchMinLength) + branchMinLength);
    const curveY = y + Math.sin(angle + branchAngle * (seedRandom(y) * branchAngleVariation)) * (seedRandom(y) * (branchMaxLength - branchMinLength) + branchMinLength);
    return { curveX, curveY };
  }
  function getThickness(x, thickness, branchThickness, branchThicknessVariation, seedRandom) {
    const dice = thickness * (seedRandom(x) * (1 - branchThicknessVariation) + branchThicknessVariation);
    if (dice < branchThickness) {
      return dice;
    } else
      return branchThickness;
  }
  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = hash * 31 + str.charCodeAt(i) & 4294967295;
    }
    return hash;
  }

  // front/models/config.js
  var Config = class {
    constructor(constants2, seed2) {
      this.seed = seed2;
      this.seedRandom = this.createRandomGenerator(seed2.name);
      this.branchAngle = Math.PI / 2;
      this.branchAngleVariation = Math.PI / 16;
      this.branchColor = this.pick(constants2.colors.branch, this.seedRandom);
      this.leafColor = this.pick(constants2.colors.leaf, this.seedRandom);
      this.skyColor = this.pickDaily(constants2.colors.sky, this.seedRandom);
      this.age = Math.ceil(((/* @__PURE__ */ new Date()).getTime() - seed2.birthday.getTime()) / 1e3 / 60 / 60 / 24);
      this.parse(constants2.params);
    }
    createRandomGenerator(seed2) {
      return function(x = 0, y = 0) {
        const hashedSeed = hashCode(seed2);
        const hashedX = hashCode(x.toString());
        const hashedY = hashCode(y.toString());
        const combinedSeed = hashedSeed + hashedX + hashedY;
        const random = Math.sin(combinedSeed) * 1e4;
        return random - Math.floor(random);
      };
    }
    parse(obj) {
      for (let i in obj) {
        this[i] = obj[i];
      }
    }
    pick(colors, random) {
      const index = Math.round(random("branches") * (colors.length - 1));
      return colors[index];
    }
    pickDaily(colors, random) {
      const index = Math.round(random((/* @__PURE__ */ new Date()).toDateString()) * (colors.length - 1));
      return colors[index];
    }
  };
  var constants = "PLACEHOLDER_CONFIG";
  var seed = {
    name: "PLACEHOLDER_NAME",
    birthday: "PLACEHOLDER_BIRTHDAY"
  };
  seed.birthday = new Date(seed.birthday);
  var config = new Config(constants, seed);

  // front/models/app.js
  var App = class {
    constructor() {
      this.pipe = [];
      this.animationPipe = [];
      this.blueprint = [];
      this.drawn = { value: 0 };
      this.windResistance = 5;
      this.lastFrameTime = null;
      this.buildId = 0;
      this.fps = 12;
    }
    start() {
      this.renderCanvas();
      this.fillBackground();
      this.fillInfoPanel();
      this.buildBlueprint();
      this.animate();
    }
    renderCanvas() {
      this.canvas = document.createElement("canvas");
      this.canvas.width = config.canvasWidth;
      this.canvas.height = config.canvasHeight;
      this.container = document.getElementById("main-container");
      this.container.appendChild(this.canvas);
      this.root = { x: this.canvas.width / 2, y: this.canvas.height };
    }
    fillBackground() {
      this.context = this.canvas.getContext("2d");
      this.context.fillStyle = config.skyColor;
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.container.style.backgroundColor = config.skyColor;
    }
    fillInfoPanel() {
      this.info = document.getElementById("info-text");
      this.info.innerHTML = `Cet arbre s'appelle ${config.seed.name}. Il pousse depuis ${config.age} jours.

Pour le partager et le retrouver facilement, copiez le lien de cette page depuis la barre d'adresse de votre navigateur, ou ci-dessous :

${window.location.href} 


L'acc\xE8s \xE0 cet arbre est libre et gratuit pour tout le monde, et le restera pour toujours.`;
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
        length: 0
      });
      while (this.drawn.value <= config.age) {
        const current = this.pipe[0];
        const branch = this.buildBranch(current);
        this.blueprint.push(branch);
        this.getNextInPipe(branch);
        this.drawn.value++;
        this.pipe.shift();
      }
    }
    buildBranch({ id, prevId, x, y, angle, depth, thickness }) {
      const { nextX, nextY } = this.nextCoordinates(x, y, angle);
      const length = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextY - y, 2));
      const leafDice = config.seedRandom(x) - (depth - config.maxDepth) / 10;
      return {
        id,
        prevId,
        depth,
        startNode: { x, y },
        endNode: { x: nextX, y: nextY },
        color: colorWithVariation(config.branchColor, config.branchColorVariation, nextX, config.seedRandom),
        length,
        thickness,
        angle,
        leaf: { dice: leafDice, ellipse: config.seedRandom(y) * 360, color: colorWithVariation(config.leafColor, config.leafColorVariation, x, config.seedRandom) }
      };
    }
    nextCoordinates(x, y, angle) {
      const nextX = x + Math.cos(angle) * (config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength);
      const nextY = y + Math.sin(angle) * (config.seedRandom(x, y) * (config.branchMaxLength - config.branchMinLength) + config.branchMinLength);
      return { nextX, nextY };
    }
    getNextInPipe(branch) {
      const d1 = getCurve(branch.endNode.x, branch.endNode.y, branch.angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
      const d2 = getCurve(branch.endNode.x + 1, branch.endNode.y + 1, branch.angle, config.branchAngle, config.branchAngleVariation, config.branchMaxLength, config.branchMinLength, config.seedRandom);
      const thickness1 = getThickness(branch.endNode.y, branch.thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
      const thickness2 = getThickness(branch.endNode.y, branch.thickness, config.branchThickness, config.branchThicknessVariation, config.seedRandom);
      this.pipe = this.pipe.concat(this.getNextInBlueprint(branch, d1, d2, thickness1, thickness2));
    }
    getNextInBlueprint(branch, d1, d2, thickness1, thickness2) {
      this.buildId++;
      const firstNext = { id: this.buildId, prevId: branch.id, x: branch.endNode.x, y: branch.endNode.y, angle: branch.angle + config.branchAngleVariation, length: branch.length, depth: branch.depth + 1, thickness: thickness1, ccpX: d1.x, ccpY: d1.y, leafDice: branch.leaf.dice };
      this.buildId++;
      const secondNext = { id: this.buildId, prevId: branch.id, x: branch.endNode.x, y: branch.endNode.y, angle: branch.angle - config.branchAngleVariation, length: branch.length, depth: branch.depth + 1, thickness: thickness2, ccpX: d2.x, ccpY: d2.y, leafDice: branch.leaf.dice };
      return [firstNext, secondNext];
    }
    animate() {
      window.requestAnimationFrame(this.drawAnimationFrame.bind(this));
    }
    drawAnimationFrame() {
      const now = window.performance.now();
      const delta = now - this.lastFrameTime;
      if (delta > 1e3 / this.fps) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const angleVariation = Math.random() * 1 / this.windResistance;
        const tree = this.buildAnimationTree(angleVariation);
        for (const branch of tree) {
          this.draw(branch.x, branch.y, branch.endX, branch.endY, branch.color, branch.thickness, branch.leaf);
        }
        this.lastFrameTime = now;
      }
      window.requestAnimationFrame(this.animate.bind(this));
    }
    buildAnimationTree(angleVariation) {
      let pipe = [];
      let branches = [];
      pipe.push(this.blueprint[0]);
      while (pipe.length > 0) {
        const current = pipe[0];
        const { endX, endY } = this.nextAnimatedCoordinates(current, angleVariation);
        const previous = branches.find((branch) => branch.id === current.prevId);
        branches.push(this.getAnimationBranch(previous, current, endX, endY));
        const next = this.blueprint.find((branch) => branch.id === current.id + 1);
        if (next) {
          pipe.push(next);
        }
        pipe.shift();
      }
      return branches;
    }
    nextAnimatedCoordinates(blueprint, angleVariation) {
      const endX = blueprint.startNode.x + blueprint.length * Math.cos(blueprint.angle + angleVariation * blueprint.depth / 10);
      const endY = blueprint.startNode.y + blueprint.length * Math.sin(blueprint.angle + angleVariation * blueprint.depth / 10);
      return { endX, endY };
    }
    getAnimationBranch(previous, current, endX, endY) {
      return {
        x: previous ? previous.endX : this.root.x,
        y: previous ? previous.endY : this.root.y,
        endX,
        endY,
        color: current.color,
        thickness: current.thickness,
        leaf: current.leaf,
        id: current.id
      };
    }
    draw(x, y, endX, endY, color, thickness, leaf, curveControlPointX = x, curveControlPointY = y) {
      this.context.beginPath();
      this.context.moveTo(x, y);
      this.context.quadraticCurveTo(curveControlPointX, curveControlPointY, endX, endY);
      this.context.strokeStyle = color;
      this.context.lineWidth = thickness;
      this.context.stroke();
      if (leaf.dice < config.leafProbability) {
        this.drawLeaf(endX, endY, leaf.ellipse, leaf.color);
      }
    }
    drawLeaf(x, y, ellipse, color) {
      this.context.beginPath();
      this.context.ellipse(
        x,
        y,
        config.leafSize,
        config.leafSize * 2,
        ellipse,
        0,
        2 * Math.PI
      );
      this.context.fillStyle = color;
      this.context.fill();
    }
  };

  // front/index.js
  var app = new App();
  app.start();
})();
