/*global define, document, window*/
define([
    './consts',
    './enums',
    './objects',
    './utils',
    './boxSizeCalculator'
], function (
    consts,
    enums,
    objects,
    utils,
    boxSizeCalculator
) {
    'use strict';

    var EMPTY = consts.EMPTY,
        STRETCH = consts.STRETCH,
        WIDTH = consts.WIDTH,
        HEIGHT = consts.HEIGHT,
        COLON = consts.COLON,
        PX = consts.PX,
        SEMICOL = consts.SEMICOL,
        BLOCKPROGRESSION = consts.BLOCKPROGRESSION,
        MIN = consts.MIN,
        MAX = consts.MAX,
        calculatorOperation = enums.calculatorOperation,
        widthAndHeight = objects.widthAndHeight,
        defined = utils.defined,
        getCssValue = utils.getCssValue,
        zeroLength = { cssText: '0px' },
        infiniteLength = { cssText: '1000000px' },
        div = document.createElement('div'),
	    intrinsicSizeCalculatorElement = null,
	    intrinsicSizeCalculatorElementParent = null;


	/* last 2 params only required for shrink-to-fit calculation */
	function prepare(element, calculatorOperation, containerWidth, containerHeight) {
	    if (intrinsicSizeCalculatorElement === null) {
	        intrinsicSizeCalculatorElement = div.cloneNode(true);
	        intrinsicSizeCalculatorElement.id = "intrinsicSizeCalculator";
	    }

	    var cssText = EMPTY,
		    gridElement = element.parentNode,
		    //gridElementUsedStyle,
		    FONT = 'font-',
		    FONTFAMILY = FONT + 'family',
		    FONTSIZE = FONT + 'size',
		    FONTADJUST = FONTSIZE + '-adjust',
		    FONTSTRETCH = FONT + STRETCH,
		    FONTSTYLE = FONT + 'style',
		    FONTVARIANT = FONT + 'variant',
		    FONTWEIGHT = FONT + 'weight',
		    DIRECTION = 'direction';

	    if (defined(containerWidth) &&
			    containerWidth !== null) {
	        cssText += WIDTH + COLON + containerWidth.getPixelValue() + PX + SEMICOL;
	    } else {
	        switch (calculatorOperation) {
	        case calculatorOperation.minWidth:
	        case calculatorOperation.maxHeight:
	            cssText += WIDTH + COLON + zeroLength.cssText + SEMICOL;
	            break;
	        case calculatorOperation.minHeight:
	        case calculatorOperation.maxWidth:
	            cssText += WIDTH + COLON + infiniteLength.cssText + SEMICOL;
	            break;
	        case calculatorOperation.shrinkToFit:
	            // console.log("Calculating shrink to fit size without specified container width");
	            break;
	        }
	    }

	    if (defined(containerHeight) &&
				containerHeight !== null) {
	        cssText += HEIGHT + COLON + containerHeight.getPixelValue() + PX + SEMICOL;
	    } else {
	        switch (calculatorOperation) {
	        case calculatorOperation.minWidth:
	        case calculatorOperation.maxHeight:
	            cssText += HEIGHT + COLON + infiniteLength.cssText + SEMICOL;
	            break;
	        case calculatorOperation.minHeight:
	        case calculatorOperation.maxWidth:
	            cssText += HEIGHT + COLON + zeroLength.cssText + SEMICOL;
	            break;
	        case calculatorOperation.shrinkToFit:
	            // console.log("Calculating shrink to fit size without specified container height");
	            break;
	        }
	    }

	    /* Insert our calculator at the same level as the grid to ensure child selectors work as well as we can reasonably achieve.
			* Special case: the grid is the body element.
			* In that case, put the calculator under the grid anyway;
			* it shouldn't impact calculations assuming selectors aren't impacted.
			**/
	    intrinsicSizeCalculatorElementParent = gridElement === document.body ? gridElement : gridElement.parentNode;

	    // Copy styles from the grid to the calculator to ensure any values that are inherited by grid items still happens.
	    // TODO: add additional properties if new test content requires it.
	    if (intrinsicSizeCalculatorElementParent !== gridElement) {
	        cssText += FONTFAMILY + COLON + getCssValue(gridElement, FONTFAMILY) + SEMICOL
					+ FONTSIZE + COLON + getCssValue(gridElement, FONTSIZE) + SEMICOL
					+ FONTADJUST + COLON + getCssValue(gridElement, FONTADJUST) + SEMICOL
					+ FONTSTRETCH + COLON + getCssValue(gridElement, FONTSTRETCH) + SEMICOL
					+ FONTSTYLE + COLON + getCssValue(gridElement, FONTSTYLE) + SEMICOL
					+ FONTVARIANT + COLON + getCssValue(gridElement, FONTVARIANT) + SEMICOL
					+ FONTWEIGHT + COLON + getCssValue(gridElement, FONTWEIGHT) + SEMICOL
					+ DIRECTION + COLON + getCssValue(gridElement, DIRECTION) + SEMICOL
					+ BLOCKPROGRESSION + COLON + getCssValue(gridElement, BLOCKPROGRESSION) + SEMICOL;
	    }
	    intrinsicSizeCalculatorElement.style.cssText += cssText;
	    intrinsicSizeCalculatorElementParent.appendChild(intrinsicSizeCalculatorElement);
	}

	function unprepare() {
	    intrinsicSizeCalculatorElementParent.removeChild(intrinsicSizeCalculatorElement);
	}

	function cloneAndAppendToCalculator(element) {
	    var clone = element.cloneNode(true);
	    // Float it so that the box won't constrain itself to the parent's size.
	    clone.style.cssText = clone.style.cssText + SEMICOL + "float:left";
	    intrinsicSizeCalculatorElement.appendChild(clone);
	    return clone;
	}

	function calcMinWidth(element) {
	    prepare(element, calculatorOperation.minWidth);

	    var clone = cloneAndAppendToCalculator(element),
            width = boxSizeCalculator.calcMarginBoxWidth(clone);

	    intrinsicSizeCalculatorElement.removeChild(clone);
	    unprepare();

	    return width;
	}

	function calcMaxWidth(element) {
	    prepare(element, calculatorOperation.maxWidth);

	    var clone = cloneAndAppendToCalculator(element),
            width = boxSizeCalculator.calcMarginBoxWidth(clone);

	    intrinsicSizeCalculatorElement.removeChild(clone);
	    unprepare();

	    return width;
	}

	function calcMinHeight(element, usedWidth) {
	    if (!defined(usedWidth) ||
                usedWidth === null) {
	        throw new Error('No `usedWidth` specified.');
	    }

	    prepare(element, calculatorOperation.minHeight, usedWidth);

	    var clone = cloneAndAppendToCalculator(element),
            height = boxSizeCalculator.calcMarginBoxHeight(clone);

	    intrinsicSizeCalculatorElement.removeChild(clone);
	    unprepare();

	    return height;
	}

	function calcMaxHeight(element, usedWidth) {
	    if (!defined(usedWidth) ||
                usedWidth === null) {
	        throw new Error('No `usedWidth` specified');
	    }

	    prepare(element, calculatorOperation.maxHeight, usedWidth);

	    var clone = cloneAndAppendToCalculator(element),
            height = boxSizeCalculator.calcMarginBoxHeight(clone);

	    intrinsicSizeCalculatorElement.removeChild(clone);
	    unprepare();

	    return height;
	}

	function calcShrinkToFitWidthAndHeight(element, containerWidth, containerHeight, forcedMarginBoxWidth, forcedMarginBoxHeight) {
	    // If we're forcing a specific size on the grid item, adjust the calculator's container size to accomodate it.
	    if (forcedMarginBoxWidth !== null) {
	        containerWidth = forcedMarginBoxWidth;
	    }
	    if (forcedMarginBoxHeight !== null) {
	        containerHeight = forcedMarginBoxHeight;
	    }

	    prepare(element, calculatorOperation.shrinkToFit, containerWidth, containerHeight);

	    var clone = cloneAndAppendToCalculator(element),
            //cloneUsedStyle = window.getComputedStyle(clone, null),
            shrinkToFitWidthAndHeight = widthAndHeight(),
            forcedWidth,
            forcedHeight;

	    /* Force a width or height for width/height if requested.
         * We don't want to change the box-sizing on the box since we are not 
         * overriding all of the border/padding/width/height properties and
         * want the original values to work correctly. Convert the specified 
         * forced length to the appropriate length for the width/height property.
         **/
	    if (forcedMarginBoxWidth !== null) {
	        forcedWidth = boxSizeCalculator.calcBoxWidthFromMarginBoxWidth(clone, forcedMarginBoxWidth);
	        clone.style.cssText += MIN + WIDTH + COLON + forcedWidth.getPixelValueString() + PX + SEMICOL +
                                    MAX + WIDTH + COLON + forcedWidth.getPixelValueString() + PX + SEMICOL;
	    }
	    if (forcedMarginBoxHeight !== null) {
	        forcedHeight = boxSizeCalculator.calcBoxHeightFromMarginBoxHeight(clone, forcedMarginBoxHeight);
	        clone.style.cssText += MIN + HEIGHT + COLON + forcedHeight.getPixelValueString() + PX + SEMICOL +
                                    MAX + HEIGHT + COLON + forcedHeight.getPixelValueString() + PX + SEMICOL;
	    }
	    shrinkToFitWidthAndHeight.width = boxSizeCalculator.calcMarginBoxWidth(clone);
	    shrinkToFitWidthAndHeight.height = boxSizeCalculator.calcMarginBoxHeight(clone);

	    intrinsicSizeCalculatorElement.removeChild(clone);
	    unprepare();

	    return shrinkToFitWidthAndHeight;
	}

	return {
	    calcMinWidth: calcMinWidth,
	    calcMaxWidth: calcMaxWidth,
	    calcMinHeight: calcMinHeight,
	    calcMaxHeight: calcMaxHeight,
	    calcShrinkToFitWidthAndHeight: calcShrinkToFitWidthAndHeight
	};
});