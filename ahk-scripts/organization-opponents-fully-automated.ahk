X := ComObjActive("Excel.Application") ; Creates a handle to your currently active excel sheet
fromRow := 125
toRow := 181
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

waitForStopLoading() {
	Sleep 5000
	Loop {
		PixelGetColor, color, 1421, 214, RGB
		if (color = 0xFFFFFF) {
			return
		}
	}
}

^j::
	Loop {
		if (current > toRow) {
			MsgBox, All done!
			return
		}

		;;
		; Fill out form
		;;

		; Opponent Name
		copyCell(current, "B")
		MouseMove, 628, 279
		paste()
		Sleep 1000

		; Address
		copyCell(current, "C")
		MouseMove, 628, 358
		paste()
		Sleep 1000

		; City
		copyCell(current, "F")
		MouseMove, 622, 472
		paste()
		Sleep 1000

		; State
		copyCell(current, "G")
		MouseMove, 618, 513
		paste()
		Sleep 1000

		; Zip Code
		copyCell(current, "H")
		MouseMove, 622, 551
		paste()
		Sleep 1000

		;;
		; Add organization
		;;

		MouseMove, 1487, 168
		Click

		waitForStopLoading()

		;;
		; Add role
		;;

		MouseMove, 72, 756
		Click

		Sleep 1000

		MouseMove, 409, 640
		Click

		Sleep 1000

		MouseMove, 1538, 164
		Click

		waitForStopLoading()

		;;
		; Duplicate record to add another organization
		;;

		MouseMove, 1678, 168
		Click

		Sleep 1000

		MouseMove, 1596, 261
		Click

		waitForStopLoading()

		current++
	}

Esc::ExitApp ; Exit script with Escape key
