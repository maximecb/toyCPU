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
List of instruction mnemonics and their operand formats.
*/
var instrFormats = [

    // Noop
    { mnem: 'nop', opnds: '', desc: 'No op instruction.'},

    // Stop the execution
    { mnem: 'stop', opnds: '', desc: 'Stops the execution.' },

    // Integer arithmetic
    { mnem: 'add', opnds: 'iio', desc: 'Signed integer addition.' },
    { mnem: 'sub', opnds: 'iio', desc: 'Signed integer subtraction.' },
    { mnem: 'mul', opnds: 'iio', desc: 'Signed integer multiplication.' },
    { mnem: 'div', opnds: 'iio', desc: 'Signed integer division.' },
    { mnem: 'mod', opnds: 'iio', desc: 'Signed integer modulo (remainder).' },

    // Bitwise operations
    { mnem: 'and'    , opnds: 'iio', desc: 'Bitwise AND operation.' },
    { mnem: 'or'     , opnds: 'iio', desc: 'Bitwise OR operation.' },
    { mnem: 'xor'    , opnds: 'iio', desc: 'Bitwise exclusive OR operation.' },
    { mnem: 'not'    , opnds: 'io' , desc: 'Bitwise NOT operation.' },
    { mnem: 'lshift' , opnds: 'iio', desc: 'Left shift.' },
    { mnem: 'rshift' , opnds: 'iio', desc: 'Right shift.' },
    { mnem: 'urshift', opnds: 'iio', desc: 'Unsigned right shift.' },

    // Branching
    { mnem: 'jump'   , opnds: 'i'  , desc: 'Unconditional jump to address.' },
    { mnem: 'jump_eq', opnds: 'iii', desc: 'Jump when inputs are equal.' },
    { mnem: 'jump_ne', opnds: 'iii', desc: 'Jump when inputs are not equal.' },
    { mnem: 'jump_lt', opnds: 'iii', desc: 'Jump on less than.' },
    { mnem: 'jump_le', opnds: 'iii', desc: 'Jump on less than or equal.' },
    { mnem: 'jump_gt', opnds: 'iii', desc: 'Jump on greater than.' },
    { mnem: 'jump_ge', opnds: 'iii', desc: 'Jump on greater than or equal.' },

    // Register and stack manipulation
    { mnem: 'mov'      , opnds: 'io', desc: 'Move (copy) a value into a register.' },
    { mnem: 'push'     , opnds: 'i' , desc: 'Push the operand on top of the stack.' },
    { mnem: 'pop'      , opnds: 'o' , desc: 'Pop the top of the stack into a register.' },
    //{ mnem: 'push_gprs', opnds: ''},
    //{ mnem: 'pop_gprs' , opnds: ''},

    // Call and return
    { mnem: 'call', opnds: 'i', desc: 'Call to function at address.' },
    { mnem: 'ret', opnds: 'i', desc: 'Return to caller, pushing arguments off the stack.' },

    // Load/store values from/to memory
    { mnem: 'load' , opnds: 'iio', desc: 'Load from memory into a register.' },
    { mnem: 'store', opnds: 'iii', desc: 'Store a value into memory.' },

    // Write/read one word to/from the system bus
    // This is to interface with virtual hardware
    { mnem: 'bus_write', opnds: 'i', desc: 'Write to the system bus. For interfacing with peripherals.' },
    { mnem: 'bus_read' , opnds: 'o', desc: 'Read from the system bus. For interfacing with peripherals.' },
];

/**
Table of instruction opcodes and operand formats. Indexed by mnemonic.
*/
var instrTable = {};
instrFormats.forEach(
    function (entry, index)
    {
        var instr = { 
            mnem: entry.mnem,
            desc: entry.desc,
            opCode: index, 
            opnds:[] 
        };

        for (var i = 0; i < entry.opnds.length; ++i)
        {
            var ch = entry.opnds.charAt(i);

            var opnd = {};

            opnd.desc = ch;
            opnd.reg = (ch === 'i' || ch === 'o' || ch === 'r');
            opnd.cst = (ch === 'i' || ch === 'c');

            instr.opnds.push(opnd);
        }

        instrTable[entry.mnem] = instr;
    }
);

/**
List of register names
*/
var regNames = [

    // General-purpose registers
    'r0',
    'r1',
    'r2',
    'r3',
    'r4',
    'r5',
    'r6',
    'r7',
    'r8',
    'r9',
    'r10',
    'r11',

    // Special registers
    'rex',
    'rfl',
    'rsp',
    'rip',      
];

/**
Table of register indices. Indexed by register name.
*/
var regIndices = {};
regNames.forEach(function (v, i) { regIndices[v] = i; });

/**
@class Run-time error
*/
function RunError(msg)
{
    var errObj = Object.create(RunError.prototype);

    errObj.msg = msg;

    return errObj;
}
RunError.prototype = Object.create(Error.prototype);

RunError.prototype.toString = function ()
{
    return this.msg;
}

/**
@class Virtual machine implementation
*/
function VM()
{
    /**
    Array of 16-bit words
    */
    this.ram = new Int16Array(VM.DEFAULT_RAM_SIZE);

    /**
    Array of 16-bit registers
    */
    this.regs = new Int16Array(regNames.length);

    /**
    Array of device objects, indexed by device id
    */
    this.devices = [];

    /**
    Bus output queue. List of 16-bit words.
    */
    this.outQueue = [];

    /**
    Bus input queue. List of 16-bit words.
    */
    this.inQueue = [];

    /**
    Total cycle count
    */
    this.cycleCount = 0;

    /**
    Flag indicating whether the VM is currently running
    */
    this.running = false;
}

/**
Default RAM space size, 64KB
*/
VM.DEFAULT_RAM_SIZE = Math.pow(2, 16);

/**
Add a device to the VM
*/
VM.prototype.addDevice = function (device, devId)
{
    assert (
        devId >= 0,
        'invalid device id'
    );

    assert (
        this.devices[devId] === undefined,
        'device id already registered'
    );

    this.devices[devId] = device;
}

/**
Initialize the VM
*/
VM.prototype.init = function (code)
{
    console.log('Initializing VM');

    assert (
        code.length < this.ram.length,
        'code too large for ram size'
    );

    for (var i = 0; i < this.ram.length; ++i)
        this.ram[i] = 0;

    for (var i = 0; i < this.regs.length; ++i)
        this.regs[i] = 0;

    // Copy the code at address 0
    for (var i = 0; i < code.length; ++i)
        this.ram[i] = code[i];

    // Set the IP to address 0
    this.regs[regIndices.rip] = 0;

    // Set the SP to address 0
    // This will flip to 0xFFFF on push
    this.regs[regIndices.rsp] = 0;

    // Clear the output and input queues
    this.outQueue = [];
    this.inQueue = [];

    // Reset the cycle count
    this.cycleCount = 0;

    // Reset the running flag
    this.running = true;

    // Initialize the peripheral devices
    for (var i = 0; i < this.devices.length; ++i)
    {
        if (this.devices[i] !== undefined)
            this.devices[i].init();
    }
}

/**
Run for some number of cycles
*/
VM.prototype.run = function (maxCycles)
{
    assert (
        this.ram.length > 0,
        'ram space has zero length'
    );

    var ripIndex = regIndices.rip;
    var rspIndex = regIndices.rsp;
    var rexIndex = regIndices.rex;

    var regs = this.regs;
    var ram = this.ram;

    // Register word for the current instruction
    var regWord = 0;

    /**
    Read a word from the code stream
    */
    function readCodeWord()
    {
        // Get the instruction pointer value and increment it
        var ip = regs[ripIndex]++;

        // Read the word at the IP
        return ram[ip];
    }

    /**
    Read an input register or constant
    */
    function readInput(index)
    {
        assert (
            index <= 3,
            'invalid input index'
        );

        var opndType = (opndTypes >>> (2*index)) & 0x03;

        // Register
        if (opndType === 1)
        {
            assert (
                hasRegs === true,
                'no register operands'
            );

            var regIndex = (regWord >>> (4*index)) & 0x0F;
            return regs[regIndex];
        }

        // Constant
        else
        {
            var cstVal = readCodeWord();
            return cstVal;
        }
    }

    /**
    Set a register value
    */
    function setReg(index, value)
    {
        assert (
            hasRegs === true,
            'no register operands'
        );

        assert (
            index <= 3,
            'invalid input index'
        );

        var regIndex = (regWord >>> (4*index)) & 0x0F;
        regs[regIndex] = value & 0xFFFF;
    }

    // Loop for each cycle
    for (var i = 0; i < maxCycles || maxCycles === undefined; ++i)
    {
        // Instruction encoding:
        // opcode (6 bits) | num words (2 bits) | num opnds (2 bits) | opnd types (6 bits)

        // Read the instruction word
        var instrWord = readCodeWord();

        // Decode the instruction word
        var opCode    = (instrWord >>> 10) & 0x3F;
        var numOpnds  = (instrWord >>>  6) & 0x03;
        var opndTypes = (instrWord >>>  0) & 0x3F;

        // Test if there are register operands
        var hasRegs = (opndTypes & 0x15) !== 0;

        // If there are register operands, read the register word
        var regWord = (hasRegs === true)? readCodeWord():0;

        // Increment the cycle count
        this.cycleCount++;

        // Switch on the opcode
        switch (opCode)
        {
            // Noop
            case instrTable.nop.opCode:
            {
                // Do nothing
            }
            break;

            // Stop VM execution
            case instrTable.stop.opCode:
            {
                console.log('stopping execution');
                this.running = false;
                return;
            }
            break;

            // Signed integer add
            case instrTable.add.opCode:
            {
                var i0 = readInput(0) & 0xFFFF;
                var i1 = readInput(1) & 0xFFFF;

                var r = i0 + i1;
                var rH = r >> 16;

                setReg(2, r);
                regs[rexIndex] = rH;
            }
            break;

            // Signed integer subtract
            case instrTable.sub.opCode:
            {
                var i0 = readInput(0) & 0xFFFF;
                var i1 = readInput(1) & 0xFFFF;

                var r = i0 - i1;
                var rH = r >> 16;

                setReg(2, r);
                regs[rexIndex] = rH;
            }
            break;

            // Signed integer multiply
            case instrTable.mul.opCode:
            {
                var i0 = readInput(0) & 0xFFFF;
                var i1 = readInput(1) & 0xFFFF;

                var r = i0 * i1;
                var rH = r >> 16;                

                setReg(2, r);
                regs[rexIndex] = rH;
            }
            break;

            // Signed integer divide
            case instrTable.div.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);

                if (i1 === 0)
                    throw RunError('division by zero');

                setReg(2, i0 / i1);
            }
            break;

            // Signed integer modulo
            case instrTable.mod.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);

                if (i1 === 0)
                    throw RunError('modulo of division by zero');

                setReg(2, i0 % i1);
            }
            break;

            // Bitwise and
            case instrTable.and.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 & i1);
            }
            break;

            // Bitwise or
            case instrTable.or.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 & i1);
            }
            break;

            // Bitwise xor
            case instrTable.xor.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 ^ i1);
            }
            break;

            // Bitwise not
            case instrTable.not.opCode:
            {
                var i0 = readInput(0);
                setReg(1, ~i0);
            }
            break;

            // Left shift
            case instrTable.lshift.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 << (i1 & 0x0F));
            }
            break;

            // Right shift
            case instrTable.rshift.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 >> (i1 & 0x0F));
            }
            break;

            // Unsigned right shift
            case instrTable.rshift.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                setReg(2, i0 >>> (i1 & 0x0F));
            }
            break;

            // Unconditional jump
            case instrTable.jump.opCode:
            {
                var i0 = readInput(0);
                regs[ripIndex] = i0;
            }
            break;

            // Jump on equal
            case instrTable.jump_eq.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 === i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Jump on not equal
            case instrTable.jump_ne.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 !== i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Jump on less-than
            case instrTable.jump_lt.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 < i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Jump on less-than-or-equal
            case instrTable.jump_le.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 <= i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Jump on greater-than
            case instrTable.jump_gt.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 > i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Jump on greater-or-equal
            case instrTable.jump_ge.opCode:
            {
                var i0 = readInput(0);
                var i1 = readInput(1);
                var i2 = readInput(2);
                if (i0 >= i1)
                    regs[ripIndex] = i2;
            }
            break;

            // Assignment
            case instrTable.mov.opCode:
            {
                var i0 = readInput(0);
                setReg(1, i0);
            }
            break;

            // Push
            case instrTable.push.opCode:
            {
                // TODO: error on stack overflow
                var i0 = readInput(0);
                var rsp = (--regs[rspIndex]) & 0xFFFF;
                ram[rsp] = i0;
            }
            break;

            // Pop
            case instrTable.pop.opCode:
            {
                var rsp = (regs[rspIndex]++) & 0xFFFF;
                setReg(0, ram[rsp]);
            }
            break;

            // Call <addr>
            case instrTable.call.opCode:
            {
                // Get the callee address
                var funAddr = readInput(0);

                // Get the address of the next instruction
                var retAddr = regs[ripIndex];

                // Push the return address
                var rsp = (--regs[rspIndex]) & 0xFFFF;
                ram[rsp] = retAddr;

                // Jump to the function address
                regs[ripIndex] = funAddr;
            }
            break;

            // Return <num_args>
            case instrTable.ret.opCode:
            {
                // Number of arguments to pop
                var numPop = readInput(0);

                // Get the return address from the stack top
                var rsp = regs[rspIndex] & 0xFFFF
                var retAddr = ram[rsp];

                // Pop the arguments and the return address
                regs[rspIndex] += numPop + 1;

                // Jump to the return address
                regs[ripIndex] = retAddr;
            }
            break;

            // Load <addr> <index> <dst_reg>
            case instrTable.load.opCode:
            {
                var addr = readInput(0);
                var idx = readInput(1);

                var loadAddr = (addr + idx) & 0xFFFF;

                setReg(2, ram[loadAddr]);
            }
            break;
            
            // Store <addr> <index> <val>
            case instrTable.store.opCode:
            {
                var addr = readInput(0);
                var idx = readInput(1);
                var val = readInput(2);

                var storeAddr = (addr + idx) & 0xFFFF;

                ram[storeAddr] = val;
            }
            break;

            // Bus write <word>
            case instrTable.bus_write.opCode:
            {
                var val = readInput(0);

                this.outQueue.push(val);

                if (this.outQueue.length >= 2)
                {
                    var devId = this.outQueue[0];
                    var msgId = this.outQueue[1];

                    var device = this.devices[devId];

                    if (device === undefined)
                    {
                        throw RunError('no device with id ' + devId);
                    }

                    var msgDesc = device.msgTable[msgId];

                    if (msgDesc === undefined)
                    {
                        throw RunError(
                            'no message with id ' + msgId + ' for device ' +
                            'with id ' + devId
                        );
                    }

                    // If we have the right number of arguments
                    if (this.outQueue.length - 2 === msgDesc.numArgs)
                    {
                        // Call the message handler
                        msgDesc.handler.call(
                            device, 
                            this.outQueue, 
                            this.inQueue
                        );

                        // Clear the output queue
                        this.outQueue.length = 0;

                        // Leave the update loop as the handler 
                        // call could have taken a long time
                        return;
                    }
                }
            }
            break;

            // Bus read <reg>
            case instrTable.bus_read.opCode:
            {
                if (this.inQueue.length === 0)
                {
                    throw RunError('bus input read failed');
                }

                var word = this.inQueue.shift();

                setReg(0, word);
            }
            break;

            default:
            throw Error('unknown opcode: ' + opCode);
        }
    }
}

