LOOP:

; Generate two random numbers
call RAND_INT
mov r0, r10
call RAND_INT
mov r0, r11

; Cap the pixel coordinates to be within the screen
mod r10, 512, r10
mod r11, 384, r11

; Set the pixel to white
push r10
push r11
push WHITE
call VID_SET_PIXEL
call VID_SHOW_BUFFER

; Repeat
jump LOOP
