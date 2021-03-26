'use strict';

const Gm = require('gm').subClass({ imageMagick: true });
const Adapter = require('./adapter');

class ImageToImage extends Adapter {
    constructor() {
        super('ImageToImage');
    }

    /**
     * Perform requested conversion.
     * @param {import('../models/task').Task} conversion
     */
    async convert(task) {
        // Create image object from media
        const image = Gm(await this.getMedia(task.input, task.file));

        const { input, output } = this.parseCommand(
            task.converterOptions.command,
        );

        return {
            data: image
                .in(...input)
                .out(...output)
                .stream(task.outputFormat),
        };
    }
}

module.exports = ImageToImage;
