#!/usr/bin/env python

FONT_IN_FILE = 'font/vincent.tga'
JS_OUT_FILE = 'client/font.js'

TGA_HEADER_SIZE = 18
FONT_CH_WIDTH  = 8
FONT_CH_HEIGHT = 8
FONT_CH_COUNT = 128
FONT_PX_COUNT = FONT_CH_WIDTH * FONT_CH_HEIGHT * FONT_CH_COUNT

DST_WIDTH = 512

# Read the font data
fontFile = open(FONT_IN_FILE, 'rb')
fontFile.read(TGA_HEADER_SIZE)
fontBytes = fontFile.read(FONT_PX_COUNT)
fontFile.close()

dstBytes = [0] * FONT_PX_COUNT

print('dst bytes: ' + str(len(dstBytes)))

# For each font character
for charIdx in range(FONT_CH_COUNT):

    # For each character pixel
    for charY in range(FONT_CH_HEIGHT):
        for charX in range(FONT_CH_WIDTH):

            # Get the corresponding input byte
            inByteIdx = ((charIdx * FONT_CH_HEIGHT) + charY) * FONT_CH_WIDTH + charX
            pixVal = ord(fontBytes[inByteIdx])

            dstX = (charIdx * FONT_CH_WIDTH + charX) 
            dstY = charY + (dstX // DST_WIDTH) * FONT_CH_HEIGHT
            dstX = dstX % DST_WIDTH

            dstByteIdx = dstY * DST_WIDTH + dstX

            #print('dstX %i, dstY %i' % (dstX, dstY))
            #print('dstByteIdx %i' % (dstByteIdx))

            dstBytes[dstByteIdx] = pixVal;

fontTxt = ''
for byte in dstBytes:
    fontTxt += str(byte) + ','

jsSrc = 'var FONT_DATA = [' + fontTxt + '];'

# Write the JS source
jsFile = open(JS_OUT_FILE, 'w')
jsFile.write(jsSrc)
jsFile.close()

