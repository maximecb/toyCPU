; Initialize the position
mov 300, r7
mov 200, r8

; Main loop
LOOP:

push KEY_LEFT_ARROW
call IO_KEY_DOWN
jump_eq r0, 0, NO_LEFT
jump_le r7, 0, NO_LEFT
add r7, -1, r7
NO_LEFT:

push KEY_RIGHT_ARROW
call IO_KEY_DOWN
jump_eq r0, 0, NO_RIGHT
jump_ge r7, 480, NO_RIGHT
add r7, 1, r7
NO_RIGHT:

push KEY_UP_ARROW
call IO_KEY_DOWN
jump_eq r0, 0, NO_UP
jump_le r8, 0, NO_UP
add r8, -1, r8
NO_UP:

push KEY_DOWN_ARROW
call IO_KEY_DOWN
jump_eq r0, 0, NO_DOWN
jump_ge r8, 352, NO_DOWN
add r8, 1, r8
NO_DOWN:

; Draw the square
call VID_CLEAR_BUFFER
push r7
push r8
push 32
push 32
push WHITE
call VID_DRAW_RECT
call VID_SHOW_BUFFER

; Repeat the loop
jump LOOP
