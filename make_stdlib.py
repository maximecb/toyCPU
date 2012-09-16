#!/usr/bin/env python

import os

ASM_IN_FILE  = 'client/stdlib.asm'
JS_OUT_FILE  = 'client/stdlib.js'

# Read the ASM file
asmFile = open(ASM_IN_FILE, 'r')
asmSrc = asmFile.read()
asmFile.close()

jsSrc = 'var STDLIB_SRC = ' + repr(asmSrc) + ';'

# Write the JS source
jsFile = open(JS_OUT_FILE, 'w')
jsFile.write(jsSrc)
jsFile.close()

