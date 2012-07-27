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
Assembler namespace
*/
var asm = (function () {

    /**
    @class Source code position
    */
    function SrcPos(line, col, file)
    {
        this.line = line;
        this.col = col;
        this.file = file;
    }

    SrcPos.prototype.toString = function ()
    {
        return '(line=' + this.line + ',column=' + this.col + ')';
    }

    /**
    @class Source token
    */
    function Token(type, pos, value)
    {
        assert (
            Token.type.hasOwnProperty(type) === true,
            'invalid token type'
        );

        this.type = type;
        this.value = value;
        this.pos = pos;
    }

    Token.type = {
        'LABEL':'label',
        'COMMA':'comma',
        'COMMENT':'comment',
        'NUMBER':'number',
        'STRING':'string',
        'IDENT':'identifier',
        'REGNAME':'register name',
        'COMMAND':'command',
        'OPCODE':'opcode',
        'ERROR':'error',
        'EOF':'end of file'
    };

    Token.prototype.toString = function ()
    {
        return this.type + ':' + this.value;        
    }

    Token.prototype.getDesc = function ()
    {
        return Token.type[this.type];
    }

    /**
    String stream constructor
    */
    function StrStream(str, file)
    {
        this.str = str;
        this.file = file;
        this.index = 0;
        this.line = 1;
        this.col = 1;
    }

    StrStream.prototype.readCh = function ()
    {
        var ch = (
            (this.index < this.str.length)? 
            this.str.charAt(this.index):
            undefined
        );

        this.index++;

        if (ch === '\n')
        {
            this.line++;
            this.col = 1;
        }
        else if (ch !== '\r')
        {
            this.col++;
        }

        return ch;
    }

    StrStream.prototype.peekCh = function ()
    {
        var ch = (
            (this.index < this.str.length)? 
            this.str.charAt(this.index):
            undefined
        );

        return ch;
    }

    StrStream.prototype.getPos = function ()
    {
        return new SrcPos(this.line, this.col, this.file);
    }

    function whitespace(ch)
    {
        return (ch === '\r' || ch === '\n' || ch === ' ');
    }

    function alpha(ch)
    {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z');
    }

    function digit(ch)
    {
        return (ch >= '0' && ch <= '9');
    }

    function identStart(ch)
    {
        return alpha(ch) || ch === '_';
    }

    function identPart(ch)
    {
        return identStart(ch) || digit(ch);
    }

    /**
    Get the first token from a stream
    */
    function getToken(stream)
    {
        var ch = stream.peekCh();

        // Consume whitespace
        for (;;)
        {
            if (whitespace(ch) === false)
                break;
            stream.readCh();
            ch = stream.peekCh();
        }

        // Get the position at the start of the token
        var pos = stream.getPos();

        // Comma separator
        if (ch === ',')
        {
            stream.readCh();
            return new Token('COMMA', pos);
        }

        // Comment
        else if (ch === ';')
        {
            stream.readCh();
            var commentStr = '';

            for (;;)
            {
                ch = stream.readCh();
                if (ch === '\n' || ch === undefined)
                    break;
                commentStr += ch;
            }

            return new Token('COMMENT', pos, commentStr);
        }

        // Number
        else if (digit(ch) === true || ch === '-')
        {
            var numStr = '';

            for (var i = 0;; ++i)
            {
                ch = stream.peekCh();

                var valid = (
                    digit(ch) === true ||
                    ch === '-' ||
                    (ch === 'x' && i === 1 && numStr.charAt(0) === '0') ||
                    (ch === 'b' && i === 1 && numStr.charAt(0) === '0') ||
                    (alpha(ch) === true && numStr.charAt(1) === 'x')
                );

                if (valid === false)
                    break;

                numStr += ch;
                stream.readCh();
            }

            if (numStr.substr(0, 2) === '0b')
                var numVal = parseInt(numStr.substr(2), 2);
            else
                var numVal = parseInt(numStr);

            if (isNaN(numVal) === true)
                return new Token('ERROR', pos);

            return new Token('NUMBER', pos, numVal);
        }

        // String constant
        else if (ch === '"')
        {
            stream.readCh();
            var str = '';

            for (;;)
            {
                ch = stream.readCh();

                if (ch === '"' || ch === undefined)
                    break;

                // If this is an escape sequence
                if (ch === '\\')
                {
                    var code = stream.readCh();

                    switch (code)
                    {
                        case 'r': str += '\\r'; break;
                        case 'n': str += '\\n'; break;
                        case 'v': str += '\\v'; break;
                        case 't': str += '\\t'; break;
                        case 'b': str += '\\b'; break;

                        default:
                        return new Token('ERROR', pos);
                    }
                }
                else
                {
                    str += ch;
                }
            }

            return new Token('STRING', pos, str);
        }

        // Command
        else if (ch === '.')
        {
            stream.readCh();

            var commandStr = '';

            for (;;)
            {
                ch = stream.peekCh();
                if (identPart(ch) === false)
                    break;
                stream.readCh();
                commandStr += ch;
            }

            return new Token('COMMAND', pos, commandStr);
        }

        // Identifier or instruction or register name
        else if (identStart(ch) === true)
        {
            stream.readCh();
            var identStr = ch;

            for (;;)
            {
                ch = stream.peekCh();
                if (identPart(ch) === false)
                    break;
                stream.readCh();
                identStr += ch;
            }

            if (instrTable.hasOwnProperty(identStr) === true)
            {
                return new Token('OPCODE', pos, identStr);
            }
            else if (regIndices.hasOwnProperty(identStr) === true)
            {
                return new Token('REGNAME', pos, identStr);
            }
            else if (ch === ':')
            {
                stream.readCh();
                return new Token('LABEL', pos, identStr);
            }
            else
            {
                return new Token('IDENT', pos, identStr);
            }
        }

        // End of file
        else if (ch === undefined)
        {
            return new Token('EOF', pos);
        }

        // Invalid character
        else
        {
            stream.readCh();
            return new Token('ERROR', pos, ch);
        }
    }

    /**
    @class Parsing error
    */
    function ParseError(msg, pos)
    {
        var errObj = Object.create(ParseError.prototype);

        errObj.msg = msg;
        errObj.pos = pos;

        return errObj;
    }
    ParseError.prototype = Object.create(Error.prototype);

    ParseError.prototype.toString = function ()
    {
        var str = this.msg;

        if (this.pos !== undefined)
            str += ' ' + this.pos;

        return str;
    }

    /**
    Parse a sequence of tokens into a sequence of assembler directives
    */
    function parseTokens(tokens)
    {
        var asm = [];

        var tokenIdx;

        /**
        Parse a comma-separated argument list
        */
        function parseArgList(allowString)
        {
            var args = [];

            while (tokenIdx < tokens.length)
            {
                var token = tokens[tokenIdx];

                // If this is not the first argument
                if (args.length !== 0)
                {
                    // If this is a not comma, stop
                    if (token.type !== 'COMMA')
                        break;

                    tokenIdx += 1;
                }

                var token = tokens[tokenIdx];

                if (token.type === 'EOF')
                {
                    if (args.length === 0)
                        break;

                    throw ParseError('unexpected end of input');
                }

                var valid = (
                    token.type === 'IDENT' ||
                    token.type === 'NUMBER' ||
                    token.type === 'REGNAME' ||
                    (token.type === 'STRING' && allowString === true)
                );

                if (valid === false)
                {
                    if (args.length === 0)
                        break;

                    throw ParseError('invalid argument', token.pos);
                }

                tokenIdx += 1;

                args.push(token);
            }

            return args;
        }

        // Loop until done parsing
        for (tokenIdx = 0; tokenIdx < tokens.length;)
        {
            var token = tokens[tokenIdx];

            //console.log(tokenIdx + ' : ' + token.toString());

            // Comment
            if (token.type === 'COMMENT')
            {
                asm.push(token);
                tokenIdx += 1;
            }

            // Command
            else if (token.type === 'COMMAND')
            {
                var command = Object.create(token);
                tokenIdx += 1;
                command.args = parseArgList(true);
                asm.push(command);
            }

            // Label
            else if (token.type === 'LABEL')
            {
                asm.push(token);
                tokenIdx += 1;
            }

            // Instruction
            else if (token.type === 'OPCODE')
            {
                var instr = Object.create(token);
                tokenIdx += 1;

                var args = parseArgList(false);
                instr.args = args;

                // Get the instruction format
                var format = instrTable[token.value];

                if (args.length !== format.opnds.length)
                {
                    throw ParseError(
                        'incorrect argument count for "' + 
                        format.mnem + '" instruction', 
                        token.pos
                    );
                }

                // Check the operand types
                for (var i = 0; i < args.length; ++i)
                {
                    var arg = args[i];
                    var argFormat = format.opnds[i];

                    if (argFormat.reg === false && arg.type === 'REGNAME')
                    {
                        throw ParseError(
                            'argument ' + (i+1) + ' of "' + format.mnem + 
                            '" instruction should be a label or a number',
                            token.pos
                        );
                    }

                    if (argFormat.cst === false && (arg.type === 'NUMBER' || arg.type === 'IDENT'))
                    {
                        throw ParseError(
                            'argument ' + (i+1) + ' of "' + format.mnem + 
                            '" instruction should be a register',
                            token.pos
                        );
                    }
                }

                asm.push(instr);
            }

            // End of file
            else if (token.type === 'EOF')
            {
                tokenIdx += 1;
            }

            // Invalid token
            else
            {
                throw ParseError(
                    'unexpected ' + token.getDesc(), 
                    token.pos
                );
            }
        }

        return asm;
    }

    /**
    Parse a string into assembler directives
    */
    function parseStr(str, file)
    {
        assert (
            typeof str === 'string',
            'invalid source string'
        );

        var strStream = new StrStream(str, file);

        var tokens = [];

        for (;;)
        {
            var token = getToken(strStream);

            if (token.type === 'ERROR')
                throw ParseError('unexpected character: "' + token.value + '"',  token.pos);

            tokens.push(token);

            if (token.type === 'EOF')
                break;
        }

        return parseTokens(tokens);
    }

    /**
    Assemble assembler directives into machine code
    */
    function assemble(asm)
    {
        // Array of 16-bit machine code words
        var code = [];

        // Source positions for instruction start addresses
        var instrPos = code.instrPos = [];

        // Constant values, by name
        var consts = {};

        // Label addresses, by name
        var labelAddrs = {};

        // Label references in machine code
        var labelRefs = [];

        /**
        Write an integer constant to the code stream
        */
        function writeInt(value)
        {
            if (value < -32768 || value > 65535)
            {
                throw ParseError(
                    'value cannot be encoded in 16 bits: ' +
                    value,
                    value.pos
                );
            }

            code.push(value & 0xFFFF);
        }

        /**
        Parse an assembler command
        */
        function parseCommand(command)
        {
            var cmd = command.value;
            var args = command.args;

            var arg0 = args[0];
            var arg1 = args[1];

            function validArgs()
            {
                if (args.length !== arguments.length)
                {
                    throw ParseError(
                        'expected ' + arguments.length + ' arguments, got ' +
                        args.length,
                        command.pos
                    );
                }

                for (var i = 0; i < args.length; ++i)
                {
                    var argType = args[i].type;
                    var excType = arguments[i];

                    if (argType !== excType)
                    {
                        throw ParseError(
                            'argument ' + (i+1) + ' is ' + Token.type[argType] +
                            ' but ' + Token.type[excType] + ' was expected',
                            args[i].pos
                        );
                    }
                }
            }

            if (cmd === 'const')
            {
                validArgs('IDENT', 'NUMBER');
                consts[arg0.value] = arg1.value;
            }

            else if (cmd === 'word')
            {
                for (var i = 0; i < args.length; ++i)
                {
                    var arg = args[i];

                    if (arg.type !== 'NUMBER')
                    {
                        throw ParseError(
                            '.word takes only number arguments', 
                            arg.pos
                        );
                    }

                    writeInt(arg.value);
                }
            }

            else if (cmd === 'zeros')
            {
                validArgs('NUMBER');
                for (var i = 0; i < arg0.value; ++i)
                    code.push(0);
            }

            else if (cmd === 'string')
            {
                validArgs('STRING');

                // Write the character values
                var str = arg0.value;
                for (var i = 0; i < str.length; ++i)
                    code.push(str.charCodeAt(i));

                // Null terminator
                code.push(0);
            }

            else
            {
                throw ParseError(
                    'unknown assembler command: "' + cmd + '"',
                    command.pos
                );
            }
        }

        /**
        Encode an instruction into the code stream
        */
        function encodeInstr(instr)
        {
            // Instruction encoding:
            // opcode (6 bits) | num words (2 bits) | num opnds (2 bits) | opnd types (6 bits)

            // Get the instruction format
            var format = instrTable[instr.value];

            var opCode = format.opCode;

            var args = instr.args;

            // Count the type of register and constant arguments
            var numRegs = 0;
            var numCsts = 0;
            for (var i = 0; i < args.length; ++i)
            {
                var arg = args[i];
                if (arg.type === 'REGNAME')
                    numRegs++;
                if (arg.type === 'NUMBER' || arg.type === 'IDENT')
                    numCsts++;
            }

            // Compute the number of extra words used
            var numWords = (numRegs? 1:0) + numCsts;

            // Encode the operand types
            var opndTypes = 0;
            for (var i = 0; i < args.length; ++i)
            {
                var arg = args[i];

                var type;
                if (arg.type === 'REGNAME')
                    type = 1;
                else if (arg.type === 'NUMBER' || arg.type === 'IDENT')
                    type = 2;
                else
                    throw ParseError('unsupported argument type', arg.pos);

                opndTypes = opndTypes | (type << (2*i));
            }

            // Encode the instruction word
            var instrWord = (
                (opCode << 10)      |
                (numWords << 8)     |
                (args.length << 6)  |
                (opndTypes << 0)
            );

            // Store the line number for this instruction
            instrPos[code.length] = instr.pos;

            // Write the instruction word
            code.push(instrWord);

            // If there are register arguments
            if (numRegs > 0)
            {
                var regWord = 0;

                for (var i = 0; i < args.length; ++i)
                {
                    var arg = args[i];

                    if (arg.type === 'REGNAME')
                    {
                        var regIndex = regIndices[arg.value];
                        regWord = regWord | (regIndex << (4 * i));
                    }
                }

                // Write the register word
                code.push(regWord);
            }

            // Encode constant arguments
            for (var i = 0; i < args.length; ++i)
            {
                var arg = args[i];

                // Number argument
                if (arg.type === 'NUMBER')
                {
                    writeInt(arg.value);
                }

                // Identifier argument
                if (arg.type === 'IDENT')
                {
                    // Constant
                    if (consts.hasOwnProperty(arg.value) === true)
                    {
                        writeInt(consts[arg.value]);
                    }

                    // Label reference
                    else
                    {
                        labelRefs.push({
                            label: arg.value,
                            pos: arg.pos,
                            index: code.length
                        });

                        // Push an empty word for the label address
                        code.push(0);
                    }
                }
            }
        }

        // For each directive
        for (var i = 0; i < asm.length; ++i)
        {
            var dir = asm[i];

            // Label
            if (dir.type === 'LABEL')
            {
                if (labelAddrs.hasOwnProperty(dir.value) === true)
                {
                    throw ParseError(
                        'a label with the name "' + dir.value + '" ' +
                        'already exists',
                        dir.pos
                    );
                }

                labelAddrs[dir.value] = code.length;
            }

            // Special command
            else if (dir.type === 'COMMAND')
            {
                parseCommand(dir);
            }

            // Instruction
            else if (dir.type === 'OPCODE')
            {
                encodeInstr(dir);
            }

            // Comment
            else if (dir.type === 'COMMENT')
            {
                // Do nothing
            }

            else
            {
                throw ParseError('unknown directive', dir.pos);
            }
        }

        // For each label reference
        for (var i = 0; i < labelRefs.length; ++i)
        {
            var ref = labelRefs[i];

            var addr = labelAddrs[ref.label];

            if (addr === undefined)
            {
                throw ParseError(
                    'unresolved label: "' + ref.label + '"',
                    ref.pos
                );
            }

            // Write the label address in the code stream
            code[ref.index] = addr;
        }

        // Return the machine code stream
        return code;
    }

    // TODO: function to parse library documentation, function names

    // Externally visible interface
    return {
        Token: Token,
        ParseError: ParseError,
        getToken: getToken,
        parseStr: parseStr,
        assemble: assemble
    };
})();

