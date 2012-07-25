STR: .string "Tadaaaa!"
TIMEVAL: .zeros 2

; Get the current time in milliseconds
push TIMEVAL
call CLOCK_TIME_MS

LOOP:

; Test if 4000ms (4s) has elapsed since
; the start time
push TIMEVAL
push 4000
call CLOCK_MS_ELAPSED

; If the delay has elapsed, goto EXIT
jump_eq r0, 1, EXIT
; Repeat the loop
jump LOOP

EXIT:

; Print the string on the display
push STR
push 150
push 170
call VID_DRAW_STR
call VID_SHOW_BUFFER

; Stop the program
stop

