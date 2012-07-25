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

; @function Set a pixel in the active video buffer
; @arg x-coordinate
; @arg y-coordinate
; @arg rgba16 color value
VID_SET_PIXEL:
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

; @function Get a pixel in the active video buffer
; @arg x-coordinate
; @arg y-coordinate
VID_GET_PIXEL:
bus_write 0
bus_write 4
load rsp, 2, r0
bus_write r0
load rsp, 1, r0
bus_write r0
; Read the pixel value
bus_read r0
ret 2

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
bus_write 6
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
bus_write 8
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
; Clock device handling
;***************************************************************************

; @function Get the current time in milliseconds. This produces a 32-bit
; value represented as two 16-bit words.
; @arg pointer to the location at which to store the time value
CLOCK_TIME_MS:
push r0
push r1
; r0 = dst pointer
load rsp, 3, r0
; Request the time value
bus_write 2
bus_write 0
; Read the time value
bus_read r1
store r0, 0, r1
bus_read r1
store r0, 1, r1
; Exit
pop r1
pop r0
ret 1

; @function Check if a delay in milliseconds has elapsed since a
; @arg pointer to the time value (two 16-bit words)
; @arg delay in milliseconds (one 16-bit value). The delay value is unsigned.
CLOCK_MS_ELAPSED:
; Save registers
push r1
push r2
push r3
; r1 = t0 value high
; r0 = t0 value low
load rsp, 5, r0
load r0, 1, r1
load r0, 0, r0
; r2 = delay value
load rsp, 4, r2
; Add delay to t0 value
add r0, r2, r0
add r1, rex, r1
; r3 = ptr to new time value
sub rsp, 2, rsp
push rsp
call CLOCK_TIME_MS
; r3 = t1 value high
; r2 = t1 value low
load rsp, 1, r3
load rsp, 0, r2
add rsp, 2, rsp
; Flip the time value sign bits 
; to make unsigned comparisons
add r0, 0x8000, r0
add r2, 0x8000, r2
add r1, 0x8000, r1
add r3, 0x8000, r3
; Test if t1 > t0 + delay
jump_gt r3, r1, CLOCK_MS_ELAPSED_TRUE
jump_lt r3, r1, CLOCK_MS_ELAPSED_FALSE
jump_gt r2, r0, CLOCK_MS_ELAPSED_TRUE
jump CLOCK_MS_ELAPSED_FALSE
CLOCK_MS_ELAPSED_TRUE:
mov 1, r0
jump CLOCK_MS_ELAPSED_EXIT
CLOCK_MS_ELAPSED_FALSE:
mov 0, r0
; Exit
CLOCK_MS_ELAPSED_EXIT:
pop r3
pop r2
pop r1
ret 2

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
