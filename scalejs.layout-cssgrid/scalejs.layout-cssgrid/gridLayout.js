/*global define, document, window */
define([
    './gridTracksParser',
    './utils'
], function (
    gridTracksParser,
    utils
) {
    'use strict';

    var GRIDCOLUMN = 'grid-column',
        GRIDCOLUMNS = 'grid-columns',
        GRIDCOLUMNSPAN = 'grid-column-span',
        GRIDROW = 'grid-row',
        GRIDROWS = 'grid-rows',
        GRIDROWSPAN = 'grid-row-span',
        KEYWORD = 'keyword',
        FR = 'fr',
        AUTO = 'auto',
        PX = 'px',
        TOP = 'top',
        RIGHT = 'right',
        BOTTOM = 'bottom',
        LEFT = 'left',
        WIDTH = 'width',
        HEIGHT = 'height',
        MARGIN = 'margin',
        PADDING = 'padding',
        BORDER = 'border',
        HYPHEN = '-',
        getMeasureValue = utils.getMeasureValue;


    function addItemToTracks(tracks, itemTracks, item, firstTrack, lastTrack) {
        tracks
            .filter(function (track) { return track.index >= firstTrack && track.index <= lastTrack; })
            .forEach(function (track) {
                if (track.items === undefined) {
                    track.items = [];
                }
                track.items.push(item);
                itemTracks.push(track);
            });
    }

    function mapGridItemsToTracks(gridItems, columnTracks, rowTracks) {
        return gridItems.map(function (curItem) {
            var newItem = {};

            newItem.column = parseInt(curItem.details.properties[GRIDCOLUMN], 10);

            if (isNaN(newItem.column)) {
                newItem.column = 1;
            }

            newItem.columnSpan = parseInt(curItem.details.properties[GRIDCOLUMNSPAN], 10);
            if (isNaN(newItem.columnSpan)) {
                newItem.columnSpan = 1;
            }

            newItem.row = parseInt(curItem.details.properties[GRIDROW], 10);
            if (isNaN(newItem.row)) {
                newItem.row = 1;
            }

            newItem.rowSpan = parseInt(curItem.details.properties[GRIDROWSPAN], 10);
            if (isNaN(newItem.rowSpan)) {
                newItem.rowSpan = 1;
            }

            newItem.element = curItem.element;
            newItem.styles = curItem.details;
            newItem.columnTracks = [];
            newItem.rowTracks = [];

            addItemToTracks(columnTracks, newItem.columnTracks, newItem, newItem.column, newItem.column + newItem.columnSpan - 1);
            addItemToTracks(rowTracks, newItem.rowTracks, newItem, newItem.row, newItem.row + newItem.rowSpan - 1);

            return newItem;
        });
    }

    function frameSize(element, dimension) {
        var sides = dimension === WIDTH ? [RIGHT, LEFT] : [TOP, BOTTOM],
            size;

        size = sides.reduce(function (result, side) {
            return result +
                getMeasureValue(element, MARGIN + HYPHEN + side) +
                getMeasureValue(element, PADDING + HYPHEN + side) +
                getMeasureValue(element, BORDER + HYPHEN + side + HYPHEN + WIDTH);
        }, 0);

        return size;
    }

    function pxTracks(tracks) {
        return tracks
            .filter(function (track) { return track.type === PX; })
            .reduce(function (size, track) {
                track.pixels = track.size;
                return size + track.pixels;
            }, 0);
    }

    function autoTracks(tracks, dimension) {
        return tracks
             .filter(function (track) { return track.type === KEYWORD && track.size === AUTO && track.items; })
             .reduce(function (size, track) {
                var noFrItems,
                    noFrItem,
                    trackSize,
                    offsetProperty = 'offset' + (dimension === WIDTH ? 'Width' : 'Height'),
                    tracksProperty = (dimension === WIDTH ? 'column' : 'row') + 'Tracks';
                // find first item that has no FR rows.
                // Then use it's size to determine track size.
                noFrItems = track.items.filter(function (item) {
                    return item[tracksProperty].reduce(function (r, tr) {
                        return r && tr.type !== FR;
                    }, true);
                });

                noFrItem = noFrItems[0];
                if (noFrItem) {
                    //trackSize = getMeasureValue(noFrItem.element, dimension) + frameSize(noFrItem.element, dimension);
                    trackSize = Math.ceil(parseFloat(noFrItem.element.style[dimension], 10)) + frameSize(noFrItem.element, dimension);
                    if (isNaN(trackSize)) {
                        noFrItem.element.style[dimension] = '';
                        trackSize = noFrItem.element[offsetProperty];
                    }
                    // set it to 0 so that reduce would properly calculate
                    track.pixels = 0;
                    track.pixels = noFrItem[tracksProperty].reduce(function (r, tr) { return r - tr.pixels; }, trackSize);
                } else {
                    track.pixels = 0;
                }

                return size + track.pixels;
            }, 0);
    }

    function frTracks(tracks, size) {
        var frs,
            totalFRs;

        frs = tracks.filter(function (track) { return track.type === FR; });
        totalFRs = frs.reduce(function (sum, track) { return sum + track.size; }, 0);

        frs.forEach(function (track) {
            track.pixels = size * track.size / totalFRs;
        });
    }

    function sizeTracks(tracks, size, dimension) {
        size -= pxTracks(tracks);
        size -= autoTracks(tracks, dimension);

        frTracks(tracks, size);
    }

    /*jslint unparam:true*/
    return function gridLayout(gridElement, selector, properties, media, gridItems) {
        var columnTracks,
            rowTracks,
            mappedItems;

        columnTracks = gridTracksParser.parse(properties[GRIDCOLUMNS]);
        rowTracks = gridTracksParser.parse(properties[GRIDROWS]);

        mappedItems = mapGridItemsToTracks(gridItems, columnTracks, rowTracks);

        sizeTracks(columnTracks, gridElement.offsetWidth, WIDTH);
        sizeTracks(rowTracks, gridElement.offsetHeight, HEIGHT);
        //console.log(width, height);

        //gridElement.style.position = 'relative';
        //console.log('--->' + properties[GRIDROWS]);
        //console.log(gridTracksParser.parse(properties[GRIDROWS]));
        //console.log('-->gridLayout', gridElement, properties, grid_items);
        mappedItems.forEach(function (item) {
            var width,
                height,
                left,
                top,
                parentLeft = 0,
                parentTop = 0;

            item.element.style.position = 'absolute';

            width = columnTracks
                .filter(function (track) { return track.index >= item.column && track.index < item.column + item.columnSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            height = rowTracks
                .filter(function (track) { return track.index >= item.row && track.index < item.row + item.rowSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            left = columnTracks
                .filter(function (track) { return track.index < item.column; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            top = rowTracks
                .filter(function (track) { return track.index < item.row; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            if (item.element.parentNode) {
                parentLeft = parseInt(item.element.parentNode.left, 10);
                if (isNaN(parentLeft)) {
                    parentLeft = 0;
                }
            }

            if (item.element.parentNode) {
                parentTop = parseInt(item.element.parentNode.top, 10);
                if (isNaN(parentTop)) {
                    parentTop = 0;
                }
            }

            width -= frameSize(item.element, WIDTH);
            height -= frameSize(item.element, HEIGHT);

            //console.log(item.element.id, width, height);

            item.element.style.width = width + PX;
            item.element.style.height = height + PX;
            item.element.style.left = left + parentLeft + PX;
            item.element.style.top = top + parentTop + PX;
        });
    };
});