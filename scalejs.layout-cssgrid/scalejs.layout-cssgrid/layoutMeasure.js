/*global define, document */
define([
    './consts',
    './enums',
    './utils'
], function (
    consts,
    enums,
    utils
) {
    'use strict';

    var precision = consts.precision,
        PERIOD = consts.PERIOD,
        PX = consts.PX,
        EM = consts.EM,
        REM = consts.REM,
        PERCENT = consts.PERCENT,
        HEIGHT = consts.HEIGHT,
        WIDTH = consts.WIDTH,
        LEFT = consts.LEFT,
        RIGHT = consts.RIGHT,
        TOP = consts.TOP,
        BOTTOM = consts.BOTTOM,
        NONE = consts.NONE,
        zerostring = '0',
        borderWidths = enums.borderWidths,
        getCssValue = utils.getCssValue;

    function create(measure) {
        var internalMeasure;

        if (measure % 1 !== 0) {
            throw new Error('LayoutMeasures must be integers, measure was ' + typeof (measure) + '(' + measure + ')');
        }

        internalMeasure = measure;

        function getRawMeasure() {
            return internalMeasure;
        }

        function getPixelValue() {
            return internalMeasure / Math.pow(10, precision);
        }

        function getMeasureRoundedToWholePixel() {
            var abs = Math.abs,
			    pow = Math.pow,
			    fractionOfPixel = abs(internalMeasure % pow(10, precision)),
			    adjustment;

            if (fractionOfPixel >= 5 * pow(10, precision - 1)) {
                // Round up.
                adjustment = pow(10, precision) - fractionOfPixel;
            } else {
                // Round down.
                adjustment = -fractionOfPixel;
            }

            if (internalMeasure < 0) {
                adjustment = -adjustment;
            }
            return create(internalMeasure + adjustment);
        }

        function add(measure) {
            if (typeof measure.getRawMeasure !== 'function') {
                throw new Error('LayoutMeasure.add only accepts layout measures');
            }

            return create(internalMeasure + measure.getRawMeasure());
        }

        function subtract(measure) {
            if (typeof measure.getRawMeasure !== 'function') {
                throw new Error('LayoutMeasure.subtract only accepts layout measures');
            }
            return create(internalMeasure - measure.getRawMeasure());
        }

        function multiply(number) {
            if (typeof number !== "number") {
                throw new Error('LayoutMeasure.multiply only accepts numbers');
            }
            // Integer arithmetic; drop any remainder.
            return create(Math.floor(internalMeasure * number));
        }

        function divide(number) {
            if (typeof number !== "number") {
                throw new Error('LayoutMeasure.divide only accepts number');
            }
            // Integer arithmetic; drop any remainder.
            return create(Math.floor(internalMeasure / number));
        }

        function equals(measure) {
            if (typeof measure.getRawMeasure !== 'function') {
                throw new Error('LayoutMeasure.equals only accepts layout measures');
            }
            return internalMeasure === measure.getRawMeasure();
        }

        return {
            getRawMeasure: getRawMeasure,
            getPixelValue: getPixelValue,
            getMeasureRoundedToWholePixel: getMeasureRoundedToWholePixel,
            add: add,
            subtract: subtract,
            multiply: multiply,
            divide: divide,
            equals: equals
        };
    }

    function measureFromPx(measureInPx) {
        // Convert to accuracy of agent's layout engine.
        return create(Math.round(measureInPx * Math.pow(10, precision)));
    }

    function zero() {
        return create(0);
    }

    function min(a, b) {
        return create(Math.min(a.getRawMeasure(), b.getRawMeasure()));
    }

    function max(a, b) {
        return create(Math.max(a.getRawMeasure(), b.getRawMeasure()));
    }

    function measureFromPxString(measureInPxString) {
        var length = measureInPxString.length,
		    wholePart = 0,
		    fractionPart = 0,
		    decimalPosition = measureInPxString.indexOf(PERIOD);

        // Don't depend on a potentially lossy conversion to a float-- we'll parse it ourselves.
        measureInPxString = measureInPxString.substr(0, measureInPxString.length - 2);

        if (decimalPosition >= 0) {
            fractionPart = measureInPxString.substring(decimalPosition + 1);
            while (fractionPart.length < precision) {
                fractionPart += zerostring;
            }
            fractionPart = parseInt(fractionPart, 10);
        }
        if (decimalPosition !== 0) {
            wholePart = measureInPxString.substring(0, decimalPosition >= 0 ? decimalPosition : length);
            wholePart = parseInt(wholePart, 10) * Math.pow(10, precision);
        }
        //return create(wholePart + fractionPart);
        return create(wholePart);
    }

    function measureFromStyleProperty(el, property) {
        // TODO: handle borders with no style and keywords
        var val = getCssValue(el, property),
		    found = false,
		    size,
            s,
            em,
            rem,
            percent;

        if (!val.contains(PX)) {
            if (property.contains('border-width')) {
                size = getCssValue(el, 'border-style');
                if (size === NONE) {
                    val = '0' + PX;
                    found = true;
                } else {
                    for (s in borderWidths) {
                        if (borderWidths.hasOwnProperty(s)) {
                            if (size === s) {
                                val = borderWidths[s] + PX;
                                found = true;
                                break;
                            }
                        }
                    }
                }
            }
            if (!found) {
                em = val.contains(EM);
                rem = val.contains(REM);
                percent = val.contains(PERCENT);
                if (em || rem) {
                    size = parseInt(getCssValue((em ? el : document.body), 'font-size'), 10);
                    val = (parseInt(val, 10) * size) + PX;
                } else if (percent) {
                    if (property.contains(WIDTH) ||
                            property.contains(LEFT) ||
                                property.contains(RIGHT)) {
                        s = el.parentNode.clientWidth;
                    } else if (property.contains(HEIGHT) ||
                                property.contains(TOP) ||
                                    property.contains(BOTTOM)) {
                        s = el.parentNode.clientHeight;
                    }
                    val = Math.round((parseInt(val, 10) / 100) * s) + PX;
                }
            }
        }
        return measureFromPxString(val);
    }

    return {
        create: create,
        measureFromPx: measureFromPx,
        measureFromStyleProperty: measureFromStyleProperty,
        zero: zero,
        min: min,
        max: max
    };
});