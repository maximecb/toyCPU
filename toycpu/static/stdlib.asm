; Jump to the program start, skipping over the standard library code
jump PROGRAM_START

;***************************************************************************
; Video device handling
;***************************************************************************

; Color constant definitions
.const WHITE , 0xFFFF
.const BLACK , 0x000F
.const RED   , 0xF00F
.const GREEN , 0x0F0F
.const BLUE  , 0x00FF
.const YELLOW, 0xFF0F
.const CYAN  , 0x0FFF
.const GREY  , 0x888F

; @function Show the contents of the video buffer on screen
VID_SHOW_BUFFER:
bus_write 0
bus_write 0
ret 0

; @function Set the active video buffer (to draw into)
; @arg buffer id (0 or 1)
VID_SET_BUFFER:
push r0
add rsp, 2, r0
bus_write 0
bus_write 1
load r0, 0, r0
bus_write r0
pop r0
ret 1

; @function Clear the active video buffer
VID_CLEAR_BUFFER:
bus_write 0
bus_write 2
ret 0

; @function Draw a pixel in the active video buffer
; @arg x-coordinate
; @arg y-coordinate
; @arg rgba16 color value
VID_DRAW_PIXEL:
push r0
push r1
add rsp, 5, r0
bus_write 0
bus_write 3
load r0, 0, r1
bus_write r1
load r0,-1, r1
bus_write r1
load r0,-2, r1
bus_write r1
pop r1
pop r0
ret 3

; @function Draw a line in the active video buffer
; @arg x0
; @arg y0
; @arg x1
; @arg y1
; @arg rgba16 color value
VID_DRAW_LINE:
push r0
push r1
add rsp, 7, r0
bus_write 0
bus_write 4
load r0, 0, r1
bus_write r1
load r0,-1, r1
bus_write r1
load r0,-2, r1
bus_write r1
load r0,-3, r1
bus_write r1
load r0,-4, r1
bus_write r1
pop r1
pop r0
ret 5

; @function Draw a rectangle in the active video buffer
; @arg x-coordinate
; @arg y-coordinate
; @arg width
; @arg height
; @arg rgba16 color value
VID_DRAW_RECT:
push r0
push r1
add rsp, 7, r0
bus_write 0
bus_write 5
load r0, 0, r1
bus_write r1
load r0,-1, r1
bus_write r1
load r0,-2, r1
bus_write r1
load r0,-3, r1
bus_write r1
load r0,-4, r1
bus_write r1
pop r1
pop r0
ret 5

; @function Draw a sprite in the active video buffer
; @arg source x-coordinate
; @arg source y-coordinate
; @arg destination x-coordinate
; @arg destination y-coordinate
; @arg source width
; @arg source height
; @arg destination width
; @arg destination height
VID_DRAW_SPRITE:
push r0
push r1
add rsp, 10, r0
bus_write 0
bus_write 7
load r0, 0, r1
bus_write r1
load r0,-1, r1
bus_write r1
load r0,-2, r1
bus_write r1
load r0,-3, r1
bus_write r1
load r0,-4, r1
bus_write r1
load r0,-5, r1
bus_write r1
load r0,-6, r1
bus_write r1
load r0,-7, r1
bus_write r1
pop r1
pop r0
ret 8

; Font size constants
.const FONT_CH_W, 8
.const FONT_CH_H, 8
.const FONT_CH_W2, 16
.const FONT_CH_H2, 16

; @function Draw a string of characters
; @arg string pointer
; @arg x-coordinate
; @arg y-coordinate
VID_DRAW_STR:
; save registers
push r0          
push r1
push r2
push r3
push r4
push r5
; r0 = string pointer
; r1 = dst x
; r2 = dst y
load rsp, 9, r0
load rsp, 8, r1
load rsp, 7, r2
; character printing loop
IO_PRINT_STR_LOOP:
; r3 = current char
load r0, 0, r3
; If this is the null terminator, stop
jump_eq r3, 0, IO_PRINT_STR_DONE
; compute src x, src y
mul r3, FONT_CH_W, r4
mov 0, r5
jump_lt r4, 512, IO_PRINT_STR_FIRST
add r5, FONT_CH_H, r5
IO_PRINT_STR_FIRST:
; Draw the character
push r4
push r5
push r1
push r2
push FONT_CH_W
push FONT_CH_H
push FONT_CH_W2
push FONT_CH_H2
call VID_DRAW_SPRITE
; increment dst coords
add r1, FONT_CH_W2, r1
; move to the next character
add r0, 1, r0
jump IO_PRINT_STR_LOOP
IO_PRINT_STR_DONE:
; restore saved registers
pop r5
pop r4
pop r3
pop r2
pop r1          
pop r0          
; return, popping 3 arguments
ret 3

;***************************************************************************
; Input/Output (IO) handling
;***************************************************************************

; Key code constants
.const KEY_LEFT_ARROW,  37
.const KEY_UP_ARROW,    38
.const KEY_RIGHT_ARROW, 39
.const KEY_DOWN_ARROW,  40

; @function Check whether a given key is currently pressed
; @arg key code
IO_KEY_DOWN:
load rsp, 1, r0
bus_write 1
bus_write 0
bus_write r0
bus_read r0
ret 1

;***************************************************************************
; Character string utility functions
;***************************************************************************

; @function Compute the length of a string
; @arg string pointer
STR_LENGTH:
; save registers        
push r1
push r2
; r0 = length
mov 0, r0
; r1 = string pointer
load rsp, 3, r1
; Read loop
STR_LENGTH_LOOP:
; r2 = ptr[r0]
load r1, r0, r2
jump_eq r2, 0, STR_LENGTH_DONE
; length++
add r0, 1, r0
jump STR_LENGTH_LOOP
; Loop exit
STR_LENGTH_DONE:
pop r2
pop r1
ret 1

; @function Copy a string
; @arg source string pointer
; @arg destination pointer
STR_COPY:
push r0
push r1
push r2
; r0 = src pointer
; r1 = dst pointer
load rsp, 5, r0
load rsp, 4, r1
; Copy loop
STR_COPY_LOOP:
; r2 = *src
; *dst = r2
load r0, 0, r2
store r1, 0, r2
jump_eq r2, 0, STR_COPY_DONE
; ptr++
add r0, 1, r0
add r1, 1, r1
jump STR_COPY_LOOP
; Loop exit
STR_COPY_DONE:
pop r2
pop r1
pop r0
ret 2

; @function Append a string to another
; @arg source string pointer
; @arg destination pointer
STR_APPEND:
push r0
push r1
push r2
; r1 = src pointer
; r2 = dst pointer
load rsp, 5, r1
load rsp, 4, r2
; r0 = dst length
push r2
call STR_LENGTH
; r2 += length
add r2, r0, r2
; copy src into the dst
push r1
push r2
call STR_COPY
; Exit
pop r2
pop r1
pop r0
ret 2

;***************************************************************************
; User-written code is inserted after this point
;***************************************************************************

; Program start (main) label
PROGRAM_START:
