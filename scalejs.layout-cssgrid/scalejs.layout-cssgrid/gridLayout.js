/*global define, document, window */
define([
    './consts',
    './enums',
    './objects',
    './utils',
    './layoutMeasure',
    './trackManager',
    './propertyParser',
    './boxSizeCalculator',
    './intrinsicSizeCalculator'
], function (
    consts,
    enums,
    objects,
    utils,
    layoutMeasure,
    trackManager,
    propertyParser,
    boxSizeCalculator,
    intrinsicSizeCalculator
) {
    'use strict';

    var BLOCKPROGRESSION = consts.BLOCKPROGRESSION,
        EMPTY = consts.EMPTY,
        OPEN_CURLY = consts.OPEN_CURLY,
        ABSOLUTE = consts.ABSOLUTE,
        CLOSE_CURLY = consts.CLOSE_CURLY,
        RELATIVE = consts.RELATIVE,
        STATIC = consts.STATIC,
        PERIOD = consts.PERIOD,
        GRIDLAYOUT = consts.GRIDLAYOUT,
        GRIDCOLUMNS = consts.GRIDCOLUMNS,
        GRIDROWS = consts.GRIDROWS,
        GRIDCOLUMN = consts.GRIDCOLUMN,
        GRIDCOLUMNSPAN = consts.GRIDCOLUMNSPAN,
        GRIDROW = consts.GRIDROW,
        GRIDROWSPAN = consts.GRIDROWSPAN,
        GRIDROWALIGN = consts.GRIDROWALIGN,
        GRIDCOLUMNALIGN = consts.GRIDCOLUMNALIGN,
        NONE = consts.NONE,
        TOP = consts.TOP,
        RIGHT = consts.RIGHT,
        BOTTOM = consts.BOTTOM,
        LEFT = consts.LEFT,
        INLINEGRID = consts.INLINEGRID,
        MARGIN = consts.MARGIN,
        HYPHEN = consts.HYPHEN,
        PADDING = consts.PADDING,
        BORDER = consts.BORDER,
        WIDTH = consts.WIDTH,
        HEIGHT = consts.HEIGHT,
        AUTO = consts.AUTO,
        PX = consts.PX,
        FR = consts.FR,
        DISPLAY = consts.DISPLAY,
        COLON = consts.COLON,
        SEMICOL = consts.SEMICOL,
        STYLE = consts.STYLE,
        BOXSIZING = consts.BOXSIZING,
        MIN = consts.MIN,
        MAX = consts.MAX,
        POSITION = consts.POSITION,
        STRETCH = consts.STRETCH,
        precision = consts.precision,
        blockProgressionEnum = enums.blockProgression,
        positionEnum = enums.position,
        gridAlignEnum = enums.gridAlign,
        sizingTypeEnum = enums.sizingType,
        borderWidthsEnum = enums.borderWidths,
        blockProgressionStringToEnum = blockProgressionEnum.parse,
        positionStringToEnum = positionEnum.parse,
        gridAlignStringToEnum = gridAlignEnum.parse,
        gridTrackValue = enums.gridTrackValue,
        widthAndHeight = objects.widthAndHeight,
        item = objects.item,
        getCssValue = utils.getCssValue,
        createBoundedWrapper = utils.createBoundedWrapper,
        defined = utils.defined,
        makeUniqueClass = utils.makeUniqueClass,
        addClass = utils.addClass,
        embedCss = utils.embedCss,
        clearEmbeddedCss = utils.clearEmbeddedCss,
        div = document.createElement('div');


    return function cssGridLayout(element, selector, properties, media, grid_items) {
        var gridElement = element,
            blockProgression = blockProgressionStringToEnum(getCssValue(element, BLOCKPROGRESSION)),
            availableSpaceForColumns = null,
            availableSpaceForRows = null,
            items = null,
            columnTrackManager = trackManager(),
            rowTrackManager = trackManager(),
            useAlternateFractionalSizingForColumns = false,
            useAlternateFractionalSizingForRows = false,
            error = false;

        function determineSize(dimension, margins, padding, borders) {
            var parent = gridElement.parentNode,
                one = dimension === WIDTH ? LEFT : TOP,
                two = dimension === WIDTH ? RIGHT : BOTTOM,
                size = dimension === WIDTH ? parent.offsetWidth : parent.offsetHeight,
                border1 = layoutMeasure.measureFromStyleProperty(parent, BORDER + HYPHEN + one + HYPHEN + WIDTH),
                border2 = layoutMeasure.measureFromStyleProperty(parent, BORDER + HYPHEN + two + HYPHEN + WIDTH),
                padd1 = layoutMeasure.measureFromStyleProperty(parent, PADDING + HYPHEN + one),
                padd2 = layoutMeasure.measureFromStyleProperty(parent, PADDING + HYPHEN + two);

            size -= (border1.getRawMeasure() + border2.getRawMeasure() +
                        padd1.getRawMeasure() + padd2.getRawMeasure() +
                        margins[one].getRawMeasure() + margins[two].getRawMeasure() +
                        borders[one].getRawMeasure() + borders[two].getRawMeasure() +
                        padding[one].getRawMeasure() + padding[two].getRawMeasure());

            return size;
        }

        function verticalScrollbarWidth() {
            return window.innerWidth - document.documentElement.clientWidth;
        }

        function horizontalScrollbarHeight() {
            return window.innerHeight - document.documentElement.clientHeight;
        }

        function shouldSwapWidthAndHeight() {
            return (blockProgression === blockProgressionEnum.lr ||
                     blockProgression === blockProgressionEnum.rl);
        }


        /* Determines the available space for the grid by:
         * 1. Swapping in a dummy block|inline-block element where the grid 
         *    element was with one fractionally sized column and one fractionally sized row,
         *    causing it to take up all available space.
         *    a. If getting the cascaded (not used) style is possible (IE only),
         *          copy the same width/height/box-sizing values to ensure the available
         *          space takes into account explicit constraints.
         * 2. Querying for the used widths/heights
         * 3. Swapping back the real grid element
         * Yes, this depends on the dummy block|inline-block sizing to work correctly.
         **/
        function determineGridAvailableSpace() {
            var dummy = gridElement.cloneNode(false),
                gridProperties = properties,
                gridElementParent = gridElement.parentNode,
                isInlineGrid,
                zero = '0px',
                sides = [TOP, RIGHT, BOTTOM, LEFT],
                margins = {},
                padding = {},
                borders = {},
                //innerHTML,
                //s,
                width,
                height,
                floated,
                widthToUse,
                heightToUse,
                //marginToUse,
                //borderWidthToUse,
                //borderStyleToUse,
                //paddingToUse,
                cssText,
                scrollWidth,
                scrollHeight,
                removedElement,
                widthAdjustment,
                heightAdjustment,
                widthMeasure,
                heightMeasure,
                widthAdjustmentMeasure,
                heightAdjustmentMeasure;

            // we need to get grid props from the passed styles
            isInlineGrid = gridProperties.display === INLINEGRID ? true : false;

            // Get each individual margin, border, and padding value for
            // using with calc() when specifying the width/height of the dummy element.
            sides.forEach(function (side) {
                margins[side] = layoutMeasure.measureFromStyleProperty(gridElement, MARGIN + HYPHEN + side);
                padding[side] = layoutMeasure.measureFromStyleProperty(gridElement, PADDING + HYPHEN + side);
                borders[side] = layoutMeasure.measureFromStyleProperty(gridElement, BORDER + HYPHEN + side + HYPHEN + WIDTH);
            });

            // If the grid has an explicit width and/or height, that determines the available space for the tracks.
            // If there is none, we need to use alternate fractional sizing. The exception is if we are a non-inline grid;
            // in that case, we are a block element and take up all available width.
            // TODO: ensure we do the right thing for floats.
            // need to remove the content to ensure we get the right height
            gridElementParent.insertBefore(dummy, gridElement);
            width = getCssValue(dummy, WIDTH);
            floated = getCssValue(gridElement, 'float');
            if (width === zero) { width = AUTO; }
            if (width === AUTO &&
                    (isInlineGrid ||
                        floated === LEFT ||
                        floated === RIGHT)) {
                useAlternateFractionalSizingForColumns = true;
            }
            height = getCssValue(dummy, HEIGHT);
            if (height === zero) { height = AUTO; }
            if (height === AUTO) {
                useAlternateFractionalSizingForRows = true;
            }
            // remove the dummy
            gridElementParent.removeChild(dummy);

            // build the straw man for getting dimensions
            dummy = document.createElement(gridElement.tagName);
            widthToUse = width !== AUTO
                ? width
                : determineSize(WIDTH, margins, padding, borders) + PX;

            heightToUse = height !== AUTO
                ? height
                : determineSize(HEIGHT, margins, padding, borders) + PX;

            cssText = DISPLAY + COLON + (!isInlineGrid ? "block" : "inline-block") + SEMICOL
                    + MARGIN + COLON + getCssValue(gridElement, MARGIN) + SEMICOL
                    + BORDER + HYPHEN + WIDTH + COLON + getCssValue(gridElement, BORDER + HYPHEN + WIDTH) + SEMICOL
                    + PADDING + COLON + getCssValue(gridElement, PADDING) + SEMICOL
                    + BORDER + STYLE + COLON + getCssValue(gridElement, BORDER + STYLE) + SEMICOL
                    + WIDTH + COLON + widthToUse + SEMICOL
                    + HEIGHT + COLON + heightToUse + SEMICOL
                    + BOXSIZING + COLON + getCssValue(gridElement, BOXSIZING) + SEMICOL
                    + MIN + WIDTH + COLON + getCssValue(gridElement, MIN + WIDTH) + SEMICOL
                    + MIN + HEIGHT + COLON + getCssValue(gridElement, MIN + HEIGHT) + SEMICOL
                    + MAX + WIDTH + COLON + getCssValue(gridElement, MAX + WIDTH) + SEMICOL
                    + MAX + HEIGHT + COLON + getCssValue(gridElement, MAX + HEIGHT) + SEMICOL;
            dummy.style.cssText = cssText;

            // Determine width/height (if any) of scrollbars are showing with the grid element on the page.
            scrollWidth = verticalScrollbarWidth();
            scrollHeight = horizontalScrollbarHeight();

            // Insert before the real grid element.
            gridElementParent.insertBefore(dummy, gridElement);

            // Remove the real grid element.
            removedElement = gridElementParent.removeChild(gridElement);

            // The dummy item should never add scrollbars if the grid element didn't.
            widthAdjustment = width !== AUTO ? 0 : scrollWidth - verticalScrollbarWidth();
            heightAdjustment = height !== AUTO ? 0 : scrollHeight - horizontalScrollbarHeight();
            // get the final measurements
            widthMeasure = layoutMeasure.measureFromStyleProperty(dummy, WIDTH);
            heightMeasure = layoutMeasure.measureFromStyleProperty(dummy, HEIGHT);
            widthAdjustmentMeasure = layoutMeasure.measureFromPx(widthAdjustment);
            heightAdjustmentMeasure = layoutMeasure.measureFromPx(heightAdjustment);

            // Get the content width/height; this is the available space for tracks and grid items to be placed in.
            if (!shouldSwapWidthAndHeight()) {
                availableSpaceForColumns = widthMeasure.subtract(widthAdjustmentMeasure);
                availableSpaceForRows = heightMeasure.subtract(heightAdjustmentMeasure);
            } else {
                availableSpaceForColumns = heightMeasure.subtract(heightAdjustmentMeasure);
                availableSpaceForRows = widthMeasure.subtract(widthAdjustmentMeasure);
            }

            // Restore the DOM.
            gridElementParent.insertBefore(removedElement, dummy);
            gridElementParent.removeChild(dummy);
        }

        // Creates track objects for implicit tracks if needed.
        function ensureTracksExist(trackManager, firstTrackNumber, lastTrackNumber) {
            /* TODO: we need a better data structure for tracks created by spans.
             * If a grid item has a really high span value,
             * we currently end up creating implicit tracks for every one of the
             * implicit tracks (span 100000=>100000 tracks created).
             * Instead, a single track object should be able to represent multiple
             * implicit tracks. The number of implicit tracks it represents would 
             * be used during the track sizing algorithm when redistributing space
             * among each of the tracks to ensure it gets the right proportional amount.
             **/
            trackManager.ensureTracksExist(firstTrackNumber, lastTrackNumber);
        }

        // Traverses all tracks that the item belongs to and adds a reference to it in each of the track objects.
        function addItemToTracks(trackManager, itemToAdd, firstTrackNumber, lastTrackNumber) {
            var i,
                tracks = trackManager.tracks.length,
                implicitTrackIndex,
                implicitTracks = trackManager.implicitTracks;

            for (i = 0; i < tracks; i += 1) {
                if (trackManager.tracks[i].number === firstTrackNumber) {
                    trackManager.tracks[i].items.push(itemToAdd);
                } else if (trackManager.tracks[i].number > firstTrackNumber) {
                    break;
                }
            }
            // TODO: check if we can remove 
            for (implicitTrackIndex = 0; implicitTrackIndex < implicitTracks; implicitTrackIndex += 1) {
                if (firstTrackNumber >= trackManager.implicitTracks[implicitTrackIndex].firstNumber &&
                        lastTrackNumber <= trackManager.implicitTracks[implicitTrackIndex].length) {
                    trackManager.implicitTracks[implicitTrackIndex].items.push(itemToAdd);
                }
            }
        }

        function mapGridItemsToTracks() {
            items = grid_items.map(function (curItem) {
                var column,
                    columnSpan,
                    row,
                    rowSpan,
                    columnAlignString,
                    columnAlign,
                    rowAlignString,
                    rowAlign,
                    boxSizing,
                    newItem,
                    firstColumn,
                    lastColumn,
                    firstRow,
                    lastRow;

                column = parseInt(curItem.details.properties[GRIDCOLUMN], 10);

                if (isNaN(column)) {
                    error = true;
                    // console.log("column is NaN");
                    column = 1;
                }

                columnSpan = parseInt(curItem.details.properties[GRIDCOLUMNSPAN], 10);
                if (isNaN(columnSpan)) {
                    error = true;
                    // console.log("column-span is NaN");
                    columnSpan = 1;
                }

                row = parseInt(curItem.details.properties[GRIDROW], 10);
                if (isNaN(row)) {
                    error = true;
                    // console.log("row is NaN");
                    row = 1;
                }

                rowSpan = parseInt(curItem.details.properties[GRIDROWSPAN], 10);
                if (isNaN(rowSpan)) {
                    error = true;
                    // console.log("row-span is NaN");
                    rowSpan = 1;
                }

                columnAlignString = curItem.details.properties[GRIDCOLUMNALIGN] || EMPTY;
                if (columnAlignString.length === 0) {
                    error = true;
                    // console.log("getPropertyValue for " + GRIDCOLUMNALIGN + " is an empty string");
                }
                columnAlign = gridAlignStringToEnum(columnAlignString);

                rowAlignString = curItem.details.properties[GRIDROWALIGN] || EMPTY;
                if (rowAlignString.length === 0) {
                    error = true;
                    // console.log("getPropertyValue for " + GRIDROWALIGN + " is an empty string");
                }
                rowAlign = gridAlignStringToEnum(rowAlignString);

                // TODO: handle directionality. These properties are physical; we probably need to map them to logical values.
                boxSizing = getCssValue(curItem.element, BOXSIZING);

                newItem = item();
                newItem.itemElement = curItem.element;
                newItem.styles = curItem.details;
                newItem.column = column;
                newItem.columnSpan = columnSpan;
                newItem.columnAlign = columnAlign;
                newItem.row = row;
                newItem.rowSpan = rowSpan;
                newItem.rowAlign = rowAlign;

                firstColumn = newItem.column;
                lastColumn = firstColumn + newItem.columnSpan - 1;
                firstRow = newItem.row;
                lastRow = firstRow + newItem.rowSpan - 1;

                // Ensure implicit track definitions exist for all tracks this item spans.
                ensureTracksExist(columnTrackManager, firstColumn, lastColumn);
                ensureTracksExist(rowTrackManager, firstRow, lastRow);

                // place the items as appropriate
                addItemToTracks(columnTrackManager, newItem, firstColumn, lastColumn);
                addItemToTracks(rowTrackManager, newItem, firstRow, lastRow);

                return newItem;
            });
        }

        function saveItemPositioningTypes() {
            // console.log('saving positioning types');
            items.forEach(function (item) {
                if (item.position === null) {
                    item.position = positionStringToEnum(getCssValue(item.itemElement, POSITION));
                }
            });
        }

        function usePhysicalWidths(blockProgression, verifyingColumns) {
            var ret = false;
            if (((blockProgression === blockProgressionEnum.tb ||
                     blockProgression === blockProgressionEnum.bt) &&
                     verifyingColumns === true) ||
                    ((blockProgression === blockProgressionEnum.lr ||
                        blockProgression === blockProgressionEnum.rl) &&
                        verifyingColumns === false)) {
                ret = true;
            }
            return ret;
        }


        // Inserts an empty grid item into a given track and gets its size.
        function getActualTrackMeasure(trackNumber, computingColumns) {
            var blockProgression, trackMeasure,
                dummyItem = div.cloneNode(true),
                cssText = "margin:0px;border:0px;padding:0px;"
                + (computingColumns ? GRIDCOLUMNALIGN : GRIDROWALIGN)
                + COLON + STRETCH + SEMICOL
                + (computingColumns ? GRIDCOLUMN : GRIDROW)
                + COLON + trackNumber + SEMICOL;

            dummyItem.style.cssText = cssText;

            dummyItem = gridElement.appendChild(dummyItem);
            blockProgression = blockProgressionStringToEnum(getCssValue(gridElement, BLOCKPROGRESSION));
            trackMeasure = usePhysicalWidths(blockProgression, computingColumns)
                                ? layoutMeasure.measureFromStyleProperty(dummyItem, WIDTH)
                                : layoutMeasure.measureFromStyleProperty(dummyItem, HEIGHT);

            gridElement.removeChild(dummyItem);
            return trackMeasure;
        }

        function getSumOfTrackMeasures(trackManager) {
            var sum = layoutMeasure.zero(),
                trackIter = trackManager.getIterator(),
                curTrack = trackIter.next();

            while (curTrack !== null) {
                sum = sum.add(curTrack.measure);
                curTrack = trackIter.next();
            }

            return sum;
        }

        function compareAutoTracksAvailableGrowth(a, b) {
            var availableGrowthA = a.maxMeasure.subtract(a.measure),
                availableGrowthB = b.maxMeasure.subtract(b.measure);

            if (availableGrowthA.getRawMeasure() < availableGrowthB.getRawMeasure()) {
                return -1;
            }

            if (availableGrowthA.getRawMeasure() > availableGrowthB.getRawMeasure()) {
                return 1;
            }

            return 0;
        }

        function trackIsFractionSized(trackToCheck) {
            return (trackToCheck.sizingType === sizingTypeEnum.valueAndUnit &&
                     trackToCheck.size.unit === FR);
        }

        function getSumOfSpannedTrackMeasures(trackManager, firstTrackNum, numSpanned) {
            var sum,
                tracks = trackManager.getTracks(firstTrackNum, firstTrackNum + numSpanned - 1);

            sum = tracks.reduce(function (acc, track) {
                return acc.add(track.measure);
            }, layoutMeasure.zero());

            return sum;
        }

        function getNormalFractionMeasure(track) {
            if (!trackIsFractionSized(track)) {
                throw new Error('getNormalFractionMeasure called for non-fraction sized track');
            }
            var frValue = track.size.value;
            return frValue === 0 ? layoutMeasure.zero() : track.measure.divide(frValue);
        }

        function compareFractionTracksNormalMeasure(a, b) {
            var result = 0,
                // Called from a sort function; can't depend on "this" object being CSSGridAlignment.
                normalFractionMeasureA = getNormalFractionMeasure(a),
                normalFractionMeasureB = getNormalFractionMeasure(b);

            if (defined(a) &&
                    defined(b)) {
                if (normalFractionMeasureA.getRawMeasure() < normalFractionMeasureB.getRawMeasure()) {
                    result = -1;
                } else if (normalFractionMeasureA.getRawMeasure() > normalFractionMeasureB.getRawMeasure()) {
                    result = 1;
                } else {
                    if (a.size.value > b.size.value) {
                        result = -1;
                    } else if (a.size.value < b.size.value) {
                        result = 1;
                    }
                }
            }
            return result;
        }

        function determineMeasureOfOneFractionUnconstrained(fractionalTracks) {
            // Iterate over all of the fractional tracks, 
            var maxOneFractionMeasure = layoutMeasure.zero();

            fractionalTracks.forEach(function (curTrack) {
                var curFractionValue = curTrack.size.value,
                    oneFractionMeasure = curTrack.maxMeasure.divide(curFractionValue);

                if (oneFractionMeasure.getRawMeasure() > maxOneFractionMeasure.getRawMeasure()) {
                    maxOneFractionMeasure = oneFractionMeasure;
                }
            });

            return maxOneFractionMeasure;
        }

        function saveUsedCellWidths(columnTrackManager) {
            var iter = columnTrackManager.getIterator(),
                curTrack = iter.next();

            function setUsedWithMeasure(curItem) {
                if (curItem.usedWidthMeasure === null) {
                    curItem.usedWidthMeasure = getSumOfSpannedTrackMeasures(columnTrackManager, curItem.column, curItem.columnSpan);
                }
            }

            while (curTrack !== null) {
                curTrack.items.forEach(setUsedWithMeasure);

                curTrack = iter.next();
            }
        }

        /* Determines track sizes using the algorithm from sections 9.1 and 9.2 of the W3C spec.
         * Rules:
         *   1. If it's a defined length, that is the track size.
         *      2. If it's a keyword, its sizing is based on its content. 
         *         Iterate over the items in the track to attempt to determine the size of the track.
         * TODO: handle percentages
         **/
        function determineTrackSizes(lengthPropertyName) {
            var computingColumns = (lengthPropertyName.toLowerCase() === WIDTH),
                trackManager = computingColumns ? columnTrackManager : rowTrackManager,
                availableSpace = computingColumns ? availableSpaceForColumns : availableSpaceForRows,
                useAlternateFractionalSizing = computingColumns ? useAlternateFractionalSizingForColumns
                                                                    : useAlternateFractionalSizingForRows,
                // Keep track of spans which could affect track sizing later.
                spans = [],
                autoTracks = [],
                fractionalTracks = [],
                respectAvailableLength = true,
                iter = trackManager.getIterator(),
                curTrack = iter.next(),
                curSize,
                sizingAlternateFraction,
                i,
                iLen,
                curItem,
                minItemMeasure,
                maxCellMeasure,
                actualMeasure,
                remainingSpace,
                autoTrackIndex,
                autoTrackLength,
                trackShareOfSpace,
                curSpanningItem,
                firstTrack,
                numSpanned,
                sumOfTrackMeasures,
                measureSpanCanGrow,
                sumOfFractions,
                oneFractionMeasure,
                totalMeasureToAdd,
                lastNormalizedFractionalMeasure,
                accumulatedFactors,
                accumulatedFactorsInDistributionSet,
                normalizedDelta,
                j,
                spaceToDistribute,
                sortFunc;

            if (useAlternateFractionalSizing &&
                    availableSpace.getRawMeasure() === 0) {
                // Assume we have as much space as we want.
                respectAvailableLength = false;
            }

            // 9.1.1/9.2.1: [Columns|Widths] are initialized to their minimum [widths|heights].
            while (curTrack !== null) {
                if (curTrack.sizingType !== sizingTypeEnum.keyword &&
                        curTrack.sizingType !== sizingTypeEnum.valueAndUnit) {
                    throw new Error('Unknown grid track sizing type');
                }

                // TODO: add support for minmax (M3)
                curTrack.measure = layoutMeasure.zero();
                curTrack.minMeasure = layoutMeasure.zero();
                curTrack.maxMeasure = layoutMeasure.zero();
                sizingAlternateFraction = (useAlternateFractionalSizing && trackIsFractionSized(curTrack));

                if (curTrack.sizingType === sizingTypeEnum.keyword ||
                        sizingAlternateFraction) {
                    curSize = curTrack.size;

                    if (curSize !== gridTrackValue.fitContent &&
                            curSize !== gridTrackValue.minContent &&
                            curSize !== gridTrackValue.maxContent &&
                            curSize !== gridTrackValue.auto &&
                            !sizingAlternateFraction) {
                        throw new Error('Unknown grid track sizing value ' + curSize.keyword);
                    }
                    if (!sizingAlternateFraction) {
                        curTrack.contentSizedTrack = true;
                    }

                    for (i = 0, iLen = curTrack.items.length; i < iLen; i += 1) {
                        curItem = curTrack.items[i];

                        if (curItem.position !== positionEnum[STATIC] &&
                                curItem.position !== positionEnum.relative) {
                            // Only position: static and position: relative items contribute to track size.
                            /*jslint continue:true*/
                            continue;
                        }

                        // 9.1.a.i/9.2.a.i: Spanning elements are ignored to avoid premature growth of [columns|rows].
                        if ((computingColumns ? curItem.columnSpan : curItem.rowSpan) > 1) {
                            // This is a span; determine and save its max width or height for use later in the track sizing algorithm.
                            if (curItem.maxWidthMeasure === null) {
                                if (computingColumns) {
                                    curItem.maxWidthMeasure = intrinsicSizeCalculator
                                                                .calcMaxWidth(curItem.itemElement);
                                } else {
                                    curItem.maxHeightMeasure = intrinsicSizeCalculator
                                                                .calcMaxHeight(curItem.itemElement, curItem.usedWidthMeasure);
                                }
                            }
                            if (curSize === gridTrackValue.fitContent ||
                                    curSize === gridTrackValue.auto) {
                                /* Only keep track of this span if we found it in a non-fixed size track.
                                 * Note: we are adding the span multiple times for each track but the 
                                 * sizing algorithm will be unaffected by trying to
                                 * process the same span multiple times.
                                 **/
                                spans.push(curItem);
                            }
                        } else {
                            // Not a span. Let's size the track.
                            if (!sizingAlternateFraction &&
                                    (curSize === gridTrackValue.minContent ||
                                        curSize === gridTrackValue.fitContent ||
                                        curSize === gridTrackValue.auto)) {
                                if (computingColumns) {
                                    minItemMeasure = intrinsicSizeCalculator.calcMinWidth(curItem.itemElement);
                                } else {
                                    minItemMeasure = intrinsicSizeCalculator.calcMinHeight(curItem.itemElement, curItem.usedWidthMeasure);
                                }

                                if (minItemMeasure.getRawMeasure() > curTrack.minMeasure.getRawMeasure()) {
                                    curTrack.minMeasure = minItemMeasure;
                                }
                            }
                            // Auto sized tracks may grow to their maximum length. Determine that length up front.
                            if (sizingAlternateFraction ||
                                    curSize === gridTrackValue.maxContent ||
                                    curSize === gridTrackValue.auto) {
                                if (computingColumns) {
                                    maxCellMeasure = intrinsicSizeCalculator.calcMaxWidth(curItem.itemElement);
                                } else {
                                    maxCellMeasure = intrinsicSizeCalculator.calcMaxHeight(curItem.itemElement, curItem.usedWidthMeasure);
                                }

                                if (maxCellMeasure.getRawMeasure() > curTrack.maxMeasure.getRawMeasure()) {
                                    curTrack.maxMeasure = maxCellMeasure;
                                }
                            }
                        }
                    }
                    /* Note: for content sized tracks, the layout engine may be using more than 1px precision.
                     * To ensure we match the layout engine's rounded result, we will get the actual track length
                     * and compare against our calculated length. If it is within 1px, we will assume that it is correct.
                     **/
                    // console.log( 'dealing with content-sized tracks now' );
                    switch (curSize) {
                    case gridTrackValue.maxContent:
                        actualMeasure = getActualTrackMeasure(curTrack.number, computingColumns);
                        //if (actualMeasure.equals(curTrack.maxMeasure) !== true) {
                            // Not an error; we will catch the problem later when we verify grid items.
                            // console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
                            //             ": " + "max-content length difference detected; expected = " +
                            //             curTrack.maxMeasure.getPixelValueString() + ", actual = " +
                            //             actualMeasure.getPixelValueString() );
                        //}
                        curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure;
                        break;
                    case gridTrackValue.minContent:
                        actualMeasure = getActualTrackMeasure(curTrack.number, computingColumns);
                        //if (actualMeasure.equals(curTrack.minMeasure) !== true) {
                            // Not an error; we will catch the problem later when we verify grid items.
                            // console.log( (computingColumns ? "Column" : "Row") + " " + curTrack.number + 
                            //              ": " + "min-content length difference detected; expected = " +
                            //              curTrack.minMeasure.getPixelValueString() + ", actual = " +
                            //              actualMeasure.getPixelValueString() );
                        //}
                        curTrack.measure = curTrack.maxMeasure = curTrack.minMeasure;
                        break;
                    case gridTrackValue.fitContent:
                    case gridTrackValue.auto:
                        // We can't determine at this point if we need to adjust 
                        // to the actual track length since sizing isn't complete.
                        curTrack.measure = curTrack.minMeasure;
                        break;
                    }
                }

                if (curTrack.sizingType === sizingTypeEnum.keyword &&
                        (curTrack.size === gridTrackValue.auto ||
                         curTrack.size === gridTrackValue.fitContent)) {
                    autoTracks.push(curTrack);
                }
                if (curTrack.sizingType === sizingTypeEnum.valueAndUnit) {
                    if (curTrack.size.unit === PX) {
                        curTrack.measure = curTrack.minMeasure = curTrack.maxMeasure = layoutMeasure.measureFromPx(curTrack.size.value);
                    } else if (curTrack.size.unit === FR) {
                        // 9.1.1.b/9.2.1.b: A column with a fraction-sized minimum length is assigned a 0px minimum.
                        curTrack.measure = layoutMeasure.zero();
                        fractionalTracks.push(curTrack);
                        // TODO: fractional tracks should go through the max calculation for 
                        // use with verifying a grid in infinite/unconstrained space.
                    } else {
                        // Track lengths are assumed to always be in pixels or fractions. Convert before going into this function.
                        error = true;
                        // console.log("track size not converted into px!");
                        // TODO: throw after we start doing conversions and don't want to ignore this anymore.
                    }
                }
                curTrack = iter.next();
            }

            // 9.1.2/9.2.2: All [columns|rows] not having a fraction-sized maximum are grown from
            // their minimum to their maximum specified size until available space is exhausted.
            sumOfTrackMeasures = getSumOfTrackMeasures(trackManager);
            remainingSpace = availableSpace.subtract(sumOfTrackMeasures);

            if (remainingSpace.getRawMeasure() > 0) {
                sortFunc = createBoundedWrapper(compareAutoTracksAvailableGrowth);
                autoTracks.sort(sortFunc);

                for (autoTrackIndex = 0, autoTrackLength = autoTracks.length; autoTrackIndex < autoTrackLength; autoTrackIndex += 1) {
                    if (remainingSpace.getRawMeasure() <= 0) {
                        break;
                    }
                    trackShareOfSpace = remainingSpace.divide(autoTracks.length - autoTrackIndex);

                    trackShareOfSpace = layoutMeasure
                                            .min(trackShareOfSpace, autoTracks[autoTrackIndex]
                                                                        .maxMeasure
                                                                        .subtract(autoTracks[autoTrackIndex].measure));
                    autoTracks[autoTrackIndex].measure = autoTracks[autoTrackIndex].measure.add(trackShareOfSpace);
                    remainingSpace = remainingSpace.subtract(trackShareOfSpace);
                }
            }

            /* 9.1.2.c/9.2.2.c: After all [columns|rows] (excluding those with a fractional maximum)
             * have grown to their maximum [width|height], consider any spanning elements that could
             * contribute to a content-based [column|row] [width|height] (minimum or maximum) and 
             * grow equally all [columns|rows] covered by the span until available space is exhausted.
             **/
            for (i = 0, iLen = spans.length; i < iLen && remainingSpace > 0; i += 1) {
                curSpanningItem = spans[i];
                firstTrack = (computingColumns ? curSpanningItem.column : curSpanningItem.row);
                numSpanned = (computingColumns ? curSpanningItem.columnSpan : curSpanningItem.rowSpan);

                /* 9.1.2.c.i/9.2.2.c.i. Spanning elements covering [columns|rows] with
                 * fraction-sized maximums are ignored as the fraction column "eats" all
                 * the space from the spanning element which could have caused growth 
                 * in [columns|rows] with a content-based size.
                 **/
                if (!trackManager.spanIsInFractionalTrack(firstTrack, numSpanned)) {
                    continue;
                }

                sumOfTrackMeasures = getSumOfSpannedTrackMeasures(trackManager, firstTrack, numSpanned);
                measureSpanCanGrow = (computingColumns === true ? curSpanningItem.maxWidthMeasure
                                                                 : curSpanningItem.maxHeightMeasure).subtract(sumOfTrackMeasures);

                if (measureSpanCanGrow.getRawMeasure() > 0) {
                    throw new Error('Not implemented');
                    // Redistribute among all content-sized tracks that this span is a member of.
                    //tracksToGrow = getContentBasedTracksThatSpanCrosses(trackManager, firstTrack, numSpanned);
                    //remainingSpace = redistributeSpace(tracksToGrow, remainingSpace, measureSpanCanGrow);
                }
            }

            // REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
            // remainingSpace = remainingSpace
            //                         .subtract( adjustForTrackLengthDifferences( autoTracks, computingColumns ) );

            /* 9.1.3/9.2.3: Fraction-sized [columns|rows] are grown 
             * from their minimum to their maximum [width|height] in 
             * accordance with their space distribution factor until 
             * available space is exhausted.
             **/
            if (fractionalTracks.length > 0 &&
                    (remainingSpace.getRawMeasure() > 0 ||
                     useAlternateFractionalSizing)) {
                //if (!useAlternateFractionalSizing || respectAvailableLength) {
                    // console.log("remaining space for fractional sizing = " + remainingSpace.getPixelValueString());
                //}
                sortFunc = createBoundedWrapper(compareFractionTracksNormalMeasure);
                fractionalTracks.sort(sortFunc);
                sumOfFractions = 0;
                for (i = 0, iLen = fractionalTracks.length; i < iLen; i += 1) {
                    sumOfFractions += fractionalTracks[i].size.value;
                }
                oneFractionMeasure = null;
                if (!useAlternateFractionalSizing) {
                    oneFractionMeasure = remainingSpace.divide(sumOfFractions);
                } else {
                    // In alternate fractional sizing, we determine the max "1fr"
                    // length based on the max-content size of the track.
                    oneFractionMeasure = determineMeasureOfOneFractionUnconstrained(fractionalTracks);
                }

                iLen = fractionalTracks.length;
                if (useAlternateFractionalSizing) {
                    if (respectAvailableLength) {
                        // Using alternate sizing but still need to stay within the remaining space.
                        // Adjust the one fraction length so that everything will fit.
                        totalMeasureToAdd = layoutMeasure.zero();
                        for (i = 0; i < iLen; i += 1) {
                            totalMeasureToAdd = totalMeasureToAdd.add(oneFractionMeasure.multiply(fractionalTracks[i].size.value));
                        }
                        if (totalMeasureToAdd.getRawMeasure() > 0 &&
                                remainingSpace.getRawMeasure() > 0 &&
                                totalMeasureToAdd.getRawMeasure() > remainingSpace.getRawMeasure()) {
                            oneFractionMeasure = oneFractionMeasure.multiply(remainingSpace.divide(totalMeasureToAdd.getRawMeasure()).getRawMeasure());
                        }
                    }
                    for (i = 0; i < iLen; i += 1) {
                        fractionalTracks[i].measure = fractionalTracks[i]
                                                        .measure
                                                        .add(oneFractionMeasure.multiply(fractionalTracks[i].size.value));
                    }
                } else if (iLen > 0) {
                    lastNormalizedFractionalMeasure = getNormalFractionMeasure(fractionalTracks[0]);
                    accumulatedFactors = 0;
                    accumulatedFactorsInDistributionSet = 0;
                    for (i = 0; i < iLen; i += 1) {
                        if (lastNormalizedFractionalMeasure.getRawMeasure() <
                                getNormalFractionMeasure(fractionalTracks[i]).getRawMeasure()) {
                            accumulatedFactorsInDistributionSet = accumulatedFactors;
                            normalizedDelta = getNormalFractionMeasure(fractionalTracks[i])
                                                .subtract(lastNormalizedFractionalMeasure);
                            for (j = 0; j < i; j += 1) {
                                spaceToDistribute = 0;
                                if (accumulatedFactorsInDistributionSet > 0) {
                                    spaceToDistribute = remainingSpace
                                                            .multiply(fractionalTracks[j].size.value)
                                                            .divide(accumulatedFactorsInDistributionSet);
                                    spaceToDistribute = layoutMeasure
                                                            .min(spaceToDistribute,
                                                                 normalizedDelta.multiply(fractionalTracks[j].size.value));
                                    spaceToDistribute = layoutMeasure.min(spaceToDistribute, fractionalTracks[j].maxMeasure);
                                }

                                fractionalTracks[j].measure = fractionalTracks[j].measure.add(spaceToDistribute);
                                remainingSpace -= spaceToDistribute;
                                accumulatedFactorsInDistributionSet -= fractionalTracks[j].size.value;
                            }
                            lastNormalizedFractionalMeasure = getNormalFractionMeasure(fractionalTracks[i]);
                        }
                        accumulatedFactors += fractionalTracks[i].size.value;
                        if (remainingSpace.getRawMeasure() <= 0) {
                            break;
                        }
                    }
                    // Once all fractional tracks are in the same group, do a final pass to distribute the remaining space.
                    accumulatedFactorsInDistributionSet = accumulatedFactors;
                    for (i = 0; i < iLen; i += 1) {
                        spaceToDistribute = 0;
                        if (accumulatedFactorsInDistributionSet > 0) {
                            spaceToDistribute = remainingSpace
                                                    .multiply(fractionalTracks[i].size.value / accumulatedFactorsInDistributionSet);
                            //    uncomment and scope to minmax functionality
                            //spaceToDistribute = layoutMeasure.min(spaceToDistribute, fractionalTracks[i].maxMeasure);
                        }
                        fractionalTracks[i].measure = fractionalTracks[i].measure.add(spaceToDistribute);
                        remainingSpace = remainingSpace.subtract(spaceToDistribute);
                        accumulatedFactorsInDistributionSet -= fractionalTracks[i].size.value;
                    }
                }
                // REMOVING AS IT SEEMS UNNECESSARY RIGHT NOW
                // remainingSpace = remainingSpace
                //                     .subtract( adjustForTrackLengthDifferences( fractionalTracks, computingColumns ) );
            }
            if (computingColumns) {
                // Save the used widths for each of the items so that it can be used during row size resolution.
                saveUsedCellWidths(trackManager);
            }
        }

        function calculateGridItemShrinkToFitSizes() {
            var i,
                iLen = items.length,
                curItem,
                columnsBreadth,
                rowsBreadth,
                swapWidthAndHeight,
                forcedWidth = null,
                forcedHeight = null;

            for (i = 0; i < iLen; i += 1) {
                curItem = items[i];
                if (curItem.shrinkToFitSize === null) {
                    // Percentage resolution is based on the size of the cell for the grid item.
                    columnsBreadth = getSumOfSpannedTrackMeasures(columnTrackManager, curItem.column, curItem.columnSpan);
                    rowsBreadth = getSumOfSpannedTrackMeasures(rowTrackManager, curItem.row, curItem.rowSpan);

                    // Force a stretch if requested.
                    if (curItem.position === positionEnum[STATIC] ||
                            curItem.position === positionEnum.relative) {
                        swapWidthAndHeight = shouldSwapWidthAndHeight();
                        if (curItem.columnAlign === gridAlignEnum.stretch) {
                            if (!swapWidthAndHeight) {
                                forcedWidth = columnsBreadth;
                            } else {
                                forcedHeight = columnsBreadth;
                            }
                        }
                        if (curItem.rowAlign === gridAlignEnum.stretch) {
                            if (!swapWidthAndHeight) {
                                forcedHeight = rowsBreadth;
                            } else {
                                forcedWidth = rowsBreadth;
                            }
                        }
                    }

                    // Only calculate an intrinsic size if we're not forcing both width and height.
                    if (forcedWidth === null ||
                            forcedHeight === null) {
                        curItem.shrinkToFitSize =
                            intrinsicSizeCalculator.calcShrinkToFitWidthAndHeight(
                                curItem.itemElement,
                                columnsBreadth,
                                rowsBreadth,
                                forcedWidth,
                                forcedHeight
                            );
                    } else {
                        curItem.shrinkToFitSize = widthAndHeight();
                    }

                    if (forcedWidth !== null) {
                        curItem.shrinkToFitSize.width = forcedWidth;
                    }

                    if (forcedHeight !== null) {
                        curItem.shrinkToFitSize.height = forcedHeight;
                    }
                }
            }
        }

        function determineBorderWidths() {
            var el = div.cloneNode(false),
                border = BORDER + HYPHEN + RIGHT,
                width,
                size;

            document.body.appendChild(el);
            el.style.width = '100px';
            width = parseInt(el.offsetWidth, 10);

            for (size in borderWidthsEnum) {
                if (borderWidthsEnum.hasOwnProperty(size)) {
                    el.style[border] = size + ' solid';
                    borderWidthsEnum[size] = parseInt(el.offsetWidth, 10) - width;
                }
            }

            document.body.removeChild(el);
        }

        function getPosition(item) {
            var col = item.column - 1,
                row = item.row - 1,
                pos = {
                    top: 0,
                    left: 0
                };

            pos.left = columnTrackManager.tracks.slice(0, col).reduce(function (acc, track) {
                return acc + track.measure.getRawMeasure();
            }, 0);

            pos.top = rowTrackManager.tracks.slice(0, row).reduce(function (acc, track) {
                return acc + track.measure.getRawMeasure();
            }, 0);

            /*
            for (col = item.column - 1; col > 0; col -= 1) {
                pos.left += columnTrackManager.tracks[col].measure.internalMeasure;
            }

            for (row = item.row - 1; row > 0; row -= 1) {
                pos.top += rowTrackManager.tracks[row].measure.internalMeasure;
            }
            */
            pos.left += PX;
            pos.top += PX;

            return pos;
        }

        function getDimensions(item) {
            var dimensions = item.shrinkToFitSize,
                element = item.itemElement,
                margins = {},
                padding = {},
                borders = {},
                sides = [TOP, RIGHT, BOTTOM, LEFT];

            dimensions = {
                height: dimensions.height.getRawMeasure(),
                width: dimensions.width.getRawMeasure()
            };

            sides.forEach(function (side) {
                margins[side] = layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + side);
                padding[side] = layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + side);
                borders[side] = layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + side + HYPHEN + WIDTH);
            });

            dimensions.height -= (margins.top.getRawMeasure() + margins.bottom.getRawMeasure() +
                                    padding.top.getRawMeasure() + padding.bottom.getRawMeasure() +
                                    borders.top.getRawMeasure() + borders.bottom.getRawMeasure());
            dimensions.width -= (margins.left.getRawMeasure() + margins.right.getRawMeasure() +
                                   padding.left.getRawMeasure() + padding.right.getRawMeasure() +
                                  borders.left.getRawMeasure() + borders.right.getRawMeasure());
            return dimensions;
        }

        function layout() {
            // console.log('laying out now');
            var styles = EMPTY,
                gridstyles = EMPTY,
                height = 0,
                width = 0,
                rows = rowTrackManager.tracks,
                cols = columnTrackManager.tracks;

            items.forEach(function (item) {
                var details = item.styles,
                    className = item.itemElement.className,
                    newclass = makeUniqueClass(),
                    re,
                    position,
                    dimensions;

                re = new RegExp(GRIDLAYOUT + '-\\d*\\s?', 'g');
                item.itemElement.className = className.replace(re, '');
                addClass(item.itemElement, newclass);
                position = getPosition(item);
                dimensions = getDimensions(item);

                styles += details.selector + PERIOD + newclass + OPEN_CURLY + POSITION + COLON + ABSOLUTE + SEMICOL;
                styles += TOP + COLON + position.top + SEMICOL;
                styles += LEFT + COLON + position.left + SEMICOL;
                styles += WIDTH + COLON + dimensions.width + PX + SEMICOL;
                styles += HEIGHT + COLON + dimensions.height + PX + SEMICOL;
                styles += CLOSE_CURLY;
            });

            if (getCssValue(gridElement, POSITION) === STATIC) {
                gridstyles += POSITION + COLON + RELATIVE + SEMICOL;
            }

            height = rows.reduce(function (acc, row) {
                return acc + row.measure.getRawMeasure();
            }, 0);

            gridstyles += HEIGHT + COLON + height + PX + SEMICOL;

            width = cols.reduce(function (acc, col) {
                return acc + col.measure.getRawMeasure();
            }, 0);

            gridstyles += WIDTH + COLON + width + PX + SEMICOL;

            styles += selector + OPEN_CURLY + gridstyles + CLOSE_CURLY;

            // console.log(styles);
            embedCss(styles, media);
        }

        function prepare() {
            clearEmbeddedCss(media);
        }

        function setup() {
            var gridCols = properties[GRIDCOLUMNS] || NONE,
                gridRows = properties[GRIDROWS] || NONE;

            // Get the available space for the grid since it is required
            // for determining track sizes for auto/fit-content/minmax 
            // and fractional tracks.
            determineGridAvailableSpace();

            // console.log( "Grid element content available space: columns = " + 
            //             availableSpaceForColumns.getPixelValueString() + "; rows = " +
            //             availableSpaceForRows.getPixelValueString() );

            propertyParser.parseGridTracksString(gridCols, columnTrackManager);
            propertyParser.parseGridTracksString(gridRows, rowTrackManager);

            mapGridItemsToTracks();
            saveItemPositioningTypes();

            determineTrackSizes(WIDTH);
            determineTrackSizes(HEIGHT);

            calculateGridItemShrinkToFitSizes();

            determineBorderWidths();

            //verifyGridItemSizes();
            //verifyGridItemPositions(gridObject);
        }

        function verifyGridItemLengths(verifyingColumnBreadths) {
            var trackManager = verifyingColumnBreadths ? columnTrackManager : rowTrackManager,
                verifyingPhysicalWidths = usePhysicalWidths(blockProgression, verifyingColumnBreadths),
                dimension = verifyingPhysicalWidths ? 'Width' : 'Height';


            // Uncomment if needed for debugging.
            //dumpTrackLengths(trackManager, GridTest.logger, GridTest.logger.logDebug);


            //if (verifyingColumnBreadths && !verifyingPhysicalWidths) {
                // console.log("Column breadths are heights due to block-progression value '" + blockProgressionEnum.keyword + "'");
            //} else if (!verifyingColumnBreadths && verifyingPhysicalWidths) {
                // console.log("Row breadths are widths due to block-progression value '" + blockProgressionEnum.keyword + "'");
            //}

            items.forEach(function (curItem) {
                var curItemElement = curItem.itemElement,
                    trackNum,
                    alignType,
                    actualMeasure,
                    itemId,
                    offsetLength,
                    offsetMeasure,
                    expectedMeasure,
                    firstTrack,
                    trackSpan;

                if ((verifyingColumnBreadths ? curItem.verified.columnBreadth : curItem.verified.rowBreadth) !== true) {
                    trackNum = verifyingColumnBreadths ? curItem.column : curItem.row;
                    alignType = verifyingColumnBreadths ? curItem.columnAlign : curItem.rowAlign;
                    // console.log(curItemElement.parentNode);
                    // console.log(getCssValue(curItemElement,WIDTH));
                    actualMeasure = boxSizeCalculator['calcMarginBox' + dimension](curItemElement);

                    itemId = EMPTY;
                    if (curItem.itemElement.id.length > 0) {
                        itemId = "[ID = " + curItem.itemElement.id + "] ";
                    }

                    // Check the offsetWidth/offsetHeight to make sure it agrees.
                    offsetLength = curItem.itemElement['offset' + dimension];
                    offsetMeasure = layoutMeasure.measureFromPx(offsetLength);
                    if (actualMeasure.getMeasureRoundedToWholePixel().equals(offsetMeasure) !== true) {
                        error = true;
                        // console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + 
                        //             trackNum + ", item " + i + ": " +
                        //             "offset length doesn't agree with calculated margin box length (" +
                        //             ( verifyingPhysicalWidths ? "offsetWidth" : "offsetHeight" ) +
                        //             ": " + offsetMeasure.getPixelValueString() + "; expected (unrounded): " +
                        //             actualMeasure.getPixelValueString() );
                    }


                    if (curItem.position === positionEnum.absolute) {
                        // Use shrink-to-fit sizes.
                        if (curItem.shrinkToFitSize === null) {
                            throw new Error('Current item\'s shrink to fit size has not been calculated');
                        }
                        expectedMeasure = (verifyingPhysicalWidths ? curItem.shrinkToFitSize.width : curItem.shrinkToFitSize.height);
                    } else {
                        switch (alignType) {
                        case gridAlignEnum.stretch:
                            // Grid item's width/height should be equal to the lengths of the tracks it spans.
                            firstTrack = (verifyingColumnBreadths ? curItem.column : curItem.row);
                            trackSpan = (verifyingColumnBreadths ? curItem.columnSpan : curItem.rowSpan);
                            expectedMeasure = getSumOfSpannedTrackMeasures(trackManager, firstTrack, trackSpan);
                            break;
                        case gridAlignEnum.start:
                        case gridAlignEnum.end:
                        case gridAlignEnum.center:
                            // Item uses its shrink-to-fit size.
                            if (curItem.shrinkToFitSize === null) {
                                throw new Error('Current item\'s shrink to fit size has not been calculated');
                            }
                            // shrinkToFitSize is physical
                            expectedMeasure = (verifyingPhysicalWidths ? curItem.shrinkToFitSize.width
                                                                        : curItem.shrinkToFitSize.height);
                            break;
                        default:
                            throw new Error("Unknown grid align type " + alignType.keyword);
                        }
                    }

                    if (expectedMeasure.equals(actualMeasure) !== true) {
                        // If the agent is more precise than whole pixels, and we are off 
                        // by just one layout pixel (1/100th of a pixel for IE), it's close enough.
                        if (precision === 0 && Math.abs(expectedMeasure.subtract(actualMeasure).getRawMeasure()) !== 1) {
                            error = true;
                            // console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
                            //             "sizing check failed (alignment: " + alignType.keyword + "; expected: " +
                            //             expectedMeasure.getPixelValueString() + "; actual: " + 
                            //             actualMeasure.getPixelValueString() + ")" );
                        }
                        // else {
                            // console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
                            //             "sizing check passed after adjustment for fuzzy error checking (alignment: " + 
                            //             alignType.keyword + "; expected: " + expectedMeasure.getPixelValueString() + 
                            //             "; actual: " + actualMeasure.getPixelValueString() + ")" );
                        //} 
                    }
                    //} else {
                        // console.log( itemId + (verifyingColumnBreadths ? "column" : "row") + " " + trackNum + ": " +
                        //             "sizing check passed (alignment: " + alignType.keyword + "; expected: " +
                        //             expectedMeasure.getPixelValueString() + "; actual: " + actualMeasure.getPixelValueString() + ")" );
                    //}

                    if (verifyingColumnBreadths) {
                        curItem.verified.columnBreadth = true;
                    } else {
                        curItem.verified.rowBreadth = true;
                    }
                }
                //else {
                    // console.log( itemId + ": already verified " + (verifyingColumnBreadths ? "column" : "row") + " breadth" );
                //}
            });
        }

        /*
        function verifyGridItemSizes() {
            verifyGridItemLengths(true);
            verifyGridItemLengths(false);
        }
        */
        /*
        function verifyGridItemPositions(gridObject) {
            verifyGridItemTrackPositions(gridObject, true);
            verifyGridItemTrackPositions(gridObject, false);
        }*/

        prepare();
        setup();
        layout();

        return {
            verifyGridItemLengths: verifyGridItemLengths
        };
    };
});