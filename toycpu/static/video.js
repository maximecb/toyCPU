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
@class Graphical video output device
*/
function VideoDevice(canvas)
{
    /**
    Canvas to draw to
    */
    this.canvas = canvas;

    /**
    Width of the output frame buffer
    */
    this.width = canvas.width;

    /**
    Height of the output frame buffer
    */
    this.height = canvas.height;

    /**
    Output frame buffer
    */
    this.outImageData = canvas.ctx.createImageData(this.width, this.height);

    /**
    Sprite memory (hidden)
    */
    this.sprImageData = canvas.ctx.createImageData(512, 512);

    /**
    Image data for the currently active buffer
    */
    this.activeBuf = this.outImageData.data;
}

/**
Initialize the video device
*/
VideoDevice.prototype.init = function ()
{
    for (var i = 0; i < this.outImageData.data.length; ++i)
        this.outImageData.data[i] = 0;

    for (var i = 0; i < this.sprImageData.data.length; ++i)
        this.sprImageData.data[i] = 0;

    // Copy the font data into the sprite buffer
    for (var i = 0; i < FONT_DATA.length; ++i)
    {
        this.sprImageData.data[4*i + 0] = FONT_DATA[i];
        this.sprImageData.data[4*i + 1] = FONT_DATA[i];
        this.sprImageData.data[4*i + 2] = FONT_DATA[i];
        this.sprImageData.data[4*i + 3] = FONT_DATA[i];
    }

    this.activeBuf = this.outImageData.data;

    this.canvas.ctx.putImageData(this.outImageData, 0, 0);
}

/**
Show the output buffer
*/
VideoDevice.prototype.showBuffer = function (args, output)
{
    this.canvas.ctx.putImageData(this.outImageData, 0, 0);
}

/**
Set the active buffer (to draw into)
*/
VideoDevice.prototype.setBuffer = function (args, output)
{
    var id = args[2];
    this.activeBuf = (id === 0)? this.outImageData.data:this.sprImageData.data;
}

/**
Clear the active buffer
*/
VideoDevice.prototype.clearBuffer = function (args, output)
{
    for (var i = 0; i < this.activeBuf.length; ++i)
        this.activeBuf[i] = 0;
}

/**
Draw pixel message handler
*/
VideoDevice.prototype.drawPixel = function (args, output)
{
    var x    = args[2];
    var y    = args[3];
    var rgba = args[4];

    var r = ((rgba >> 12) & 0x0F) * 0x11;
    var g = ((rgba >>  8) & 0x0F) * 0x11;
    var b = ((rgba >>  4) & 0x0F) * 0x11;
    var a = ((rgba >>  0) & 0x0F) * 0x11;

    // TODO: error handling

    var startIdx = (y * this.width + x) * 4;

    this.activeBuf[startIdx + 0] = r;
    this.activeBuf[startIdx + 1] = g;
    this.activeBuf[startIdx + 2] = b;
    this.activeBuf[startIdx + 3] = a;
}

/**
Draw line message handler
*/
VideoDevice.prototype.drawLine = function (args, output)
{
    var x0   = args[2];
    var y0   = args[3];
    var x1   = args[4];
    var y1   = args[5];
    var rgba = args[6];

    var r = ((rgba >> 12) & 0x0F) * 0x11;
    var g = ((rgba >>  8) & 0x0F) * 0x11;
    var b = ((rgba >>  4) & 0x0F) * 0x11;
    var a = ((rgba >>  0) & 0x0F) * 0x11;

    // Bresenham's line algorithm

    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);

    var err = dx - dy;

    var sx = (x0 < x1)? 1:-1;
    var sy = (y0 < y1)? 1:-1;

    for (;;)
    {
        var idx = (y0 * this.width + x0) * 4;
        this.activeBuf[idx + 0] = r;
        this.activeBuf[idx + 1] = g;
        this.activeBuf[idx + 2] = b;
        this.activeBuf[idx + 3] = a;

        if (x0 === x1 && y0 === y1)
            break;

        var e2 = 2 * err;

        if (e2 > -dy)
        {
            err -= dy
            x0 += sx;
        }

        if (e2 < dx)
        {
            err += dx
            y0 += sy;
        }
    }
}

/**
Draw rectangle message handler
*/
VideoDevice.prototype.drawRect = function (args, output)
{
    var topX   = args[2];
    var topY   = args[3];
    var width  = args[4];
    var height = args[5];
    var rgba   = args[6];

    var r = ((rgba >> 12) & 0x0F) * 0x11;
    var g = ((rgba >>  8) & 0x0F) * 0x11;
    var b = ((rgba >>  4) & 0x0F) * 0x11;
    var a = ((rgba >>  0) & 0x0F) * 0x11;

    // TODO: error handling

    for (var y = topY; y < topY + height; ++y)
    {
        var startIdx = (y * this.width + topX) * 4;
        var endIdx = startIdx + 4 * width;

        for (var idx = startIdx; idx < endIdx; idx += 4)
        {
            this.activeBuf[idx + 0] = r;
            this.activeBuf[idx + 1] = g;
            this.activeBuf[idx + 2] = b;
            this.activeBuf[idx + 3] = a;
        }
    }
}

// TODO: drawTriangle

/**
Draw sprite message handler
*/
VideoDevice.prototype.drawSprite = function (args, output)
{
    var srcTopX = args[2];
    var srcTopY = args[3];
    var dstTopX = args[4];
    var dstTopY = args[5];
    var srcW    = args[6];
    var srcH    = args[7];
    var dstW    = args[8];
    var dstH    = args[9];

    var srcData = this.sprImageData.data;
    var dstData = this.activeBuf;

    // Delta movement in 64ths of pixels in the source image
    var dx = Math.floor((srcW << 6) / dstW);
    var dy = Math.floor((srcH << 6) / dstH);

    var srcYS = srcTopY << 6;
    var dstY  = dstTopY;

    for (var y = 0; y < dstH; ++y)
    {
        var srcXS = srcTopX << 6;
        var dstX  = dstTopX;

        var srcY = srcYS >> 6;

        for (var x = 0; x < dstW; ++x)
        {
            var srcX = srcXS >> 6;

            var srcIdx = (srcY * this.width + srcX) * 4;
            var dstIdx = (dstY * this.width + dstX) * 4;

            dstData[dstIdx + 0] = srcData[srcIdx + 0];
            dstData[dstIdx + 1] = srcData[srcIdx + 1];
            dstData[dstIdx + 2] = srcData[srcIdx + 2];
            dstData[dstIdx + 3] = srcData[srcIdx + 3];

            srcXS += dx;
            dstX  += 1;
        }

        srcYS += dy;
        dstY  += 1;
    }
}

/**
Message table
*/
VideoDevice.prototype.msgTable = (function ()
{
    var msgTable = [];

    // Show output buffer (no arguments)
    msgTable[0] = { numArgs: 0, handler: VideoDevice.prototype.showBuffer };

    // Set active buffer <id>
    msgTable[1] = { numArgs: 1, handler: VideoDevice.prototype.setBuffer };

    // Clear active buffer
    msgTable[2] = { numArgs: 0, handler: VideoDevice.prototype.clearBuffer };

    // Draw pixel <x> <y> <rgba16>
    msgTable[3] = { numArgs: 3, handler: VideoDevice.prototype.drawPixel };

    // Draw line <x0> <y0> <x1> <y1> <rgba16>
    msgTable[4] = { numArgs: 5, handler: VideoDevice.prototype.drawLine };

    // Draw rectangle <x> <y> <w> <h> <rgba16>
    msgTable[5] = { numArgs: 5, handler: VideoDevice.prototype.drawRect };

    // TODO: Draw triangle
    // TODO

    // Draw sprite <sx> <sy> <dx> <dy> <sw> <sh> <dw> <dh>
    msgTable[7] = { numArgs: 8, handler: VideoDevice.prototype.drawSprite };

    return msgTable;
})();

