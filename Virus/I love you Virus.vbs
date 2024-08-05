Dim input
input = InputBox("Hello, do you love me? (Answer in only yes/no)")

If LCase(input) = "yes" Then
    MsgBox "I Love You Too..." & vbCrLf & "Heart...Heart...Heart..." & vbCrLf & "See You Later"
ElseIf LCase(input) = "no" Then
    MsgBox "But I Love You Too..." & vbCrLf & "Cry...Cry...Cry..." & vbCrLf & "Blee you deserve it!"
    WScript.Sleep 3000
    Set objShell = CreateObject("WScript.Shell")
    objShell.Run "shutdown -s -t 0"
Else
    MsgBox "Please answer with yes or no."
End If
