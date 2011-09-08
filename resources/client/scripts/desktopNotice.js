mydialog.accepted.connect(save)

function save()
{
  preferences.set("NoDesktopNotice",!mydialog.findChild("_remind").checked)
}