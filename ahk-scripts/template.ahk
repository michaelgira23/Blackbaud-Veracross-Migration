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

	; Team id
	copyCell(current, "B")
	MouseMove, 625, 320
	paste()

	; Description
	copyCell(current, "C")
	MouseMove, 625, 358
	paste()

	copyCell(current, "A")

	current++
