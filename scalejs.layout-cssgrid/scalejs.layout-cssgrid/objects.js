/*global define */
define(['./enums'], function (enums) {
    'use strict';

    function track() {
        return {
            number: null,
            size: null,
            sizingType: null,
            items: [],
            measure: null,
            minMeasure: null,
            maxMeasure: null,
            contentSizedTrack: false,
            implicit: false
        };
    }

    function implicitTrackRange() {
        return {
            firstNumber: null,
            span: null,
            size: enums.gridTrackValue.auto,
            sizingType: enums.sizingType.keyword,
            items: [],
            measure: null
        };
    }

    function widthAndHeight() {
        return {
            width: null,
            height: null
        };
    }

    function cssValueAndUnit() {
        return {
            value: null,
            unit: null
        };
    }

    function item() {
        return {
            itemElement: null,
            styles: null,
            position: null,
            column: 1,
            columnSpan: 1,
            columnAlign: enums.gridAlign.stretch,
            row: 1,
            rowSpan: 1,
            rowAlign: enums.gridAlign.stretch,
            // Used width calculated during column track size resolution.
            usedWidthMeasure: null,
            maxWidthMeasure: null,
            maxHeightMeasure: null,
            shrinkToFitSize: null, // physical dimensions
            verified: {
                columnBreadth: false,
                rowBreadth: false,
                columnPosition: false,
                rowPosition: false
            }
        };
    }

    return {
        track: track,
        implicitTrackRange: implicitTrackRange,
        item: item,
        widthAndHeight: widthAndHeight,
        cssValueAndUnit: cssValueAndUnit
    };
});