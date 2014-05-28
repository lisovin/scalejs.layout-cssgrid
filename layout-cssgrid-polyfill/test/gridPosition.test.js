/*global define,describe,expect,it,beforeEach,afterEach,document,waits,window */
/*jslint sloppy: true*/
/// <reference path="../Scripts/jasmine.js"/>
define([
    './gridTestHelper',
    'scalejs!core',
    'knockout',
    'scalejs.layout-cssgrid',
    'jasmine-html'
], function (
    helper,
    core,
    ko
) {

    var fs = (function () {
        var oldlog = console.log.bind(console);
        var setCustomLog = function () {
            console.log = function (i) {
                // do cool stuff here for testing
                oldlog(i);
                }
            }
        var revertLog = function () {
            console.log = oldlog;
        }
        return {
            setCustomLog: setCustomLog,
            revertLog: revertLog
        };
    })();

    beforeEach(function () {
        var done = false;
        core.layout.parseGridStyles(function () {
            core.layout.invalidate();
            done = true;
        });

        waitsFor(function () { return done; });


        fs.setCustomLog();

    });
    
    afterEach(function () {
        fs.revertLog();
    });

    describe('A grid loaded from a template', function () {


        it('correctly places its first element', function () {
            helper.expectGridElement('simpleGrid__left', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('simpleGrid__right', {
                left: '200px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
    });

    describe('Elements can be placed and sized correctly in rows using fr', function () {

        it('correctly places the top element', function () {
            helper.expectGridElement('rowGrid__one', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('rowGrid__two', {
                left: '0px',
                top: '100px',
                width: '300px',
                height: '200px'
            });
        });
        it('correctly places the bottom element', function () {
            helper.expectGridElement('rowGrid__three', {
                left: '0px',
                top: '300px',
                width: '300px',
                height: '100px'
            });
        });
    });

    describe('Elements can be placed and sized correctly in columns using fr', function () {


        it('correctly places the left element', function () {
            helper.expectGridElement('columnGrid__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('columnGrid__two', {
                left: '100px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places the right element', function () {
            helper.expectGridElement('columnGrid__three', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
    });

    describe('Elements can be placed and sized correctly in rows using px', function () {


        it('correctly places the top element', function () {
            helper.expectGridElement('rowGridPx__one', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('rowGridPx__two', {
                left: '0px',
                top: '100px',
                width: '300px',
                height: '200px'
            });
        });
        it('correctly places the bottom element', function () {
            helper.expectGridElement('rowGridPx__three', {
                left: '0px',
                top: '300px',
                width: '300px',
                height: '100px'
            });
        });
    });

    describe('Elements can be placed and sized correctly in columns using px', function () {


        it('correctly places the left element', function () {
            helper.expectGridElement('columnGridPx__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
        it('correctly places the middle element', function () {
            helper.expectGridElement('columnGridPx__two', {
                left: '100px',
                top: '0px',
                width: '200px',
                height: '300px'
            });
        });
        it('correctly places the right element', function () {
            helper.expectGridElement('columnGridPx__three', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
    });

    describe('A grid with mixed uses of px and fr with rows and columns', function () {


        it('correctly places the first element', function () {
            helper.expectGridElement('mixedFrPx__one', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '50px'
            });
        });
        it('correctly places the second element', function () {
            helper.expectGridElement('mixedFrPx__two', {
                left: '200px',
                top: '50px',
                width: '100px',
                height: '100px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('mixedFrPx__three', {
                left: '0px',
                top: '150px',
                width: '200px',
                height: '200px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('mixedFrPx__four', {
                left: '200px',
                top: '350px',
                width: '100px',
                height: '50px'
            });
        });
    });

    describe('A grid with overlapping contents', function () {
        it('correctly places the first element', function () {
            helper.expectGridElement('span__one', {
                left: '0px',
                top: '0px',
                width: '200px',
                height: '200px'
            });
        });
        it('correctly places the second element', function () {
            helper.expectGridElement('span__two', {
                left: '200px',
                top: '0px',
                width: '100px',
                height: '200px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('span__three', {
                left: '0px',
                top: '200px',
                width: '200px',
                height: '100px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('span__four', {
                left: '200px',
                top: '200px',
                width: '100px',
                height: '100px'
            });
        });
    });

    describe('A grid with overlapping contents', function () {

        it('correctly places the first element', function () {
            helper.expectGridElement('overlap__one', {
                left: '100px',
                top: '100px',
                width: '100px',
                height: '100px'
            });
        });

        it('correctly places the second element', function () {
            helper.expectGridElement('overlap__two', {
                left: '100px',
                top: '0px',
                width: '100px',
                height: '200px'
            });
        });
        it('correctly places the third element', function () {
            helper.expectGridElement('overlap__three', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '300px'
            });
        });
        it('correctly places the fourth element', function () {
            helper.expectGridElement('overlap__four', {
                left: '200px',
                top: '200px',
                width: '100px',
                height: '100px'
            });
        });
    });

    describe('A simple grid for testing default values', function () {

        it('correctly places an element with no values given', function () {
            helper.expectGridElement('defaultValueTest__one', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '100px'
            });
        });

    });

    describe('A grid with split css rules', function () {


        it('correctly places the first element', function () {
            helper.expectGridElement('splitCSS__one', {
                left: '100px',
                top: '100px',
                width: '100px',
                height: '100px'
            });
        });

    });

    /*
    describe('A simple grid', function () {
        var currentGrid;

        beforeEach(function () {
            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '600px',
                'height': '400px',
                'rows': '75px 1fr 75px',
                'columns': '1fr 1fr',
                elements: [
                    'basicGrid__header 1 1 1 2',
                    'basicGrid__lefty 2 1 1 1',
                    'basicGrid__righty 2 2 1 1',
                    'basicGrid__footer 3 1 1 2'
                ]
            });

            helper.addGrid(currentGrid);

            core.layout.debug.dumpParsedRules();
            core.layout.parseGridStyles(function () {
                core.layout.debug.dumpParsedRules();
                core.layout.invalidate();
            });

            waits(300);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly places its first element', function () {
            helper.expectGridElement('basicGrid__header', {
                left: '0px',
                top: '0px',
                width: '600px',
                height: '75px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('basicGrid__lefty', {
                position: 'absolute',
                left: '0px',
                top: '75px',
                width: '300px',
                height: '250px'
            });
        });
        it('correctly places its third element', function () {
            helper.expectGridElement('basicGrid__righty', {
                position: 'absolute',
                left: '300px',
                top: '75px',
                width: '300px',
                height: '250px'
            });
        });
        it('correctly places its fourth element', function () {
            helper.expectGridElement('basicGrid__footer', {
                position: 'absolute',
                left: '0px',
                top: '325px',
                width: '600px',
                height: '75px'
            });
        });

    });

    describe('A grid with "auto" heights and text nodes', function () {
        var currentGrid;

        beforeEach(function () {
            var header,
                text;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '600px',
                'height': '400px',
                'rows': 'auto 1fr auto',
                'columns': '1fr 1fr',
                elements: [
                    'basicGrid__header 1 1 1 2',
                    'basicGrid__lefty 2 1 1 1',
                    'basicGrid__righty 2 2 1 1',
                    'basicGrid__footer 3 1 1 2'
                ]
            });

            helper.addGrid(currentGrid);

            header = document.getElementById('basicGrid__header');
            text = document.createTextNode('test content');
            header.appendChild(text);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly places its first element', function () {
            helper.expectGridElement('basicGrid__header', {
                left: '0px',
                top: '0px',
                width: '600px',
                height: '20px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('basicGrid__lefty', {
                left: '0px',
                top: '20px',
                width: '300px',
                height: '380px'
            });
        });
        it('correctly places its third element', function () {
            helper.expectGridElement('basicGrid__righty', {
                left: '300px',
                top: '20px',
                width: '300px',
                height: '380px'
            });
        });
        it('correctly places its fourth element', function () {
            helper.expectGridElement('basicGrid__footer', {
                left: '0px',
                top: '400px',
                width: '600px',
                height: '0px'
            });
        });
    });

    describe('A grid with "auto" heights and non-text nodes', function () {
        var currentGrid;

        beforeEach(function () {
            var target,
                blob;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '400px',
                'height': '400px',
                'rows': 'auto 1fr',
                'columns': '1fr',
                elements: [
                    'basicGrid__container 1 1 1 1',
                    'basicGrid__firstRow 1 1 1 1',
                    'basicGrid__secondRow 2 1 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            target = document.getElementById('basicGrid__container');
            blob = document.createElement('div');
            blob.style.width = '60px';
            blob.style.height = '60px';
            target.appendChild(blob);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates the first row', function () {
            helper.expectGridElement('basicGrid__firstRow', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '60px'
            });
        });
        it('correctly calculates the second row', function () {
            helper.expectGridElement('basicGrid__secondRow', {
                left: '0px',
                top: '60px',
                width: '400px',
                height: '340px'
            });
        });
    });

    describe('A grid with "auto" widths and text nodes', function () {
        var currentGrid;

        beforeEach(function () {
            var header,
                text;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '600px',
                'height': '400px',
                'rows': '75px 1fr 75px',
                'columns': 'auto 1fr',
                elements: [
                    'basicGrid__header 1 1 1 2',
                    'basicGrid__lefty 2 1 1 1',
                    'basicGrid__righty 2 2 1 1',
                    'basicGrid__footer 3 1 1 2'
                ]
            });

            helper.addGrid(currentGrid);

            header = document.getElementById('basicGrid__lefty');
            text = document.createTextNode('test content');
            header.appendChild(text);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly places its first element', function () {
            helper.expectGridElement('basicGrid__header', {
                left: '0px',
                top: '0px',
                width: '600px',
                height: '75px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('basicGrid__lefty', {
                left: '0px',
                top: '75px',
                width: '73.33px',
                height: '250px'
            });
        });
        it('correctly places its third element', function () {
            helper.expectGridElement('basicGrid__righty', {
                left: '73.33px',
                top: '75px',
                width: '526.67px',
                height: '250px'
            });
        });
        it('correctly places its fourth element', function () {
            helper.expectGridElement('basicGrid__footer', {
                left: '0px',
                top: '325px',
                width: '600px',
                height: '75px'
            });
        });
    });

    describe('A grid with "auto" widths and non-text nodes', function () {
        var currentGrid;

        beforeEach(function () {
            var divContent,
                target;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '400px',
                'height': '400px',
                'rows': '1fr',
                'columns': 'auto 1fr',
                elements: [
                    'basicGrid__container 1 1 1 1',
                    'basicGrid__firstColumn 1 1 1 1',
                    'basicGrid__secondColumn 1 2 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            target = document.getElementById('basicGrid__container');
            divContent = document.createElement('div');
            divContent.style.width = '60px';
            divContent.style.height = '60px';
            target.appendChild(divContent);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates the first column', function () {
            helper.expectGridElement('basicGrid__firstColumn', {
                left: '0px',
                top: '0px',
                width: '60px',
                height: '400px'
            });
        });
        it('correctly calculates the second column', function () {
            helper.expectGridElement('basicGrid__secondColumn', {
                left: '60px',
                top: '0px',
                width: '340px',
                height: '400px'
            });
        });
    });

    describe('A grid with "auto" widths and elements with defined widths', function () {
        var currentGrid;

        beforeEach(function () {
            var target,
                divContent,
                targetb;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '400px',
                'height': '400px',
                'rows': '1fr',
                'columns': 'auto 1fr',
                elements: [
                    'basicGrid__container 1 1 1 1',
                    'basicGrid__firstColumn 1 1 1 1',
                    'basicGrid__secondColumn 1 2 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            target = document.getElementById('basicGrid__container');
            target.style.width = '60px';
            divContent = document.createElement('div');
            divContent.style.width = '40px';
            divContent.style.height = '40px';
            target.appendChild(divContent);

            //auto-width needs defined width for all elements
            targetb = document.getElementById('basicGrid__firstColumn');
            targetb.style.width = '30px';

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates the first column', function () {
            helper.expectGridElement('basicGrid__firstColumn', {
                left: '0px',
                top: '0px',
                width: '60px',
                height: '400px'
            });
        });
        it('correctly calculates the second column', function () {
            helper.expectGridElement('basicGrid__secondColumn', {
                left: '60px',
                top: '0px',
                width: '340px',
                height: '400px'
            });
        });
    });

    describe('A grid with a smaller parent div', function () {
        var currentGrid;

        beforeEach(function () {
            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '600px',
                'height': '200px',
                'rows': '150px 150px 1fr',
                'columns': '400px 400px',
                elements: [
                    'basicGrid__header 1 1 1 2',
                    'basicGrid__lefty 2 1 1 1',
                    'basicGrid__righty 2 2 1 1',
                    'basicGrid__footer 3 1 1 2'
                ]
            });
            helper.addGrid(currentGrid);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly places its first element', function () {
            helper.expectGridElement('basicGrid__header', {
                left: '0px',
                top: '0px',
                width: '800px',
                height: '150px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('basicGrid__lefty', {
                left: '0px',
                top: '150px',
                width: '400px',
                height: '150px'
            });
        });
        it('correctly places its third element', function () {
            helper.expectGridElement('basicGrid__righty', {
                left: '400px',
                top: '150px',
                width: '400px',
                height: '150px'
            });
        });
        it('correctly places its fourth element', function () {
            helper.expectGridElement('basicGrid__footer', {
                left: '0px',
                top: '300px',
                width: '800px',
                height: '0px'
            });
        });
    });

    describe('A grid with overlapping elements', function () {
        var currentGrid;

        beforeEach(function () {
            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '500px',
                'height': '500px',
                'rows': '1fr 1fr 1fr 1fr 1fr',
                'columns': '1fr 1fr 1fr 1fr 1fr',
                elements: [
                    'basicGrid__header 2 1 1 5',
                    'basicGrid__lefty 4 1 1 5',
                    'basicGrid__righty 1 2 5 1',
                    'basicGrid__footer 1 4 5 1'
                ]
            });
            helper.addGrid(currentGrid);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly places its first element', function () {
            helper.expectGridElement('basicGrid__header', {
                left: '0px',
                top: '100px',
                width: '500px',
                height: '100px'
            });
        });
        it('correctly places its second element', function () {
            helper.expectGridElement('basicGrid__lefty', {
                left: '0px',
                top: '300px',
                width: '500px',
                height: '100px'
            });
        });
        it('correctly places its third element', function () {
            helper.expectGridElement('basicGrid__righty', {
                left: '100px',
                top: '0px',
                width: '100px',
                height: '500px'
            });
        });
        it('correctly places its fourth element', function () {
            helper.expectGridElement('basicGrid__footer', {
                left: '300px',
                top: '0px',
                width: '100px',
                height: '500px'
            });
        });

    });

    describe('Two grids with the same parent', function () {
        var currentTopGrid,
            currentBotGrid;

        beforeEach(function () {
            currentTopGrid = helper.makeGrid({
                'id': 'topGrid',
                'width': '400px',
                'height': '200px',
                'rows': '75px 1fr',
                'columns': '1fr 1fr',
                elements: [
                    'topGrid__header 1 1 1 2',
                    'topGrid__footer 2 1 1 2'
                ]
            });

            currentBotGrid = helper.makeGrid({
                'id': 'bottomGrid',
                'width': '300px',
                'height': '300px',
                'rows': '1fr',
                'columns': '1fr 1fr',
                elements: [
                    'bottomGrid__header 1 1 1 1',
                    'bottomGrid__footer 1 2 1 1'
                ]
            });

            var holder = document.createElement('div');
            document.body.appendChild(holder);
            holder.appendChild(currentTopGrid.gridParent);
            holder.appendChild(currentBotGrid.gridParent);
            document.head.appendChild(currentTopGrid.gridStyle);
            document.head.appendChild(currentBotGrid.gridStyle);

            core.layout.invalidate({ reparse: true });
            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentBotGrid);
            helper.removeGrid(currentTopGrid);
        });

        it('correctly place the first grid relative to the parent', function () {
            var top_grid = document.getElementById("topGrid"),
                top_grid_rect = top_grid.getBoundingClientRect(),
                parent_rect = top_grid.parentElement.getBoundingClientRect();

            expect((parseInt(top_grid_rect.left, 10) - parseInt(parent_rect.left, 10)) + 'px').toBe('0px');
            expect((parseInt(top_grid_rect.top, 10) - parseInt(parent_rect.top, 10)) + 'px').toBe('0px');
        });

        it('correctly place the second grid relative to the parent', function () {
            var bottom_grid = document.getElementById("bottomGrid"),
                bottom_grid_rect = bottom_grid.getBoundingClientRect(),
                parent_rect = bottom_grid.parentElement.getBoundingClientRect();

            expect((parseInt(bottom_grid_rect.left, 10) - parseInt(parent_rect.left, 10)) + 'px').toBe('0px');
            expect((parseInt(bottom_grid_rect.top, 10) - parseInt(parent_rect.top, 10)) + 'px').toBe('200px');
        });

        it('correctly place the first grid\'s first element', function () {
            helper.expectGridElement('topGrid__header', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '75px'
            });
        });
        it('correctly place the first grid\'s second element', function () {
            helper.expectGridElement('topGrid__footer', {
                left: '0px',
                top: '75px',
                width: '400px',
                height: '125px'
            });
        });
        it('correctly place the second grid\'s first element', function () {
            helper.expectGridElement('bottomGrid__header', {
                left: '0px',
                top: '0px',
                width: '150px',
                height: '300px'
            });
        });
        it('correctly place the second grid\'s second element', function () {
            helper.expectGridElement('bottomGrid__footer', {
                left: '150px',
                top: '0px',
                width: '150px',
                height: '300px'
            });
        });

    });

    describe('A grid with overlapping elements in an auto/auto cell (with other rows/columns 1fr)', function () {
        var currentGrid;

        beforeEach(function () {
            var tallCell,
                tallDiv,
                wideCell,
                wideDiv;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '400px',
                'height': '400px',
                'rows': 'auto 1fr',
                'columns': 'auto 1fr',
                elements: [
                    'basicGrid__tallCell 1 1 1 1',
                    'basicGrid__wideCell 1 1 1 1',
                    'basicGrid__firstColumn 1 1 2 1',
                    'basicGrid__secondColumn 1 2 2 1',
                    'basicGrid__firstRow 1 1 1 2',
                    'basicGrid__secondRow 2 1 1 2'
                ]
            });

            helper.addGrid(currentGrid);

            tallCell = document.getElementById('basicGrid__tallCell');
            tallDiv = document.createElement('div');
            tallDiv.style.width = 20;
            tallDiv.style.height = 80;
            tallCell.appendChild(tallDiv);

            wideCell = document.getElementById('basicGrid__wideCell');
            wideDiv = document.createElement('div');
            wideDiv.style.width = 80;
            wideDiv.style.height = 20;
            wideCell.appendChild(wideDiv);


            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates wider cell', function () {
            helper.expectGridElement('basicGrid__wideCell', {
                left: '0px',
                top: '0px',
                width: '80px',
                height: '80px'
            });
        });
        it('correctly calculates taller cell', function () {
            helper.expectGridElement('basicGrid__tallCell', {
                left: '0px',
                top: '0px',
                width: '80px',
                height: '80px'
            });
        });
        it('correctly calculates first column', function () {
            helper.expectGridElement('basicGrid__firstColumn', {
                left: '0px',
                top: '0px',
                width: '80px',
                height: '400px'
            });
        });
        it('correctly calculates second column', function () {
            helper.expectGridElement('basicGrid__secondColumn', {
                left: '80px',
                top: '0px',
                width: '320px',
                height: '400px'
            });
        });
        it('correctly calculates first row', function () {
            helper.expectGridElement('basicGrid__firstRow', {
                left: '0px',
                top: '0px',
                width: '400px',
                height: '80px'
            });
        });
        it('correctly calculates second row', function () {
            helper.expectGridElement('basicGrid__secondRow', {
                left: '0px',
                top: '80px',
                width: '400px',
                height: '320px'
            });
        });
    });

    describe('A grid with "-ms-grid-columns: 100px auto 1fr" and an element with "-ms-grid-column: 1; -ms-grid-column-span; 2" containing an element with "width: 120px"', function () {
        var currentGrid;

        beforeEach(function () {
            var target,
                targetb,
                spanner;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '600px',
                'height': '300px',
                'rows': '1fr',
                'columns': '100px auto 1fr',
                elements: [
                    'spanner_parent 1 1 1 2',
                    'basicGrid__px 1 1 1 1',
                    'basicGrid__auto 1 2 1 1',
                    'basicGrid__fr 1 3 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            target = document.getElementById('spanner_parent');
            target.style.width = '120px';
            spanner = document.createElement('div');
            spanner.style.width = '110px';
            spanner.style.height = '40px';
            target.appendChild(spanner);


            targetb = document.getElementById('basicGrid__auto');
            targetb.style.width = '15px';


            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates first column', function () {
            helper.expectGridElement('basicGrid__px', {
                left: '0px',
                top: '0px',
                width: '100px',
                height: '300px'
            });
        });
        it('correctly calculates second column', function () {
            helper.expectGridElement('basicGrid__auto', {
                left: '100px',
                top: '0px',
                width: '20px',
                height: '300px'
            });
        });
        it('correctly calculates third column', function () {
            helper.expectGridElement('basicGrid__fr', {
                left: '120px',
                top: '0px',
                width: '480px',
                height: '300px'
            });
        });
    });

    describe('A grid with "-ms-grid-rows: 100px auto 1fr" and an element with "-ms-grid-row: 1; -ms-grid-row-span; 2" containing an element with "height: 120px"', function () {
        var currentGrid;

        beforeEach(function () {
            var target,
                spanner;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '300px',
                'height': '600px',
                'rows': '100px auto 1fr',
                'columns': '1fr',
                elements: [
                    'spanner_parent 1 1 2 1',
                    'basicGrid__px 1 1 1 1',
                    'basicGrid__auto 2 1 1 1',
                    'basicGrid__fr 3 1 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            target = document.getElementById('spanner_parent');
            spanner = document.createElement('div');
            spanner.style.height = '120px';
            spanner.style.width = '40px';
            target.appendChild(spanner);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates first column', function () {
            helper.expectGridElement('basicGrid__px', {
                left: '0px',
                top: '0px',
                width: '300px',
                height: '100px'
            });
        });
        it('correctly calculates second column', function () {
            helper.expectGridElement('basicGrid__auto', {
                left: '0px',
                top: '100px',
                width: '300px',
                height: '20px'
            });
        });
        it('correctly calculates third column', function () {
            helper.expectGridElement('basicGrid__fr', {
                left: '0px',
                top: '120px',
                width: '300px',
                height: '480px'
            });
        });
    });

    describe('A grid with adjacent auto-heights (50px auto auto 1fr) and elements spanning more than one auto', function () {
        var currentGrid;

        beforeEach(function () {
            var longer,
                middle;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '123px',
                'height': '600px',
                'rows': '50px auto auto 1fr',
                'columns': '1fr',
                elements: [
                    'basicGrid__longer 1 1 3 1',
                    'basicGrid__middle 1 2 1 1',
                    'basicGrid__row1 1 1 1 1',
                    'basicGrid__row2 2 1 1 1',
                    'basicGrid__row3 3 1 1 1',
                    'basicGrid__row4 4 1 1 1'
                ]
            });

            helper.addGrid(currentGrid);

            longer = document.getElementById('basicGrid__longer');
            longer.style.height = '100px';
            middle = document.getElementById('basicGrid__middle');
            middle.style.height = '20px';

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
        });

        it('correctly calculates first row', function () {
            helper.expectGridElement('basicGrid__row1', {
                left: '0px',
                top: '0px',
                width: '123px',
                height: '50px'
            });
        });
        it('correctly calculates second row', function () {
            helper.expectGridElement('basicGrid__row2', {
                left: '0px',
                top: '50px',
                width: '123px',
                height: '25px'
            });
        });
        it('correctly calculates third row', function () {
            helper.expectGridElement('basicGrid__row3', {
                left: '0px',
                top: '75px',
                width: '123px',
                height: '25px'
            });
        });
        it('correctly calculates fourth row', function () {
            helper.expectGridElement('basicGrid__row4', {
                left: '0px',
                top: '100px',
                width: '123px',
                height: '500px'
            });
        });

    });

    describe('A grid nested within a grid', function () {
        var currentOuterGrid,
            currentInnerGrid;

        beforeEach(function () {
            currentOuterGrid = helper.makeGrid({
                'id': 'outerGrid',
                'width': '600px',
                'height': '600px',
                'rows': '1fr 1fr',
                'columns': '1fr 1fr',
                elements: [
                    'outerGrid__topleft 1 1 1 1',
                    'outerGrid__topright 1 2 1 1',
                    'outerGrid__botleft 2 1 1 1',
                    'outerGrid__botright 2 2 1 1'
                ]
            });
            helper.addGrid(currentOuterGrid);

            var inner_parent = document.getElementById('outerGrid__botright');

            currentInnerGrid = helper.makeGrid({
                'id': 'innerGrid',
                'width': '100%',
                'height': '100%',
                'rows': '1fr 1fr',
                'columns': '1fr 1fr',
                elements: [
                    'innerGrid__topleft 1 1 1 1',
                    'innerGrid__topright 1 2 1 1',
                    'innerGrid__botleft 2 1 1 1',
                    'innerGrid__botright 2 2 1 1'
                ]
            });

            inner_parent.appendChild(currentInnerGrid.gridParent);
            document.head.appendChild(currentInnerGrid.gridStyle);

            core.layout.invalidate({ reparse: true });

            waits(75);
        });

        afterEach(function () {
            helper.removeGrid(currentInnerGrid);
            helper.removeGrid(currentOuterGrid);
        });

        it('correctly sizes its inner grid', function () {
            var expected = {
                width: '300px',
                height: '300px'
            },
                element = document.getElementById('innerGrid'),
                style = window.getComputedStyle(element);

            Object.keys(expected).forEach(function (property) {
                expect(style[property]).toEqual(expected[property]);
            });
        });
        it('correctly places its inner grid\'s top left element', function () {
            helper.expectGridElement('innerGrid__topleft', {
                left: '0px',
                top: '0px',
                width: '150px',
                height: '150px'
            });
        });
        it('correctly places its inner grid\'s top right element', function () {
            helper.expectGridElement('innerGrid__topright', {
                left: '150px',
                top: '0px',
                width: '150px',
                height: '150px'
            });
        });
        it('correctly places its inner grid\'s bottom left element', function () {
            helper.expectGridElement('innerGrid__botleft', {
                left: '0px',
                top: '150px',
                width: '150px',
                height: '150px'
            });
        });
        it('correctly places its inner grid\'s bottom right element', function () {
            helper.expectGridElement('innerGrid__botright', {
                left: '150px',
                top: '150px',
                width: '150px',
                height: '150px'
            });
        });
    });

    describe('A grid with a grid-aligned elements TEST INCOMPLETE', function () {
        var currentGrid,
            itemStyles;

        beforeEach(function () {
            var gridParent,
                childIds,
                styleText,
                itemStyleText;

            currentGrid = helper.makeGrid({
                'id': 'basicGrid',
                'width': '400px',
                'height': '400px',
                'rows': '1fr 1fr',
                'columns': '1fr 1fr',
                elements: [
                    'basicGrid__topleft 1 1 1 1'
                ]
            });
            helper.addGrid(currentGrid);

            gridParent = document.getElementById('basicGrid');
            childIds = [
                'leftAligned',
                'centerColumnAligned',
                'rightAligned',
                'stretchedColumn',
                'topAligned',
                'centerRowAligned',
                'bottomAligned',
                'stretchedRow'
            ];
            childIds.forEach(function (id) {
                var element = document.createElement('div');
                element.id = id;
                gridParent.appendChild(element);
            });

            styleText = '';
            styleText = styleText.concat('#' + 'leftAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-column-align: start; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'centerColumnAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-column-align: center; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'rightAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-column-align: end; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'stretchedColumn' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-column-align: stretch; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');



            styleText = '';
            styleText = styleText.concat('#' + 'topAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-row-align: start; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'centerRowAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-row-align: center; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'bottomAligned' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-row-align: end; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');

            styleText = '';
            styleText = styleText.concat('#' + 'stretchedRow' + ' { \n');
            styleText = styleText.concat('width: ' + 10 + '; \n');
            styleText = styleText.concat('height: ' + 10 + '; \n');
            styleText = styleText.concat('-ms-grid-row-align: stretch; \n');
            styleText = styleText.concat('background: green; \n');
            styleText = styleText.concat('} \n\n');


            itemStyles = document.createElement('style');
            itemStyleText = document.createTextNode(styleText);
            itemStyles.appendChild(itemStyleText);
            document.head.appendChild(itemStyles);

        });

        afterEach(function () {
            helper.removeGrid(currentGrid);
            itemStyles.parentNode.removeChild(itemStyles);
        });

        it('correctly places leftAligned', function () {
            helper.expectGridElement('leftAligned', {
                left: '0px',
                width: '10px'
            });
        });
    });*/
});