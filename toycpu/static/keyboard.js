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
@class Keyboard input device
*/
function KeyboardDevice()
{
}

/**
Handler called when a key is pressed
*/
KeyboardDevice.onKeyDown = function (event)
{
    if (toyCPU.isRunning() === true)
        event.preventDefault();

    var keyCode = event.keyCode;
    KeyboardDevice.keyMap[keyCode] = true;
}

/**
Handler called when a key is released
*/
KeyboardDevice.onKeyUp = function (event)
{
    if (toyCPU.isRunning() === true)
        event.preventDefault();

    var keyCode = event.keyCode;
    KeyboardDevice.keyMap[keyCode] = false;
}

/**
Map of currently pressed keys, indexed by key code
*/
KeyboardDevice.keyMap = undefined;

/**
Initialize the keyboard device
*/
KeyboardDevice.prototype.init = function ()
{
    if (KeyboardDevice.keyMap === undefined)
    {
        // Initialize the key map
        KeyboardDevice.keyMap = new Array(256);
        for (var i = 0; i < KeyboardDevice.keyMap.length; ++i)
            KeyboardDevice.keyMap[i] = false;

        // Register the event handlers
        document.body.addEventListener('keydown', KeyboardDevice.onKeyDown);
        document.body.addEventListener('keyup', KeyboardDevice.onKeyUp);
    }
}

/**
Show the output buffer
*/
KeyboardDevice.prototype.keyDown = function (args, output)
{
    var keyCode = args[2];

    if (keyCode >= KeyboardDevice.keyMap.length)
    {
        throw RunError('invalid key code');
    }

    var keyState = KeyboardDevice.keyMap[keyCode]? 1:0;

    output.push(keyState);
}

/**
Message table
*/
KeyboardDevice.prototype.msgTable = (function ()
{
    var msgTable = [];

    // Show output buffer (no arguments)
    msgTable[0] = { numArgs: 1, handler: KeyboardDevice.prototype.keyDown };

    return msgTable;
})();

