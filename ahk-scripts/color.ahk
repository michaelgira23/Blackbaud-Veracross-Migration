^o::
	MouseGetPos, xpos, ypos
	PixelGetColor, color, xpos, ypos, RGB
	MsgBox, %color%
	clipboard = %color%
