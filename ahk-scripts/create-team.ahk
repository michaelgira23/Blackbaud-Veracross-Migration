X := ComObjActive("Excel.Application") ;creates a handle to your currently active excel sheet
fromRow := 58
toRow := 105
current := fromRow

^j::

	; Loop {
		if (current > toRow) {
			MsgBox, All done!
			return
		}

		; Sport
		; sport := X.Range("A" . current).Copy
		; MouseMove, 600, 270
		; Click
		; Sleep 10
		; Send ^a
		; Sleep 10
		; Send {BackSpace}
		; Sleep 10
		; Send ^v
		; Sleep 10
		; Send {Enter}

		; Team id
		sport := X.Range("B" . current).Copy
		MouseMove, 625, 320
		Click
		Sleep 10
		Send ^a
		Sleep 10
		Send {BackSpace}
		Sleep 10
		Send ^v
		Sleep 10
		Send {Enter}

		; Description
		sport := X.Range("C" . current).Copy
		MouseMove, 625, 358
		Click
		Sleep 10
		Send ^a
		Sleep 10
		Send {BackSpace}
		Sleep 10
		Send ^v
		Sleep 10
		Send {Enter}

		X.Range("A" . current).Copy

		current++
	; }

; 600 270
