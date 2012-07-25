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
toyCPU graphical interface module
*/
var toyCPU = (function () 
{
    /**
    Graphical view canvas
    */
    var canvas = undefined;

    /**
    ASM code editor
    */
    var codeEditor = undefined;

    /**
    Library code view
    */
    var libCodeView = undefined;

    /**
    Execution control buttons
    */
    var runButton = undefined;
    var stopButton = undefined;
    var resumeButton = undefined;

    /**
    Number of stack rows to display
    */
    var NUM_STACK_ROWS = 10;

    /**
    Array of stack row objects
    */
    var stackRows = [];

    /**
    toyCPU VM instance
    */
    var vm = undefined;

    /**
    Max number of VM updates per second
    */
    var MAX_VM_UPDATE_RATE = 40;

    var vmUpdateInterv = undefined;

    var vmSpeedLimit = Infinity;

    var vmUpdatesRate = 0;

    var vmCycPerUpdate = 0;

    /**
    Measured VM speed
    */
    var vmClockSpeed = 0;

    /**
    Last time the VM views were updated
    */
    var lastViewUpdate = 0;

    // Initialize toyCPU after the window is loaded
    window.addEventListener('load', init);

    // Save the current code (if any) before leaving
    window.addEventListener('beforeunload', saveLocal);

    /**
    Called after page load to initialize needed resources
    */
    function init()
    {
        // set up auto-completions
        CodeMirror.commands.autocomplete = function(cm)
        {
            CodeMirror.simpleHint(cm, CodeMirror.toyCPUHint);
        }
        
        // Create the code editor element
        codeEditor = CodeMirror(
            document.getElementById('code-editor'), 
            {
                theme: 'asm',
                lineNumbers: true,
                readOnly: false,
                extraKeys: {'Ctrl-Space': 'autocomplete'}
            }
        );

        // expose the editor
        CodeMirror.toyCPU.codeEditor = codeEditor;

        // Load last code (if any)
        loadLocal();

        // Give the code editor focus
        codeEditor.focus();

        // Create a 2D context for the canvas object
        canvas = document.getElementById('screen-canvas');
        canvas.ctx = canvas.getContext('2d');

        // Create the library code view element
        libCodeView = CodeMirror(
            document.getElementById('lib-code'), 
            {
                theme: 'asm',
                lineNumbers: true,
                readOnly: true
            }
        );

        // Put the library source code in the code view
        libCodeView.setValue(STDLIB_SRC);

        // setup hints for the std lib
        CodeMirror.toyCPU.setupHints(libCodeView);

        // Get the execution control buttons
        runButton = document.getElementById('button-run');
        stopButton = document.getElementById('button-stop');
        resumeButton = document.getElementById('button-resume');

        // Create the virtual machine instance
        vm = new VM();

        // Create the peripheral devices
        vm.addDevice(new VideoDevice(canvas), 0);
        vm.addDevice(new KeyboardDevice()   , 1);
        vm.addDevice(new ClockDevice()      , 2);

        // Initialize the manual
        initManual();

        // Initialize the stack view
        initStackView();

        // Initialize the VM views
        updateViews();

        console.log('Opcode count: ' + instrFormats.length);
        console.log('Register count: ' + regNames.length);
    }

    /**
    Initialize the auto-generated parts of the manual
    */
    function initManual()
    {
        function add(node, child)
        {
            node.appendChild(child);
        }

        function node(tag, child)
        {
            var node = document.createElement(tag);
            if (child)
                add(node, child);
            return node;
        }

        function text(str)
        {
            var tNode = document.createTextNode(String(str));
            return tNode;
        }

        function b(child)
        {
            return node('b', child);
        }

        function p(child)
        {
            return node('p', child);
        }

        // Current manual heading numbering
        var numbering = [];

        function getHeadingNo(level)
        {
            if (numbering.length === level)
                numbering[level] = 0;
            else if (level < numbering.length - 1)
                numbering.length = level + 1;

            numbering[level]++;

            var numStr = '';

            for (var i = 0; i <= level; ++i)
            {
                if (numStr !== '')
                    numStr += '.';
                numStr += numbering[i];
            }

            return numStr;
        }

        // Get the manual tab element
        var manualTab = document.getElementById('manual-tab');

        // Get the manual contents element
        var contents = document.getElementById('manual_contents');

        // For each child element of the manual tab
        for (var i = 0; i < manualTab.childNodes.length; ++i)
        {
            var child = manualTab.childNodes[i];
            var tagName = child.tagName;

            if (tagName === undefined ||
                tagName.length !== 2 || 
                tagName.substr(0, 1) !== 'H')
                continue;

            // Get the heading level number (0-indexed)
            var levelNo = Number(child.tagName.substr(1)) - 1;

            // Get the heading number string
            var headingNo = getHeadingNo(levelNo);

            // Add the numbering text to the heading
            var textNode = child.childNodes[0];
            var headingName = textNode.data
            textNode.data = headingNo + '\xa0\xa0' + headingName;

            // Create an anchor for the heading
            var anchorNode = node('a');
            anchorNode.name = headingNo;
            child.insertBefore(anchorNode, textNode);

            // Create the contents listing element
            var listingNode = node('div');
            listingNode.className = 'manual_listing';
            add(contents, listingNode);

            // Add a margin and the heading number to the listing element
            var prefixStr = '';
            for (var j = 0; j < levelNo; ++j)
                prefixStr += '\xa0\xa0\xa0';
            add(listingNode, text(prefixStr + headingNo + ' '));

            // Create the section link element
            var linkNode = node('a', text(headingName));
            linkNode.href = '#' + headingNo;
            add(listingNode, linkNode);
        }

        // Get the instruction listing element
        var instrNode = document.getElementById('instr_listing');

        // For each instruction
        for (var instrName in instrTable)
        {
            var entry = instrTable[instrName];
            var opnds = entry.opnds;

            var pNode = p(b(text(entry.mnem)));
            var opndText;
            switch (opnds.length)
            {
                case 0: opndText = 'no operands'; break;
                case 1: opndText = '1 operand'; break;
                default: opndText = opnds.length + ' operands'; break;
            }
            add(pNode, text(' (' + opndText +')'));
            add(instrNode, pNode);

            if (entry.desc !== undefined)
            {
                add(instrNode, p(text(entry.desc)));
            }
        }
    }

    /**
    Save the code locally so it can be restored
    */
    function saveLocal()
    {
        var srcStr = codeEditor.getValue();
        if (window.localStorage)
            localStorage.setItem("toyCPU.last", srcStr);
    }

    /**
    Restore the local backup of the code
    */
    function loadLocal()
    {
        if (window.localStorage)
        {
            var srcStr = localStorage.getItem("toyCPU.last");
            if (srcStr)
                codeEditor.setValue(srcStr);
        }
    }

    /**
    Called when the "Compile & Run" button is clicked
    */
    function compileAndRun()
    {
        console.log('Compiling source');

        try 
        {
            var asmLib = asm.parseStr(STDLIB_SRC);

            // Get the source code
            var srcStr = codeEditor.getValue();

            console.log('source length: ' + srcStr.length);

            var asmSrc = asm.parseStr(srcStr);

            var asmCode = asmLib.concat(asmSrc);

            console.log('num directives: ' + asmCode.length);

            var codeStream = asm.assemble(asmCode);

            console.log('code stream length: ' + codeStream.length);

            vm.init(codeStream);

            // Update the VM views
            updateViews();

            // Start the VM update interval
            setClockSpeed();

            // Update the execution control button states
            stopButton.disabled = false;
            resumeButton.disabled = true;
        }

        catch (e)
        {
            if (e.stack)
                console.error(String(e.stack));
            else
                console.error(String(e));
        }
    }

    /**
    Called when the "Stop Program" button is clicked
    */
    function stopProgram()
    {
        // Mark the VM as stopped
        vm.running = false;

        // Stop the VM update interval
        if (vmUpdateInterv !== undefined)
            clearInterval(vmUpdateInterv);

        // Update the execution control button states
        stopButton.disabled = true;
        resumeButton.disabled = false;
    }

    /**
    Called when the "Resume Program" button is clicked
    */
    function resumeProgram()
    {
        // Mark the VM as running
        vm.running = true;

        // Start the VM update interval
        setClockSpeed();

        // Update the execution control button states
        stopButton.disabled = false;
        resumeButton.disabled = true;
    }

    /**
    Called when the clock speed selection buttons are clicked
    */
    function setClockSpeed()
    {
        // Get the clock speed from the radio buttons
        var formNode = document.getElementById('clock-speed');
        for (var i = 0; i < formNode.childNodes.length; ++i)
        {
            var child = formNode.childNodes[i];

            if (child.checked === true)
            {
                vmSpeedLimit = Number(child.value);
                break;
            }
        }

        var stepButton = document.getElementById('clock_step');

        // Stop the VM update interval
        if (vmUpdateInterv !== undefined)
            clearInterval(vmUpdateInterv);

        // If the clock was set to manual
        if (vmSpeedLimit === 0)
        {
            stepButton.disabled = false;
        }

        // Nonzero clock speed
        else
        {
            stepButton.disabled = true;

            vmUpdateRate = Math.min(MAX_VM_UPDATE_RATE, vmSpeedLimit);

            vmCycPerUpdate = Math.floor(vmSpeedLimit / vmUpdateRate);

            // Start the VM update interval
            if (vm.running === true)
            {
                vmUpdateInterv = setInterval(
                    updateVM, 
                    1000 / vmUpdateRate
                );
            }
        }
    }

    /**
    Update the VM, run the program for a short time interval.
    */
    function updateVM()
    {
        try
        {
            // If the clock is set to manual
            if (vmSpeedLimit === 0)
            {
                vm.run(1);
            }

            // Multiple cycles per update
            else
            {
                var startTime = getTimeMillis();
                var timeLimit = 1000 / vmUpdateRate;
                var endTime = startTime + timeLimit;

                var cycPerRound = Math.ceil(Math.min(vmCycPerUpdate / 4, 1000));

                var cycCount = 0;

                // Iterate until the time or 
                // cycle limit is reached or
                // the VM is stopped
                for (;;)
                {
                    vm.run(cycPerRound);

                    cycCount += cycPerRound;

                    var curTime = getTimeMillis();

                    if (curTime > endTime          || 
                        cycCount >= vmCycPerUpdate ||
                        vm.running === false)
                        break;
                }
            }
        }

        // Catch run-time errors
        catch (e)
        {
            // Mark the VM as stopped
            vm.running = false;

            if (e.stack)
                console.error(String(e.stack));
            else
                console.error(String(e));
        }

        // If the VM is now stopped, stop the VM update interval
        if (vm.running === false)
        {
            stopProgram();
        }

        // Update the effective clock speed count
        if (updateVM.countItrs === undefined || updateVM.countItrs > 20)
        {
            var totalCycles = vm.cycleCount - updateVM.lastCycleCount;
            var totalTime = (curTime - updateVM.lastTime) / 1000;

            updateVM.countItrs = 0;
            updateVM.lastCycleCount = vm.cycleCount;
            updateVM.lastTime = curTime;

            var clockSpeed = Math.floor(totalCycles / totalTime);
            if ((clockSpeed > 0) === false)
                clockSpeed = 0;

            vmClockSpeed = clockSpeed;
        }
        updateVM.countItrs++;

        // Update the VM views
        if (vmSpeedLimit < 50 || getTimeMillis() - lastViewUpdate > 80)
        {
            updateViews();
            lastViewUpdate = getTimeMillis();
        }
    }

    /**
    Update the various VM state views
    */
    function updateViews()
    {
        // TODO: don't update if minimized

        var speedNode = document.getElementById('vm_speed');
        var countNode = document.getElementById('cycle_count');

        var speedStr = leftPadStr(String(vmClockSpeed), 8, '\xa0');
        speedNode.childNodes[0].data = speedStr;

        var countStr = leftPadStr(String(vm.cycleCount), 12, '\xa0');
        countNode.childNodes[0].data = countStr;

        updateRegView();

        updateStackView();
    }

    /**
    Update the register view
    */
    function updateRegView()
    {
        for (var i = 0; i < vm.regs.length; ++i)
        {
            var regName = regNames[i];

            if (regName.indexOf('?') !== -1)
                continue;

            var regVal = vm.regs[i];

            if (regName === 'rip' || regName === 'rsp')
                regVal = regVal & 0xFFFF;

            var textVal = leftPadStr(String(regVal), 6, '\xa0');

            var regNode = document.getElementById(regName);
            var textNode = regNode.childNodes[0];
            textNode.data = textVal;
        }
    }

    /**
    Initialize the stack view
    */
    function initStackView()
    {
        // Get the stack table
        var stackTable = document.getElementById('stack-table');

        // For each stack row to display
        for (var i = 0; i < NUM_STACK_ROWS; ++i)
        {
            var rowElem = document.createElement('tr');

            var spElem = document.createElement('td');
            var spText = document.createTextNode('');
            spElem.className = 'addr';
            var addrElem = document.createElement('td');
            var addrText = document.createTextNode('0');
            addrElem.className = 'addr';
            var decElem = document.createElement('td');
            var decText = document.createTextNode('0');
            decElem.className = 'val';
            var binElem = document.createElement('td');
            var binText = document.createTextNode('0');
            binElem.className = 'val';
            var hexElem = document.createElement('td');
            var hexText = document.createTextNode('0');
            hexElem.className = 'val';

            stackTable.appendChild(rowElem);
            rowElem.appendChild(spElem);
            rowElem.appendChild(addrElem);
            rowElem.appendChild(decElem);
            rowElem.appendChild(hexElem);
            rowElem.appendChild(binElem);
            spElem.appendChild(spText);
            addrElem.appendChild(addrText);
            decElem.appendChild(decText);
            hexElem.appendChild(hexText);
            binElem.appendChild(binText);

            stackRows.push({
                spElem  : spElem,
                addrElem: addrElem,
                decElem : decElem,
                hexElem : hexElem,
                binElem : binElem,
                spText  : spText,
                addrText: addrText,
                decText : decText,
                hexText : hexText,
                binText : binText
            });
        }
    }

    /**
    Update the stack view
    */
    function updateStackView()
    {
        // Get the number of stack slots to show
        var numSlots = stackRows.length;

        // Get the stack pointer
        var rsp = vm.regs[regIndices.rsp] & 0xFFFF;

        if (rsp === 0)
            rsp = 0xFFFF + 1;

        var botAddr = Math.max(0, Math.min(0xFFFF - numSlots + 1, rsp - 3));
        var topAddr = botAddr + numSlots - 1;

        // For each slot to draw
        for (var i = 0; i < numSlots; ++i)
        {
            var row = stackRows[i];

            var slotAddr = topAddr - i;
            var addrStr = leftPadStr(slotAddr, 5, '\xa0');
            row.addrText.data = addrStr;

            var spStr = leftPadStr((slotAddr === rsp)? 'rsp\u2192':'', 4, '\xa0');
            row.spText.data = spStr;

            var slotVal = vm.ram[slotAddr];
            var absVal = slotVal & 0xFFFF;
            var decStr = leftPadStr(slotVal, 6, '\xa0');
            row.decText.data = decStr;
            var hexStr = leftPadStr(absVal.toString(16).toUpperCase(), 4, '0');
            row.hexText.data = hexStr;
            var binStr = leftPadStr(absVal.toString(2), 16, '0');
            row.binText.data = binStr;

            var bgColor = (slotAddr >= rsp)? 'rgb(0, 150, 0)':'rgb(0,0,0)';
            row.decElem.style.background = bgColor;
            row.hexElem.style.background = bgColor;
            row.binElem.style.background = bgColor;
        }
    }

    /**
    Test if the VM is running
    */
    function isRunning()
    {
        return vm.running;
    }

    // Return the module interface
    return {
        setClockSpeed: setClockSpeed,
        compileAndRun: compileAndRun,
        stopProgram: stopProgram,
        resumeProgram: resumeProgram,
        updateVM: updateVM,
        isRunning: isRunning
    }

})();

