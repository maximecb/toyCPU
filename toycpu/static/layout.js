/*****************************************************************************
*
*              toyCPU : Assembly Programming Teaching Platform
*
*  This file is part of the toyCPU project. The project is distributed at:
*  https://github.com/maximecb/toyCPU
*
*
*  Copyright (c) 2011, Maxime Chevalier-Boisvert
*  All rights reserved.
*
*  This software is licensed under the following license (Modified BSD
*  License):
*
*  Redistribution and use in source and binary forms, with or without
*  modification, are permitted provided that the following conditions are
*  met:
*    * Redistributions of source code must retain the above copyright
*      notice, this list of conditions and the following disclaimer.
*    * Redistributions in binary form must reproduce the above copyright
*      notice, this list of conditions and the following disclaimer in the
*      documentation and/or other materials provided with the distribution.
*    * Neither the name of the Universite de Montreal nor the names of its
*      contributors may be used to endorse or promote products derived
*      from this software without specific prior written permission.
*
*  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
*  IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
*  TO, THE IMPLIED WARRANTIES OF MERCHApNTABILITY AND FITNESS FOR A
*  PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL UNIVERSITE DE
*  MONTREAL BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
*  EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
*  PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
*  PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
*  LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
*  NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
*  SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*
*****************************************************************************/

/**
GUI layout module
*/
var layout = (function () 
{
    // Column width
    var COLUMN_WIDTH = 550;

    // Menu bar container element
    var menuCont = undefined;

    // Page container element
    var pageCont = undefined;

    // Module container element
    var moduleCont = undefined;

    // Tab frame elements
    var tabFrames = [];

    // Module objects
    var modules = [];

    // Module layout columns
    var columns = [];

    // Module currently being dragged
    var dragMod = undefined;
    var dragRect = undefined;
    var dragStartX = undefined;
    var dragStartY = undefined;
    var dragGhost = undefined;

    // Initialize the layout after the window is loaded
    window.addEventListener('load', initLayout);

    /**
    Initialize the layout code
    */
    function initLayout()
    {
        // Get the document body
        body = document.body;

        // Get the page container
        pageCont = document.getElementById('page-container');

        // Get the module container
        moduleCont = document.getElementById('module-container');

        // Get the menu bar container
        menuCont = document.getElementById('menu-bar');

        // For each element of the body
        for (var i = 0; i < body.childNodes.length; ++i)
        {
            var child = body.childNodes[i];

            // If this is a tab frame div
            if (child.className === 'tab-frame-clear' || 
                child.className === 'tab-frame')
            {
                // Remove the div from the body
                body.removeChild(child);

                // Create the tab
                makeTab(child);

                // Add the element to the tab frames
                tabFrames.push(child);
            }
            
            // If this is a module content div
            else if (child.className === 'module-content')
            {
                // Remove the content div from the body
                body.removeChild(child);

                // Create a module object
                var moduleObj = makeModule(child);

                // Add the module to the list
                modules.push(moduleObj);
            }
        }

        // Resize the layout on window resizing
        window.addEventListener('resize', resizeLayout);

        // Add mouse event handlers to the event body
        body.addEventListener('mousemove', mouseMove);
        body.addEventListener('mouseup', stopDrag);

        // Adjust the layout to the window size
        resizeLayout();

        // Make the first tab active
        tabFrames[0].button.onclick();
    };

    /**
    Resize the layout
    */
    function resizeLayout()
    {
        // Get the size of the rendering area
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;

        // Compute the number of columns to use
        var numColumns = Math.max(1, Math.floor(windowWidth / COLUMN_WIDTH));

        // Column width in percentage
        var colWidth = Math.floor(100 / numColumns);

        console.log('Num columns: ' + numColumns);

        // Set the width of the page container to the total width of the columns
        pageCont.style.width = (numColumns * COLUMN_WIDTH) + 'px';

        // Delete the existing columns
        columns = [];
        if (moduleCont.childNodes.length > 0)
            moduleCont.removeChild(moduleCont.childNodes[0]);

        // Create the module column table
        var moduleTbl = document.createElement('div');
        moduleTbl.className = 'module-table';
        moduleCont.appendChild(moduleTbl);
        var tableRow = document.createElement('div');
        tableRow.className = 'module-table-row';
        moduleTbl.appendChild(tableRow);

        // Create the columns
        for (var i = 0; i < numColumns; ++i)
        {
            var column = document.createElement('div');
            column.className = 'module-table-column';
            tableRow.appendChild(column);

            // Set the column width
            column.style.width = colWidth + '%';

            // Add padding space in between the columns
            if (i < numColumns - 1)
                column.style['padding-right'] = '2px';
            if (i > 0)
                column.style['padding-left'] = '2px';

            // Add the column to the list
            columns.push(column);
        }

        // Seed the layout
        for (var i = 0; i < modules.length; ++i)
        {
            var col = i % columns.length;
            columns[col].appendChild(modules[i].module);
        }
    };

    /**
    Create a tab
    */
    function makeTab(frameDiv)
    {
        // FIXME: temporary
        //frameDiv.style.display = 'block';

        // Add the element to the page container
        pageCont.appendChild(frameDiv);

        // Get the tab name
        var tabName = frameDiv.getAttribute('data-name');

        var button = document.createElement('div');
        button.className = 'menu-button';
        var buttonText = document.createTextNode(tabName);
        button.appendChild(buttonText);

        menuCont.appendChild(button);

        frameDiv.button = button;

        button.onclick = function ()
        {
            frameDiv.style.display = 'block';
            button.className = 'menu-button-on';
            
            for (var i = 0; i < tabFrames.length; ++i)
            {
                var tab = tabFrames[i];
                if (tab === frameDiv)
                    continue;
                tab.style.display = 'none';
                tab.button.className = 'menu-button';
            }
        };
    }

    /**
    Create a module object
    */
    function makeModule(contentDiv)
    {
        // Make the content div visible
        contentDiv.style.display = 'block';

        // Get the module name
        var titleStr = contentDiv.getAttribute('data-name');

        // Create the module div
        var moduleDiv = document.createElement('div');
        moduleDiv.className = 'module';

        // Create the title bar div and its components
        var titleBar = document.createElement('div');
        titleBar.className = 'module-title';
        var titleRow = document.createElement('div');
        titleRow.className = 'module-title-row';
        var leftCell = document.createElement('div');
        leftCell.className = 'module-title-left';
        var rightCell = document.createElement('div');
        rightCell.className = 'module-title-right';
        var titleText = document.createTextNode(titleStr);
        var minMaxBtn = document.createElement('div');
        minMaxBtn.className = 'module-title-button';
        var minMaxText = document.createTextNode('[-]');
        var closeBtn = document.createElement('div');
        closeBtn.className = 'module-title-button';
        var closeText = document.createTextNode('[X]');

        // Assemble the title bar
        titleBar.appendChild(titleRow);
        titleRow.appendChild(leftCell);
        titleRow.appendChild(rightCell);
        leftCell.appendChild(titleText);
        rightCell.appendChild(minMaxBtn);
        //rightCell.appendChild(closeBtn);
        minMaxBtn.appendChild(minMaxText);
        closeBtn.appendChild(closeText);

        // Assemble the module
        moduleDiv.appendChild(titleBar);
        moduleDiv.appendChild(contentDiv);

        // Create the module object
        var moduleObj = {
            module: moduleDiv,
            titleBar: titleBar,
            minMaxBtn: minMaxBtn,
            closeBtn: closeBtn
        };

        // Setup the minimize/maximize button
        minMaxBtn.onclick = function ()
        {
            if (contentDiv.style.display === 'none')
            {
                contentDiv.style.display = 'block';
                minMaxText.data = '[-]';
            }
            else
            {
                contentDiv.style.display = 'none';
                minMaxText.data = '[+]';
            }
        }

        // Setup the drag area
        leftCell.onmousedown = function (event)
        {
            beginDrag(event, moduleObj);
        }

        // Return the module object
        return moduleObj;
    }

    /**
    Begin dragging a module
    */
    function beginDrag(event, module)
    {
        console.log('starting module drag');

        event.preventDefault();
        event.stopPropagation();

        // Fix the body height to avoid resizing/scrolling issues
        var body = document.body;
        var bodyRect = body.getBoundingClientRect();
        body.style['min-height'] = bodyRect.height;

        var div = module.module;
        var rect = div.getBoundingClientRect();

        dragMod = module;
        dragRect = rect;
        dragStartX = event.clientX + document.body.scrollLeft;
        dragStartY = event.clientY + document.body.scrollTop;

        div.style.position = 'absolute';
        div.style.top = rect.top + document.body.scrollTop;
        div.style.left = rect.left + document.body.scrollLeft;
        div.style.width = rect.width;
        div.style['z-index'] = 100;

        // Create the drag ghost element
        dragGhost = document.createElement('div');
        dragGhost.className = 'module-ghost';
        dragGhost.style.height = rect.height;

        // Add the ghost in place of the dragged module
        div.parentNode.insertBefore(dragGhost, div);
    }

    /**
    Handle mouse movements during the drag and drop process
    */
    function mouseMove(event)
    {
        if (dragMod === undefined)
            return;

        var body = document.body;

        var div = dragMod.module;

        var curX = event.clientX + body.scrollLeft;
        var curY = event.clientY + body.scrollTop;

        var deltaX = curX - dragStartX;
        var deltaY = curY - dragStartY;

        var divLeft = dragRect.left + body.scrollLeft + deltaX
        var divTop = dragRect.top + body.scrollTop + deltaY

        // Reposition the dragged module
        div.style.left = divLeft;
        div.style.top = divTop;

        // Remove the ghost from its current position
        if (dragGhost.parentNode !== null)
            dragGhost.parentNode.removeChild(dragGhost);

        // Find the closest column
        var closestDist = Infinity;
        var closestCol = undefined;
        for (var i = 0; i < columns.length; ++i)
        {
            var column = columns[i];
            var colRect = column.getBoundingClientRect();
            var colLeft = colRect.left + body.scrollLeft;
            var colDist = Math.abs(divLeft - colLeft);
            if (colDist < closestDist)
            {
                closestCol = column;
                closestDist = colDist;
            }
        }

        // Find the closest row
        var closestDist = Infinity;
        var closestRow = 0;
        for (var i = 0; i < closestCol.childNodes.length; ++i)
        {
            var child = closestCol.childNodes[i];

            if (child === div)
                continue;

            var childRect = child.getBoundingClientRect();
            var childTop = childRect.top + body.scrollTop;
            var rowDist = Math.abs(divTop - childTop);

            if (rowDist < closestDist)
            {
                closestRow = i;
                closestDist = rowDist;
            }
        }

        // Check if the last row is actually the closest position
        var lastTop = (childRect === undefined)? 
            body.scrollTop:
            (childRect.top + childRect.height + body.scrollTop);
        var lastDist = Math.abs(divTop - lastTop);

        // Insert the drag ghost at the closest position
        if (lastDist < closestDist)
            closestCol.appendChild(dragGhost);
        else
            closestCol.insertBefore(dragGhost, closestCol.childNodes[closestRow]);
    }

    /**
    Drop the dragged module
    */
    function stopDrag(event)
    {
        if (dragMod === undefined)
            return;

        // Reset the body min-height restriction
        document.body.style['min-height'] = '';

        var div = dragMod.module;

        // Reset the dragged div style
        div.style.position = 'static';
        div.style.width = '';
        div.style['z-index'] = '';

        var srcColumn = div.parentNode;
        var dstColumn = dragGhost.parentNode;

        srcColumn.removeChild(div);

        dstColumn.insertBefore(div, dragGhost);
        dstColumn.removeChild(dragGhost);

        dragMod = undefined;
        dragGhost = undefined;
    }

    /**
    Show an information/notification box
    */
    function infoBox(titleStr, msgStr, infoType)
    {
        var borderColor;
        var titleColor;
        var backColor;
        switch (infoType)
        {
            case 'error':
            borderColor = 'rgb(200,0,0)';
            titleColor  = 'rgb(150,0,0)';
            backColor   = 'rgb(30 ,0,0)';
            break;

            case 'warning': 
            // TODO
            break;

            case 'notify': 
            default:
            // TODO
            break;
        }

        // Create the info div
        var infoDiv = document.createElement('div');
        infoDiv.className = 'module';
        infoDiv.style['border-color'] = borderColor;

        // Create the title bar div and its components
        var titleBar = document.createElement('div');
        titleBar.className = 'module-title';
        titleBar.style.background = titleColor;
        var titleRow = document.createElement('div');
        titleRow.className = 'module-title-row';
        var leftCell = document.createElement('div');
        leftCell.className = 'module-title-left';
        var rightCell = document.createElement('div');
        rightCell.className = 'module-title-right';
        var titleText = document.createTextNode(titleStr);
        var closeBtn = document.createElement('div');
        closeBtn.className = 'module-title-button';
        var closeText = document.createTextNode('[X]');

        // Assemble the title bar
        titleBar.appendChild(titleRow);
        titleRow.appendChild(leftCell);
        titleRow.appendChild(rightCell);
        leftCell.appendChild(titleText);
        rightCell.appendChild(closeBtn);
        closeBtn.appendChild(closeText);
        
        // Create the content div
        var contentDiv = document.createElement('div');
        contentDiv.appendChild(document.createTextNode(msgStr));
        contentDiv.className = 'module-content';
        contentDiv.style.background = backColor;
        contentDiv.style.padding = '8px';
        contentDiv.style['font-size'] = '16px';
        contentDiv.style['font-weight'] = 'bold';

        // Assemble the info box
        infoDiv.appendChild(titleBar);
        infoDiv.appendChild(contentDiv);

        // Setup the close button
        closeBtn.onclick = function ()
        {
            infoDiv.parentNode.removeChild(infoDiv);
        }

        // Add the info box in the info area
        var infoArea = document.getElementById('info-area');
        infoArea.appendChild(infoDiv);

        // Scroll at least as high as top of info box
        var rect = infoDiv.getBoundingClientRect();
        if (rect.top < 0)
            document.body.scrollTop += rect.top;
    }

    return {
        infoBox: infoBox
    };

})();

