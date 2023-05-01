class Global {
    constructor() {
        this.pipe = [],
        this.drawn = {value: 0},
        this.canvas = document.createElement('canvas'),
        this.context = this.canvas.getContext('2d')
    }

    addToPipe(value) {
        this.pipe.push(value)
    }

    shiftPipe() {
        this.pipe.shift()
    }
}

export const global = new Global()