X := ComObjActive("Excel.Application") ; Creates a handle to your currently active excel sheet
fromRow := 2
toRow := 105
current := fromRow

increment := true

copyCell(row, column) {
	global
	X.Range(column . row).Copy
}

paste() {
	Click
	Sleep 10
	Send ^a
	Sleep 10
	Send {BackSpace}
	Sleep 10
	Send ^v
	Sleep 10
	Send {Enter}
}

^k::
	current--
	Goto, Sequence

^j::
	Sequence:
	if (current > toRow) {
		MsgBox, All done!
		return
	}

	; Opponent Name
	copyCell(current, "B")
	MouseMove, 628, 279
	paste()

	; Address
	copyCell(current, "C")
	MouseMove, 628, 358
	paste()

	; City
	copyCell(current, "F")
	MouseMove, 622, 472
	paste()

	; State
	copyCell(current, "G")
	MouseMove, 618, 513
	paste()

	; Zip Code
	copyCell(current, "H")
	MouseMove, 622, 551
	paste()

	current++
