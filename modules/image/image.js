import Rectangle from "@pencil.js/rectangle";
import NetworkEvent from "@pencil.js/network-event";

const urlKey = Symbol("_url");

/**
 * Image class
 * @class
 * @extends Rectangle
 */
export default class Image extends Rectangle {
    /**
     * Image constructor
     * @param {PositionDefinition} positionDefinition - Top-left corner of the image
     * @param {String} url - Link to an image file
     * @param {Number} [width] - Width to draw the image, or width and height if height omitted
     * @param {Number} [height] - Height to draw the image, use file height and width if both omitted
     * @param {ComponentOptions} [options] - Drawing options
     */
    constructor (positionDefinition, url, width = null, height = null, options) {
        super(positionDefinition, width, height, options);

        /**
         * @type {HTMLImageElement}
         */
        this.file = null;
        /**
         * @type {Boolean}
         */
        this.isLoaded = false;
        /**
         * @type {Number}
         */
        this.ratio = 0;
        /**
         * @type {String}
         * @private
         */
        this[urlKey] = null;
        this.url = url;
    }

    /**
     * Change the image URL
     * @param {String} url - Link to an image file
     */
    set url (url) {
        if (this.url === url) {
            return;
        }

        this.file = null;
        this.isLoaded = false;
        this[urlKey] = url;
        if (url) {
            Image.load(url).then((img) => {
                this.file = img;
                this.isLoaded = true;
                this.ratio = img.width / img.height;
                if (this.width === null && this.height === null) {
                    this.restoreSize();
                }
                else if (this.width === null) {
                    this.width = this.height * this.ratio;
                }
                else if (this.height === null) {
                    this.height = this.width / this.ratio;
                }
                this.fire(new NetworkEvent(NetworkEvent.events.ready, this));
            }).catch(() => {
                this.fire(new NetworkEvent(NetworkEvent.events.error, this));
            });
        }
    }

    /**
     * Get the image URL
     * @return {String}
     */
    get url () {
        return this[urlKey];
    }

    /**
     * Draw it on a context
     * @param {CanvasRenderingContext2D} ctx - Drawing context
     * @return {Image} Itself
     */
    makePath (ctx) {
        if (this.isLoaded) {
            super.makePath(ctx);
            const originPos = this.getOrigin();
            ctx.drawImage(this.file, originPos.x, originPos.y, this.width, this.height);
        }

        return this;
    }

    /**
     * Use image width and height for drawing width and height
     */
    restoreSize () {
        if (this.isLoaded) {
            this.width = this.file.width;
            this.height = this.file.height;
        }
    }

    /**
     * @inheritDoc
     */
    toJSON () {
        const { url } = this;
        return {
            ...super.toJSON(),
            url,
        };
    }

    /**
     * @inheritDoc
     * @param {Object} definition - Image definition
     * @return {Image}
     */
    static from (definition) {
        return new Image(definition.position, definition.url, definition.width, definition.height, definition.options);
    }

    /**
     * Promise to load an image file.
     * @param {String|Array<String>} url - Link or an array of links to image files
     * @return {Promise}
     */
    static load (url) {
        if (Array.isArray(url)) {
            return Promise.all(url.map(singleUrl => Image.load(singleUrl)));
        }

        return new Promise((resolve, reject) => {
            const img = window.document.createElement("img");
            img.crossOrigin = "Anonymous";
            img.src = url;
            img.addEventListener("load", () => resolve(img));
            img.addEventListener("error", () => reject(new URIError(`Fail to load ${url}.`)));
        });
    }

    /**
     * @typedef {Object} ImageOptions
     * @extends ComponentOptions
     * @prop {String|ColorDefinition} [fill=null] - Color used as background
     * @prop {String} [description=""] - Description of the image (can be used to for better accessibility)
     */
    /**
     * @return {ImageOptions}
     */
    static get defaultOptions () {
        return {
            ...super.defaultOptions,
            fill: null,
            description: "",
        };
    }
}
