/*global define */
define([
    './consts',
    './utils',
    './layoutMeasure'
], function (
    consts,
    utils,
    layoutMeasure
) {
    'use strict';

    var BOXSIZING = consts.BOXSIZING,
        WIDTH = consts.WIDTH,
        HEIGHT = consts.HEIGHT,
        TOP = consts.TOP,
        BOTTOM = consts.BOTTOM,
        MARGIN = consts.MARGIN,
        PADDING = consts.PADDING,
        BORDER = consts.BORDER,
        HYPHEN = consts.HYPHEN,
        LEFT = consts.LEFT,
        RIGHT = consts.RIGHT,
        CONTENTBOX = consts.CONTENTBOX,
        PADDINGBOX = consts.PADDINGBOX,
        STYLE = consts.STYLE,
        NONE = consts.NONE,
        getCssValue = utils.getCssValue;

	function calcMarginBoxWidth(element) {
        var boxSizing = getCssValue(element, BOXSIZING),
            marginBoxWidth = layoutMeasure.measureFromStyleProperty(element, WIDTH);

	    marginBoxWidth = marginBoxWidth
							.add(layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + LEFT))
							.add(layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + RIGHT));

	    if (boxSizing === CONTENTBOX) {
	        marginBoxWidth = marginBoxWidth
								.add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + LEFT))
								.add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + RIGHT));
	    }
	    if (boxSizing === CONTENTBOX ||
				boxSizing === PADDINGBOX) {
	        if (getCssValue(element, BORDER + HYPHEN + LEFT + STYLE) !== NONE) {
	            marginBoxWidth = marginBoxWidth
									.add(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + LEFT + HYPHEN + WIDTH));
	        }
	        if (getCssValue(element, BORDER + HYPHEN + RIGHT + STYLE) !== NONE) {
	            marginBoxWidth = marginBoxWidth
									.add(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + RIGHT + HYPHEN + WIDTH));
	        }
	    }
	    return marginBoxWidth;
	}

	function calcMarginBoxHeight(element) {
	    var boxSizing = getCssValue(element, BOXSIZING),
            marginBoxHeight = layoutMeasure.measureFromStyleProperty(element, HEIGHT);

	    marginBoxHeight = marginBoxHeight
                            .add(layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + TOP))
                            .add(layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + BOTTOM));

	    if (boxSizing === CONTENTBOX) {
	        marginBoxHeight = marginBoxHeight
                                .add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + TOP))
                                .add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + BOTTOM));
	    }
	    if (boxSizing === CONTENTBOX ||
                boxSizing === PADDINGBOX) {
	        if (getCssValue(element, BORDER + HYPHEN + TOP + STYLE) !== NONE) {
	            marginBoxHeight = marginBoxHeight
                                    .add(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + TOP + HYPHEN + WIDTH));
	        }
	        if (getCssValue(element, BORDER + HYPHEN + BOTTOM + STYLE) !== NONE) {
	            marginBoxHeight = marginBoxHeight
                                    .add(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + BOTTOM + HYPHEN + WIDTH));
	        }
	    }
	    return marginBoxHeight;
	}
	    // Calculates a box width suitable for use with the width property from a given margin box width.
	    // Takes into account the box-sizing of the box.
	function calcBoxWidthFromMarginBoxWidth(element, marginBoxWidth) {
	    var boxSizing = getCssValue(element, BOXSIZING),
            boxWidth = marginBoxWidth;

	    if (boxSizing === CONTENTBOX) {
	        boxWidth = boxWidth
                .subtract(
                    layoutMeasure
                        .measureFromStyleProperty(element, PADDING + HYPHEN + LEFT)
                        .add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + RIGHT))
                );
	    }
	    if (boxSizing === CONTENTBOX ||
                boxSizing === PADDINGBOX) {
	        if (getCssValue(element, BORDER + HYPHEN + LEFT + STYLE) !== NONE) {
	            boxWidth = boxWidth.subtract(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + LEFT + HYPHEN + WIDTH));
	        }
	        if (getCssValue(element, BORDER + HYPHEN + RIGHT + STYLE) !== NONE) {
	            boxWidth = boxWidth.subtract(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + RIGHT + HYPHEN + WIDTH));
	        }
	    }
	    boxWidth = boxWidth
            .subtract(
                layoutMeasure
                    .measureFromStyleProperty(element, MARGIN + HYPHEN + LEFT)
                    .add(layoutMeasure.measureFromStyleProperty(element, MARGIN + HYPHEN + RIGHT))
            );
	    return boxWidth;
	}
	    // Calculates a box height suitable for use with the height property from a given margin box height.
	    // Takes into account the box-sizing of the box.
	function calcBoxHeightFromMarginBoxHeight(element, marginBoxHeight) {
	    var boxSizing = getCssValue(element, BOXSIZING),
	        boxHeight = marginBoxHeight,
            usedStyle; // TODO: what is this???

	    if (boxSizing === CONTENTBOX) {
	        boxHeight = boxHeight
                .subtract(
                    layoutMeasure
                        .measureFromStyleProperty(element, PADDING + HYPHEN + TOP)
                        .add(layoutMeasure.measureFromStyleProperty(element, PADDING + HYPHEN + BOTTOM))
                );
	    }
	    if (boxSizing === CONTENTBOX ||
                boxSizing === PADDINGBOX) {
	        if (getCssValue(element, BORDER + HYPHEN + TOP + STYLE) !== NONE) {
	            boxHeight = boxHeight.subtract(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + TOP + HYPHEN + WIDTH));
	        }
	        if (getCssValue(element, BORDER + HYPHEN + BOTTOM + STYLE) !== NONE) {
	            boxHeight = boxHeight.subtract(layoutMeasure.measureFromStyleProperty(element, BORDER + HYPHEN + BOTTOM + HYPHEN + WIDTH));
	        }
	    }

	    boxHeight = boxHeight
            .subtract(
                layoutMeasure
                    .measureFromStyleProperty(usedStyle, MARGIN + HYPHEN + TOP)
                    .add(layoutMeasure.measureFromStyleProperty(usedStyle, MARGIN + HYPHEN + BOTTOM))
            );
	    return boxHeight;
	}

	return {
	    calcMarginBoxWidth: calcMarginBoxWidth,
	    calcMarginBoxHeight: calcMarginBoxHeight,
	    calcBoxWidthFromMarginBoxWidth: calcBoxWidthFromMarginBoxWidth,
	    calcBoxHeightFromMarginBoxHeight: calcBoxHeightFromMarginBoxHeight
    };
});