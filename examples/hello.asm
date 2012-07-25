; our message to the world
MSG: .string "Hello World!"

; let's English it up a little, tick = '
.const  TICK, 39

; modify the first char to be tick instead of H
store MSG, 0, TICK

; standard library functions expect arguments
; on the stack

; the string to draw ( our message )
push MSG

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
