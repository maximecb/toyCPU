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

var cmASM = (function ()
{

    var highlighted_line = null;

    /*
    Highlights a line in the supplied editor
     */
    function highlightLine(editor, line_no, color)
    {
        var wrapper = editor.getWrapperElement();

        if (line_no)
            editor.setCursor(--line_no);

        if (!document.querySelector)
            return null;

        if (line_no === null && highlighted_line)
        {
            highlighted_line.style.background = "transparent";
            highlighted_line = null;
            return null;
        }

        var lines = wrapper.querySelector(".CodeMirror-lines").firstChild;
        var line = lines.childNodes[4].childNodes[line_no];

        line.style.background = color || "red";
        highlighted_line = line;

        return line;
    }

    // base auto completions (built only on page load)
    // add commands
    var base_completions = [".const", ".string", ".word", ".zeros"];

    // regexen for getting autocompletes from code
    var labels = /(^|\s*)(\w*)(\:)/gm;
    var constants = /(\.const\s*)(\w*)(\s*\,)/g;
    var spaces = /^\s*/;


    // Initialize the base auto completions

    // add instructions
    for(var name in instrTable)
    {
        if (instrTable.hasOwnProperty(name))
            base_completions.push(name);
    }

    // add register names
    base_completions = base_completions.concat(regNames);

    // add std lib labels/consts

    function addMatches(string, lead, match)
    {
        base_completions.push(match);
    }

    STDLIB_SRC.replace(labels, addMatches);
    STDLIB_SRC.replace(constants, addMatches);


    // called each time the autocomplete key-combo is hit
    CodeMirror.toyCPUHint = function (editor)
    {
        // Find the token at the cursor
        var cur = editor.getCursor();
        var token = editor.getTokenAt(cur);

        // ignore leading whitespace
        var tindex = token.string.match(spaces)[0].length
        var tstring = token.string.substring(tindex);
        var tsize = tstring.length;

        // current code
        var code = editor.getValue();
        // completions for the code as is
        var code_completions = []

        // build up code_completions
        function addMatches(string, lead, match)
        {
            code_completions.push(match);
        }

        code.replace(labels, addMatches);
        code.replace(constants, addMatches);

        // this will hold the possible completions
        var results = [];

        function maybeAdd(v)
        {
            if (v.substring(0, tsize) === tstring)
                results.push(v);
        }

        code_completions.forEach(maybeAdd);
        base_completions.forEach(maybeAdd);

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

            return token.type;
        }

        // CodeMirror interface
        return {
            startState: startState,
            token: token
        };
    });

    CodeMirror.defineMIME("text/x-asm", "cm-asm");

    return {
        highlightLine: highlightLine
    };
})();