; our message to the world
msg: .string "Hello World!"

; let's English it up a little, tick = '
.const  tick, 39

; modify the first char to be tick instead of H
store msg, 0, tick

; we must set a buffer before drawing anything
; The standard library functions expect arguments on the stack
; use buffer 0
push 0
call VID_SET_BUFFER

; the string to draw ( our message )
push msg

; x/y screen coordinates to draw at
; draw at 10, 10
push 10
push 10

; draw the string
call VID_DRAW_STR

; render the buffer on screen
call VID_SHOW_BUFFER

; we're done!
stop
