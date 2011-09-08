var _interfaceWorkspace = mywindow.findChild("_interfaceWorkspace");

_interfaceWorkspace.toggled.connect(desktopNotice);

function desktopNotice()
{
  if (_interfaceWorkspace.checked &&
      !preferences.boolean("NoDesktopNotice"))
    toolbox.openWindow("desktopNotice", mywindow, Qt.WindowModal, Qt.Dialog);
}