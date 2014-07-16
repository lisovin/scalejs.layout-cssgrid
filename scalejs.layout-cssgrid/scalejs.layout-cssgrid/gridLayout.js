/*global define, document, window, console */
define([
    './gridTracksParser',
    './utils',
    'scalejs.linq-linqjs'
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
    function frameSizeMarginOnly(element, dimension) {
        // for use with offsetWidth and offsetHeight, since they include padding and border already

        var sides = dimension === WIDTH ? [RIGHT, LEFT] : [TOP, BOTTOM],
            size;

        size = sides.reduce(function (result, side) {
            return result +
                getMeasureValue(element, MARGIN + HYPHEN + side)
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
        var autoSizeSum = 0,
            autoTracks = tracks
            .filter(function (track) { return track.type === KEYWORD && track.size === AUTO });

        // tracks without items/elements need size zero;
        autoTracks
            .filter(function (track) { return track.items === undefined })
            .forEach(function (track) {
                track.pixels = 0;
            });

        //tracks with elements take largest element in track
        autoSizeSum += autoTracks
            .filter(function (track) { return track.items; })
            .reduce(function (size, track) {
                var noFrItems,
                    trackSize,
                    offsetProperty = 'offset' + (dimension === WIDTH ? 'Width' : 'Height'),
                    tracksProperty = (dimension === WIDTH ? 'column' : 'row') + 'Tracks',
                    trackSizes;
                // find first item that has no FR rows.
                // Then use it's size to determine track size.
                noFrItems = track.items.filter(function (item) {
                    return item[tracksProperty].reduce(function (r, tr) {
                        return r && tr.type !== FR;
                    }, true);
                })



                trackSizes = noFrItems
                    .filter(function (noFrItem) {
                        var display = window.getComputedStyle(noFrItem.element).display;
                        return display !== 'none';
                    })
                    .select(function (noFrItem) {
                        var ceil = Math.ceil(parseFloat(noFrItem.element.style[dimension], 10)),
                                frameSz = frameSize(noFrItem.element, dimension),
                                track_pixels;
                        trackSize = ceil + frameSz;
                        //ceil can be NaN when no width/height is defined
                        if (isNaN(trackSize)) {
                            noFrItem.element.style[dimension] = '';
                            ceil = noFrItem.element[offsetProperty];
                            frameSz = frameSizeMarginOnly(noFrItem.element, dimension);
                            trackSize = ceil + frameSz;
                        }

                        // set it to 0 so that reduce would properly calculate
                        track_pixels = 0;
                        track_pixels = noFrItem[tracksProperty].reduce(function (r, tr) { return r - ((tr.pixels !== undefined) ? (tr.pixels) : (0)); }, trackSize);

                        return track_pixels;
                    }).toArray();

                if (trackSizes !== undefined && trackSizes.length > 0) {
                    track.pixels = trackSizes.max();
                } else {
                    track.pixels = 0;
                }

                return size + track.pixels;
            }, 0);

        return autoSizeSum;
    }

    function frTracks(tracks, size) {
        var frs,
            totalFRs;

        frs = tracks.filter(function (track) { return track.type === FR; });
        totalFRs = frs.reduce(function (sum, track) { return sum + track.size; }, 0);

        frs.forEach(function (track) {
            var planned_size = size * track.size / totalFRs;
            track.pixels = Math.max(0, planned_size);
        });
    }

    function sizeTracks(tracks, size, dimension) {
        size -= pxTracks(tracks);
        size -= autoTracks(tracks, dimension);

        frTracks(tracks, size);
    }

    /*jslint unparam:true*/
    return function gridLayout(gridElement, properties, media, gridItems) {
        var columnTracks,
            rowTracks,
            mappedItems,
            prevParentPos,
            computedColumns,
            computedRows,
            sumGridWidth,
            sumGridHeight;

        columnTracks = gridTracksParser.parse(properties[GRIDCOLUMNS]);
        rowTracks = gridTracksParser.parse(properties[GRIDROWS]);

        mappedItems = mapGridItemsToTracks(gridItems, columnTracks, rowTracks);

        sizeTracks(columnTracks, gridElement.offsetWidth, WIDTH);
        sizeTracks(rowTracks, gridElement.offsetHeight, HEIGHT);
        //console.log(width, height);

        //message about errors
        columnTracks.forEach(function (t) {
            if ((t.pixels === undefined) || isNaN(t.pixels)) {
                console.log('Unable to calculate column size for ', gridElement, t.index, t.type, t.size, t.pixels);
            }
        });
        //message about errors
        rowTracks.forEach(function (t) {
            if ((t.pixels === undefined) || isNaN(t.pixels)) {
                console.log('Unable to calculate row size for ', gridElement, t.index, t.type, t.size, t.pixels);
            }
        });

        //give computed track sizes to grid parent
        computedColumns = columnTracks.select(function (columnTrack) {
            return columnTrack.pixels + 'px';
        }).toArray().join(' ');
        gridElement.setAttribute('data-grid-computed-columns', computedColumns);
        computedRows = rowTracks.select(function (rowTrack) {
            return rowTrack.pixels + 'px';
        }).toArray().join(' ');
        gridElement.setAttribute('data-grid-computed-rows', computedRows);

        /* WIP expand grid based on content. hard to allow resizing and expanded parent.
        if (utils.safeGetStyle(gridElement, 'width') === undefined) {
            sumGridWidth = columnTracks.select(function (columnTrack) {
                return columnTrack.pixels;
            }).toArray().reduce(function (a, b) {
                return a + b;
            }, 0);
            utils.safeSetStyle(gridElement, 'width', sumGridWidth + PX);
        }
        if (utils.safeGetStyle(gridElement, 'height') === undefined) {
            sumGridHeight = rowTracks.select(function (rowTrack) {
                return rowTrack.pixels;
            }).toArray().reduce(function (a, b) {
                return a + b;
            }, 0);
            utils.safeSetStyle(gridElement, 'height', sumGridHeight + PX);
        }*/


        gridElement.setAttribute('data-grid-parent', 'true');
        if (gridElement.hasAttribute('data-grid-child')) {
            utils.safeSetStyle(gridElement, 'position', 'absolute');
        } else {
            utils.safeSetStyle(gridElement, 'position', 'relative');
        }

        //gridElement.style.position = 'relative';
        //console.log('--->' + properties[GRIDROWS]);
        //console.log(gridTracksParser.parse(properties[GRIDROWS]));
        //console.log('-->gridLayout', gridElement, properties, grid_items);

        mappedItems.forEach(function (item) {
            var width,
                height,
                left,
                top,
                trackWidth,
                trackHeight,
                trackLeft,
                trackTop,
                itemComputedStyle,
                itemWidth,
                itemHeight,
                itemFrame,
                itemPadding,
                parentComputedStyle,
                parentPadding;

            //set attributes for identifying children
            item.element.setAttribute('data-grid-child', 'true');
            utils.safeSetStyle(item.element, 'position', 'absolute');

            //get track size
            trackWidth = columnTracks
                .filter(function (track) { return track.index >= item.column && track.index < item.column + item.columnSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackHeight = rowTracks
                .filter(function (track) { return track.index >= item.row && track.index < item.row + item.rowSpan; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackLeft = columnTracks
                .filter(function (track) { return track.index < item.column; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            trackTop = rowTracks
                .filter(function (track) { return track.index < item.row; })
                .reduce(function (sum, track) { return sum + track.pixels; }, 0);

            //get required info and then calculate padding/margin/borders for element
            itemComputedStyle = window.getComputedStyle(item.element);
            itemWidth = parseInt(itemComputedStyle.width, 10);
            itemHeight = parseInt(itemComputedStyle.height, 10);
            itemFrame = {
                top: (parseInt(itemComputedStyle['margin-top'], 10) || 0) + (parseInt(itemComputedStyle['border-top-width'], 10) || 0),
                right: (parseInt(itemComputedStyle['margin-right'], 10) || 0) + (parseInt(itemComputedStyle['border-right-width'], 10) || 0),
                bottom: (parseInt(itemComputedStyle['margin-bottom'], 10) || 0) + (parseInt(itemComputedStyle['border-bottom-width'], 10) || 0),
                left: (parseInt(itemComputedStyle['margin-left'], 10) || 0) + (parseInt(itemComputedStyle['border-left-width'], 10) || 0)
            };
            itemPadding = {
                top: (parseInt(itemComputedStyle['padding-top'], 10) || 0),
                right: (parseInt(itemComputedStyle['padding-right'], 10) || 0),
                bottom: (parseInt(itemComputedStyle['padding-bottom'], 10) || 0),
                left: (parseInt(itemComputedStyle['padding-left'], 10) || 0)
            };
            parentComputedStyle = window.getComputedStyle(gridElement);
            parentPadding = {
                top: (parseInt(parentComputedStyle['padding-top'], 10) || 0),
                right: (parseInt(parentComputedStyle['padding-right'], 10) || 0),
                bottom: (parseInt(parentComputedStyle['padding-bottom'], 10) || 0),
                left: (parseInt(parentComputedStyle['padding-left'], 10) || 0)
            };

            //get offset+size based on alignment
            if (item.styles.properties['grid-row-align'] === 'stretch') {
                height = trackHeight - (itemFrame.top + itemFrame.bottom);
                top = trackTop;
            } else if (item.styles.properties['grid-row-align'] === 'start') {
                height = undefined; //gridlayout wont overwrite the size
                top = trackTop + itemFrame.top;
            } else if (item.styles.properties['grid-row-align'] === 'end') {
                height = undefined; //gridlayout wont overwrite the size
                top = trackTop + trackHeight - itemHeight - (itemFrame.bottom + itemFrame.top);
            } else if (item.styles.properties['grid-row-align'] === 'center') {
                height = undefined; //gridlayout wont overwrite the size
                top = trackTop + (trackHeight - itemHeight) / 2;
            } else {
                console.log('invalid -ms-grid-row-align property for ', item);
            }

            if (item.styles.properties['grid-column-align'] === 'stretch') {
                width = trackWidth - (itemFrame.left + itemFrame.right);
                left = trackLeft;
            } else if (item.styles.properties['grid-column-align'] === 'start') {
                width = undefined; //gridlayout wont overwrite the size
                left = trackLeft + itemFrame.left;
            } else if (item.styles.properties['grid-column-align'] === 'end') {
                width = undefined; //gridlayout wont overwrite the size
                left = trackLeft + trackWidth - itemWidth - (itemFrame.right + itemFrame.left);
            } else if (item.styles.properties['grid-column-align'] === 'center') {
                width = undefined; //gridlayout wont overwrite the size
                left = trackLeft + (trackWidth - itemWidth) / 2;
            } else {
                console.log('invalid -ms-grid-column-align property for ', item);
            }

            //offset by parent padding
            left += parentPadding.left;
            top += parentPadding.top;

            //if grid layout is setting width/height (varies based on alignment) , set w/h now
            if (width !== undefined) width -= itemPadding.left + itemPadding.right;
            if (height !== undefined) height -= itemPadding.top + itemPadding.bottom;


            if (width !== undefined) utils.safeSetStyle(item.element, 'width', width + PX);
            if (height !== undefined) utils.safeSetStyle(item.element, 'height', height + PX);
            utils.safeSetStyle(item.element, 'left', left + PX);
            utils.safeSetStyle(item.element, 'top', top + PX);
        });
    };
});