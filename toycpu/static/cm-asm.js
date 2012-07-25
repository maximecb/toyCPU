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

(function ()
{
    // auto complete
    var cm_completions = [".const", ".string", ".word", ".zeros"];

    for(var name in instrTable)
    {
        if (instrTable.hasOwnProperty(name))
            cm_completions.push(name);
    }

    cm_completions = cm_completions.concat(regNames);

    // called each time the autocomplete key-combo is hit
    CodeMirror.toyCPUHint = function (editor)
    {
        // Find the token at the cursor
        var cur = editor.getCursor();
        var token = editor.getTokenAt(cur);

        // ignore leading whitespace
        var tindex = token.string.match(/^\s*/)[0].length
        var tstring = token.string.substring(tindex);
        var tsize  = tstring.length;

        // this will hold the possible completions
        var results = [];

        function maybeAdd(v)
        {
            if (v.substring(0, tsize) === tstring)
                results.push(v);
        }

        cm_completions.forEach(maybeAdd);

        // return the completions, adjusting token.start so leading whitespace remains
        return {
            list: results,
            from: { line: cur.line, ch: token.start + tindex },
            to: { line: cur.line, ch: token.end }
        };
    }

    CodeMirror.defineMode("cm-asm", function (config, parserConfig) 
    {
        // State at the start of the document
        function startState(basecolumn) 
        {
            return {
                /*
                tokenize: jsTokenBase,
                reAllowed: true,
                kwAllowed: true,
                cc: [],
                lexical: new JSLexical((basecolumn || 0) - indentUnit, 0, "block", false),
                localVars: parserConfig.localVars,
                context: parserConfig.localVars && {vars: parserConfig.localVars},
                indented: 0
                */
            };
        }

        // Reads one token, mutates the state returns a style string
        // See CodeMirror stream API
        function token(stream, state)
        {
            var tcStream = {
                peekCh: function () { return stream.peek(); },
                readCh: function () { return stream.next(); },
                getPos: function () {}
            }

            var token = asm.getToken(tcStream);

            if (token.type === 'EOF')
                return null;

            if (token.type === 'LABEL' && cm_completions.indexOf(token.value) === -1)
                cm_completions.push(token.value);

            return token.type;
        }

        // CodeMirror interface
        return {
            startState: startState,
            token: token
        };
    });

    CodeMirror.defineMIME("text/x-asm", "cm-asm");

})();
