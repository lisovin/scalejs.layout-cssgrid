/*global define */
define([
    './consts',
    './enums',
    './objects'
], function (
    consts,
    enums,
    objects
) {
    'use strict';

    // Parses property string definitions and get an associative array of track objects.

    var regexSpaces = consts.regexSpaces,
        NONE = consts.NONE,
        PERIOD = consts.PERIOD,
        PX = consts.PX,
        PERCENT = consts.PERCENT,
        EM = consts.EM,
        REM = consts.REM,
        FR = consts.FR,
        gridTrackValueEnum = enums.gridTrackValue,
        sizingTypeEnum = enums.sizingType,
        track = objects.track,
        cssValueAndUnit = objects.cssValueAndUnit;

    function isKeywordTrackDefinition(definition) {
        var ret = false;

        switch (definition) {
        case gridTrackValueEnum.auto.keyword:
        case gridTrackValueEnum.minContent.keyword:
        case gridTrackValueEnum.maxContent.keyword:
        case gridTrackValueEnum.fitContent.keyword:
            ret = true;
            break;
        }

        return ret;
    }

    function tryParseCssValue(typedValue) {
        // First match: 0 or more digits, an optional decimal, and any digits after the decimal.
        // Second match: anything after the first match (the unit).
        var expression = /^(\d*\.?\d*)([\w\W]*)/,
            regexResult = typedValue.match(expression),
            valueAndUnit = cssValueAndUnit();

        if (regexResult[0].length > 0 &&
                regexResult[1].length > 0 &&
                    regexResult[2].length > 0) {
            if (regexResult[1].indexOf(PERIOD) < 0) {
                valueAndUnit.value = parseInt(regexResult[1], 10);
            } else {
                valueAndUnit.value = parseFloat(regexResult[1], 10);
            }
            valueAndUnit.unit = regexResult[2];
        }
        return valueAndUnit;
    }

    function isValidCssValueUnit(unit) {
        var ret = false;
        switch (unit) {
        case PX:
        case PERCENT:
        case 'pt':
        case 'pc':
        case 'in':
        case 'cm':
        case 'mm':
        case EM:
        case 'ex':
        case 'vh':
        case 'vw':
        case 'vm':
        case 'ch':
        case REM:
        case FR: // Grid only
            ret = true;
            break;
        }
        return ret;
    }

    function parseGridTracksString(tracksDefinition, trackManager) {
        // TODO: add support for minmax definitions which will involve a more complicated tokenizer than split() (a regex?).
        var trackStrings = tracksDefinition.split(regexSpaces),
            length = trackStrings.length,
            i,
            newTrack,
            valueAndUnit;

        if (length === 1 &&
                (trackStrings[0].length === 0 ||
                 trackStrings[0].toLowerCase() === NONE)) {
            // Empty definition.
            return;
        }

        for (i = 0; i < length; i += 1) {
            trackStrings[i] = trackStrings[i].toLowerCase();

            newTrack = null;
            if (isKeywordTrackDefinition(trackStrings[i])) {
                //throw new Error('Not implemented');
                newTrack = track();
                newTrack.number = i + 1;
                newTrack.size = gridTrackValueEnum.parse(trackStrings[i]);
                newTrack.sizingType = sizingTypeEnum.keyword;
                trackManager.addTrack(newTrack);
            } else {
                // Not a keyword; this is a CSS value.
                valueAndUnit = tryParseCssValue(trackStrings[i]);
                if (valueAndUnit.value === null ||
                        valueAndUnit.unit === null) {
                    throw new Error('Not a keyword or a valid CSS value; track ' + (i + 1) + ' = ' + trackStrings[i] +
                                    '. Invalid track definition "' + trackStrings[i] + '"');
                }

                if (!isValidCssValueUnit(valueAndUnit.unit)) {
                    throw new Error('Invalid track unit "' + valueAndUnit.unit + '"');
                }

                newTrack = track();
                newTrack.number = i + 1;
                newTrack.size = valueAndUnit;
                newTrack.sizingType = sizingTypeEnum.valueAndUnit;
                trackManager.addTrack(newTrack);
            }
        }
    }

    // Parses CSS values into their value and their unit.

    return {
        parseGridTracksString: parseGridTracksString
    };
});