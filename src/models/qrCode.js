'use strict';

const Util = require('util');
const JsQR = require('jsqr').default;
const Gm = require('gm').subClass({ imageMagick: true });

// Add async versions GraphicsMagick methods to the prototype for chaining
Gm.prototype.toBufferAsync = Util.promisify(Gm.prototype.toBuffer);
Gm.prototype.sizeAsync = Util.promisify(Gm.prototype.size);

class QrCode {
    static async getCode(imageData) {
        const image = Gm(imageData);

        // jsQR needs a Uint8ClampedArray, which is easier to make with an RGBA buffer
        const rgbimg = await image.toBufferAsync('RGBA');

        // Find the size for jsQR
        const dimensions = await image.sizeAsync();

        return JsQR(
            new Uint8ClampedArray(rgbimg),
            dimensions.width,
            dimensions.height,
            { inversionAttempts: 'dontInvert' }, // We aren't using a camera, so this cuts scan time in half
        );
    }
}
module.exports = QrCode;
