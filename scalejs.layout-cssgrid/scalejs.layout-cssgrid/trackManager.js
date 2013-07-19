/*global define, console */
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

    var FR = consts.FR,
        sizingType = enums.sizingType,
        gridTrackValue = enums.gridTrackValue,
        track = objects.track,
        implicitTrackRange = objects.implicitTrackRange;

	return function trackManager() {
	    var tracks = [],
            implicitTrackRanges = [];

	    function trackIterator() {
	        var iteratingtracks = true,
                currentTrackIndex = 0,
                currentImplicitTrackRangeIndex = 0;

	        function reset() {
	            iteratingtracks = true;
	            currentTrackIndex = 0;
	            currentImplicitTrackRangeIndex = 0;
	        }

	        function next() {
	            var nextTrack = null,
                    returnNextTrackRange = false,
                    tracksLength = tracks.length,
                    implicitTrackRangesLength = implicitTrackRanges.length;

	            if (currentTrackIndex >= tracksLength) {
	                returnNextTrackRange = true;
	            } else if (currentImplicitTrackRangeIndex < implicitTrackRangesLength) {
	                // We have both a non-range track and a range track-- check to see if we should return the track range first.
	                if (implicitTrackRanges[currentImplicitTrackRangeIndex].firstNumber < tracks[currentTrackIndex].number) {
	                    returnNextTrackRange = true;
	                }
	            }
	            if (returnNextTrackRange &&
                        currentImplicitTrackRangeIndex < implicitTrackRangesLength) {
	                nextTrack = implicitTrackRanges[currentImplicitTrackRangeIndex];
	                currentImplicitTrackRangeIndex += 1;
	            } else if (currentTrackIndex < tracksLength) {
	                nextTrack = tracks[currentTrackIndex];
	                currentTrackIndex += 1;
	            }
	            return nextTrack;
	        }

	        return {
	            reset: reset,
	            next: next
	        };
	    }

	    function addTrack(trackToAdd) {
	        tracks.push(trackToAdd);
	    }

	    function getRangeLastTrackNumber(range) {
	        return range.firstNumber + range.span - 1;
	    }

	    function makeRoomForExplicitTrack(trackNumber) {
	        var i = 0,
                len = implicitTrackRanges.length,
			    curRange,
                nextRange,
                firstRangeNum,
                firstRangeSpan,
                secondRangeNum,
                //secondRangeSpan,
                //newRange,
                lastTrackNumber;

	        for (i = 0; i < len; i += 1) {
	            curRange		= implicitTrackRanges[i];
	            lastTrackNumber = getRangeLastTrackNumber(curRange);
	            if (trackNumber >= curRange.firstNumber &&
					    trackNumber <= lastTrackNumber) {
	                // This range covers the explicit track we are adding. Split, if necessary, and vacate the track.
	                nextRange = i < len - 1 ? null : implicitTrackRanges[i + 1];
	                // In the first track this range covers.
	                if (trackNumber === curRange.firstNumber) {
	                    if (curRange.span === 1) {
	                        // Remove the range.
	                        implicitTrackRanges.splice(i, 1);
	                    } else {
	                        // Vacate the track.
	                        curRange.firstNumber += 1;
	                        curRange.span -= 1;
	                    }
	                } else if (trackNumber === lastTrackNumber) {
	                    // In the last track this range covers.					
	                    // Vacate the track.
	                    curRange.span -= 1;
	                } else {
	                    // Need to split the range.
	                    // Compute new range values.
	                    firstRangeNum	= curRange.firstNumber;
	                    firstRangeSpan	= trackNumber - curRange.firstNumber;
	                    secondRangeNum = trackNumber + 1;
	                    throw new Error('Not implemented');
                        /*
	                    secondRangeSpan = lastTrackNumber - secondRangeFirstNumber + 1;

	                    // Move the existing range to the second half and add a new range before it.
	                    curRange.firstNumber = secondRangeFirstNumber;
	                    curRange.span = secondRangeSpan;

	                    newRange = new ImplicitTrackRange();
	                    newRange.firstNumber	= firstRangeFirstNumber;
	                    newRange.span			= firstRangeSpan;
	                    // Insert before the existing range.
	                    this.implicitTrackRanges.splice(i, 0, newRange); */
	                }
	                break;
	            }
	        }
	    }

	    function ensureFirstTrackExists(firstTrackNumber) {
	        // Ensure an actual track object exists for the first track.
	        makeRoomForExplicitTrack(firstTrackNumber);

	        var i = 0,
			    len = tracks.length,
			    newTrack = track();

	        newTrack.number		= firstTrackNumber;
	        newTrack.sizingType = sizingType.keyword;
	        newTrack.size		= gridTrackValue.auto;
	        newTrack.implicit = true;

	        if (len === 0 ||
				    firstTrackNumber > tracks[len - 1].number) {
	            // No tracks OR it doesn't exist
	            // add to the end.
	            addTrack(newTrack);
	        //} else if (firstTrackNumber === tracks[len - 1].number) {
	            // Already exists at the end.
	        } else if (firstTrackNumber !== tracks[len - 1].number) {
	            // Doesn't belong at the end. Determine if it exists and, if not, create one and insert it.
	            for (i = 0; i < len; i += 1) {
	                if (firstTrackNumber === tracks[i].number) {
	                    break; // Already exists.
	                } else if (firstTrackNumber < tracks[i].number) {
	                    tracks.splice(i, 0, newTrack);
	                    break;
	                }
	            }
	        }
	    }

	    function ensureTracksExist(firstTrackNumber, lastTrackNumber) {
	        var //newRangeFirstNumber = firstTrackNumber,
			    //newRangeLastNumber = lastTrackNumber,
			    trackLength = tracks.length,
			    mathMin = Math.min,
			    mathMax = Math.max,
			    rangesToCreate,
                curFirstTrackNumber,
                curLastTrackNumber,
                nonRangeTrackIndex,
			    existingRangeIndex,
                newRangeIndex,
                rangesToCreateLength,
                implicitTrackRangesLength,
			    rangeToCreate,
                rangeToCreateFirstNumber,
                rangeToCreateLastNumber,
                needToCreateRange,
			    existingRange,
                existingRangeFirstNumber,
                existingRangeLastNumber,
			    firstRangeFirstNumber,
                firstRangeSpan,
			    secondRangeFirstNumber,
                secondRangeSpan,
			    thirdRangeFirstNumber,
                thirdRangeSpan,
			    newRange;

	        ensureFirstTrackExists(firstTrackNumber);

	        // First track now exists; insert one or more ranges into the set of implicit track ranges.
	        firstTrackNumber += 1;

	        if (firstTrackNumber <= lastTrackNumber) {
	            rangesToCreate		= [];
	            curFirstTrackNumber = firstTrackNumber;
	            curLastTrackNumber	= lastTrackNumber;
	            // Iterate over the non-range track objects and split up our range into multiple ones if necessary.
	            if (trackLength === 0) {
	                // TODO: throw instead of pushing here; at least one track should have been created by ensureFirstTrackExists.
	                rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
	            }
	            for (nonRangeTrackIndex = 0; nonRangeTrackIndex < trackLength; nonRangeTrackIndex += 1) {
	                if (curFirstTrackNumber > curLastTrackNumber ||
						    tracks[nonRangeTrackIndex].number > curLastTrackNumber) {
	                    break;
	                }

	                // This track sits inside our range.
	                if (tracks[nonRangeTrackIndex].number >= curFirstTrackNumber &&
						    tracks[nonRangeTrackIndex].number <= curLastTrackNumber) {
	                    if (curFirstTrackNumber === tracks[nonRangeTrackIndex].number) {
	                        // No need to create a new range; just move out of the way.
	                        curFirstTrackNumber += 1;
	                    } else if (curLastTrackNumber === tracks[nonRangeTrackIndex].number) {
	                        // No need to create a new range; just move out of the way.
	                        curLastTrackNumber -= 1;
	                    } else {
	                        // Split the range
	                        // add the first half to the list of ranges to create,
	                        // and continue through the loop with the second half, searching
	                        // for more intersections with non-range tracks.
	                        rangesToCreate.push({ first: curFirstTrackNumber, last: tracks[nonRangeTrackIndex].number - 1 });
	                        curFirstTrackNumber = tracks[nonRangeTrackIndex].number + 1;
	                    }
	                }
	            }
	            if (curFirstTrackNumber <= curLastTrackNumber) {
	                rangesToCreate.push({ first: curFirstTrackNumber, last: curLastTrackNumber });
	            }
	            existingRangeIndex		= 0;
	            rangesToCreateLength	= rangesToCreate.length;
	            for (newRangeIndex = 0; newRangeIndex < rangesToCreateLength; newRangeIndex += 1) {
	                rangeToCreate				= rangesToCreate[newRangeIndex];
	                rangeToCreateFirstNumber	= rangeToCreate.first;
	                rangeToCreateLastNumber		= rangeToCreate.last;
	                needToCreateRange			= true;
	                implicitTrackRangesLength = implicitTrackRanges.length;

	                for (existingRangeIndex = 0; existingRangeIndex < implicitTrackRangesLength; existingRangeIndex += 1) {
	                    // Find any ranges that might intersect.
	                    existingRange				= implicitTrackRanges[existingRangeIndex];
	                    existingRangeFirstNumber	= existingRange.firstNumber;
	                    existingRangeLastNumber		= getRangeLastTrackNumber(existingRange);

	                    if (rangeToCreateLastNumber < existingRangeFirstNumber) {
	                        // We are past the existing range.
	                        break;
	                    }

	                    if (rangeToCreateFirstNumber <= existingRangeLastNumber) {
	                        if (rangeToCreateFirstNumber === existingRangeFirstNumber &&
                                            rangeToCreateLastNumber === existingRangeLastNumber) {
	                            // Check if this same range already exists.
	                            needToCreateRange = false;
	                            break;
	                        }


	                        // We have some intersection. 
	                        // Split into up to three ranges to cover the existing range and our new one.else
	                        firstRangeFirstNumber = mathMin(rangeToCreateFirstNumber, existingRangeFirstNumber);
	                        firstRangeSpan = mathMax(rangeToCreateFirstNumber, existingRangeFirstNumber) - firstRangeFirstNumber;
	                        secondRangeFirstNumber = firstRangeFirstNumber + firstRangeSpan;
	                        secondRangeSpan = mathMin(rangeToCreateLastNumber, existingRangeLastNumber) - secondRangeFirstNumber;
	                        thirdRangeFirstNumber = secondRangeFirstNumber + secondRangeSpan;
	                        thirdRangeSpan = mathMax(rangeToCreateLastNumber, existingRangeLastNumber) - thirdRangeFirstNumber + 1;

	                        // Insert the new ranges in front of the existing one.
	                        if (firstRangeSpan > 0) {
	                            newRange = implicitTrackRange();
	                            newRange.firstNumber = firstRangeFirstNumber;
	                            newRange.span = firstRangeSpan;
	                            implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
	                            existingRangeIndex += 1;
	                        }

	                        if (secondRangeSpan > 0) {
	                            newRange = implicitTrackRange();
	                            newRange.firstNumber = secondRangeFirstNumber;
	                            newRange.span = secondRangeSpan;
	                            implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
	                            existingRangeIndex += 1;
	                        }

	                        if (thirdRangeSpan > 0) {
	                            newRange = implicitTrackRange();
	                            newRange.firstNumber = thirdRangeFirstNumber;
	                            newRange.span = thirdRangeSpan;
	                            implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
	                            existingRangeIndex += 1;
	                        }
	                        // Remove the old range.

	                        implicitTrackRanges.splice(existingRangeIndex, 1);
	                        needToCreateRange = false;
	                        break;
	                    }
	                }

	                if (needToCreateRange) {
	                    newRange				= implicitTrackRange();
	                    newRange.firstNumber	= rangeToCreateFirstNumber;
	                    newRange.span			= rangeToCreateLastNumber - rangeToCreateFirstNumber + 1;

	                    if (existingRangeIndex >= implicitTrackRanges.length) {
	                        // Add to the end.
	                        implicitTrackRanges.push(newRange);
	                    } else {
	                        // Add before the existing one.
	                        implicitTrackRanges.splice(existingRangeIndex, 0, newRange);
	                    }
	                }
	            }
	        }
	    }

	    function getIterator() {
	        return trackIterator();
	    }

	    function getTrack(trackNumber) {
	        var i,
                len,
                curRangeLastNumber;

	        for (len = tracks.length - 1; len >= 0; len -= 1) {
	            if (tracks[len].number < trackNumber) {
	                break;
	            }

	            if (trackNumber === tracks[len].number) {
	                return tracks[len];
	            }
	        }

	        len = implicitTrackRanges.length;

	        for (i = 0; i < len; i += 1) {
	            curRangeLastNumber = implicitTrackRanges[i].firstNumber + implicitTrackRanges[i].span - 1;
	            if (trackNumber >= implicitTrackRanges[i].firstNumber &&
					    trackNumber <= curRangeLastNumber) {
	                return implicitTrackRanges[i];
	            }
	        }
	        // console.log("getTrack: invalid track number " + trackNumber);
	    }

	    function getTracks(firstTrackNumber, lastTrackNumber) {
	        var collection			= [],
			    number,
                i,
                len,
                curRangeLastNumber;

	        for (i = 0, len = tracks.length; i < len; i += 1) {
	            number = tracks[i].number;

	            if (number > lastTrackNumber) {
	                break;
	            }

	            if (number >= firstTrackNumber &&
					    number <= lastTrackNumber) {
	                collection.push(tracks[i]);
	            }
	        }
	        for (i = 0, len = implicitTrackRanges.length; i < len; i += 1) {
	            curRangeLastNumber = implicitTrackRanges[i].firstNumber + implicitTrackRanges[i].span - 1;
	            if (firstTrackNumber >= implicitTrackRanges[i].firstNumber &&
					    lastTrackNumber <= curRangeLastNumber) {
	                collection.push(implicitTrackRanges[i]);
	            }
	            if (curRangeLastNumber >= lastTrackNumber) {
	                break;
	            }
	        }
	        if (collection.length === 0) {
	            console.log("getTracks: a track in the range " + firstTrackNumber + " - " + lastTrackNumber + " doesn't exist");
	        }
	        return collection;
	    }

	    function trackIsFractionSized(trackToCheck) {
	        return trackToCheck.sizingType === sizingType.valueAndUnit &&
				    trackToCheck.size.unit === FR;
	    }

	    function spanIsInFractionalTrack(firstTrackNum, numSpanned) {
	        var i,
	            len;
	        // Fractional tracks are always represented by actual track objects.
	        for (i = firstTrackNum - 1, len = tracks.length; i < len && i < (firstTrackNum + numSpanned - 1); i += 1) {
	            if (trackIsFractionSized(tracks[i])) {
	                return true;
	            }
	        }
	        return false;
	    }

	    return {
            tracks: tracks,
	        addTrack: addTrack,
	        ensureTracksExist: ensureTracksExist,
	        getIterator: getIterator,
	        getTrack: getTrack,
	        getTracks: getTracks,
            spanIsInFractionalTrack: spanIsInFractionalTrack
	    };
	};
});