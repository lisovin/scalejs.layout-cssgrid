/*global define */
define(['./consts'], function (consts) {
    'use strict';

    var EMPTY = consts.EMPTY,
        STATIC = consts.STATIC,
        calculatorOperation = {
            minWidth: {},
            maxWidth: {},
            minHeight: {},
            maxHeight: {},
            shrinkToFit: {}
        },
	    gridTrackValue = {
	        auto: { keyword: consts.AUTO },
	        minContent: { keyword: 'min-content' },
	        maxContent: { keyword: 'max-content' },
	        fitContent: { keyword: 'fit-content' },
	        minmax: { keyword: 'minmax' },
            parse: function (trackValueString) {
                switch (trackValueString) {
                case gridTrackValue.auto.keyword:
                    return gridTrackValue.auto;
                case gridTrackValue.minContent.keyword:
                    return gridTrackValue.minContent;
                case gridTrackValue.maxContent.keyword:
                    return gridTrackValue.maxContent;
                case gridTrackValue.fitContent.keyword:
                    return gridTrackValue.fitContent;
                case gridTrackValue.minmax.keyword:
                    return gridTrackValue.minmax;
                default:
                    throw new Error('unknown grid track string: ' + trackValueString);
                }
            }
        },
	    gridAlign = {
	        stretch: { keyword: consts.STRETCH },
	        start: { keyword: 'start' },
	        end: { keyword: 'end' },
	        center: { keyword: 'center' },
            parse: function (alignString) {
                switch (alignString) {
                case gridAlign.start.keyword:
                    return gridAlign.start;
                case gridAlign.end.keyword:
                    return gridAlign.end;
                case gridAlign.center.keyword:
                    return gridAlign.center;
                    // default
                case gridAlign.stretch.keyword:
                case null:
                case EMPTY:
                    return gridAlign.stretch;
                default:
                    throw new Error('unknown grid align string: ' + alignString);
                }
            }
        },
	    position = {
	        "static": { keyword: consts.STATIC },
	        relative: { keyword: consts.RELATIVE },
	        absolute: { keyword: consts.ABSOLUTE },
	        fixed: { keyword: 'fixed' },
            parse : function (positionString) {
                switch (positionString) {
                case position.relative.keyword:
                    return position.relative;
                case position.absolute.keyword:
                    return position.absolute;
                case position.fixed.keyword:
                    return position.fixed;
                    // default
                case position[STATIC].keyword:
                case null:
                case EMPTY:
                    return position[STATIC];
                default:
                    throw new Error('unknown position string: ' + positionString);
                }
            }
	    },

	    blockProgression = {
	        tb: { keyword: 'tb' },
	        bt: { keyword: 'bt' },
	        lr: { keyword: 'lr' },
	        rl: { keyword: 'rl' },
	        parse: function (positionString) {
                switch (positionString) {
            // default
                case blockProgression.tb.keyword:
                case null:
                case EMPTY:
                    return blockProgression.tb;
                case blockProgression.bt.keyword:
                    return blockProgression.bt;
                case blockProgression.lr.keyword:
                    return blockProgression.lr;
                case blockProgression.rl.keyword:
                    return blockProgression.rl;
                default:
                    throw new Error('unknown block-progression string: ' + positionString);
                }
            }
	    },

	    borderWidths = {
	        thin: 0,
	        medium: 0,
	        thick: 0
	    },
	    sizingType = {
	        valueAndUnit: {},
	        keyword: {}
	    };



    return {
        calculatorOperation: calculatorOperation,
        gridTrackValue: gridTrackValue,
        gridAlign: gridAlign,
        position: position,
        blockProgression: blockProgression,
        borderWidths: borderWidths,
        sizingType: sizingType
    };
});