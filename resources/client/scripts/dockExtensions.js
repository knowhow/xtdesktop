/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockExtensions;
var _extensions;
var _extensionsIsDirty = true;

/*!
  Initializes Extensions dock widget and places it in the main window.
*/
function initDockExtensions()
{
  _dockExtensions = mainwindow.findChild("_dockExtensions");
  _extensions = mainwindow.findChild("_extensions");

  // Set columns on list
  _extensions.addColumn(qsTr("Name"), -1, Qt.AlignLeft, true, "pkgitem_name");
  _extensions.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "pkgitem_descrip");
  _extensions.addColumn(qsTr("Type"), -1, Qt.AlignLeft, false, "pkgitem_type");

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshExtensions);

  _extensions.itemSelected.connect(openWindowExtensions);
  _extensions["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuExtensions);

  _dockExtensions.visibilityChanged.connect(fillListExtensions);

  // Handle privilge control
  var act = _dockExtensions.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewExtensionsDock"))
  {
    _dockExtensions.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewExtensionsDock");
  _menuDesktop.appendAction(act);

  fillListExtensions();
}

/*!
  Fills the list with active sales data.
*/
function fillListExtensions()
{
  _dockExtensions = mainwindow.findChild("_dockExtensions");
  _extensions = mainwindow.findChild("_extensions");

  if (_dockExtensions.visible && _extensionsIsDirty)
  {
    var params = new Object;
    params.script = qsTr("Scripts");
    params.cmd = qsTr("Custom Commands");
    params.procedure = qsTr("Stored Procedures");
    params.trigger = qsTr("Triggers");
    params.image = qsTr("Images");
    params.metasql = qsTr("MetaSQL");
    params.priv = qsTr("Privileges");
    params.report = qsTr("Reports");
    params.schema = qsTr("Schema");
    params.table = qsTr("Tables");
    params.uiform = qsTr("Screens");
    params.view = qsTr("Views");
    params.folder = qsTr("Folder");
    params.client = qsTr("Client");
    params.database = qsTr("Database");

    _extensions.populate(toolbox.executeDbQuery("desktop","pkgItems", params))
 
    _extensionsIsDirty = false;
  }
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowExtensions()
{
  var ui;
  var run = false;
  var type = _extensions.currentItem().rawValue("pkgitem_type");
  var params = new Object;
  params.mode = "view";
  
  // Make sure we can open the window for this activity
  if (!privilegeCheckExtensions(type))
    return;

  // Determine which window to open
  if (type == "P")
  {
    ui = "package";
    params.pkghead_id = _extensions.id();
  }
  else if (type == "C")
  {
    ui = "scriptEditor";
    params.script_id = _extensions.id();
  }
  else if (type == "D")
  {
    ui = "customCommand";
    params.cmd_id = _extensions.id();
  }
  else if (type == "I")
  {
    ui = "image";
    params.image_id = _extensions.id();
  }
  else if (type == "M")
    ui = "metasqls";
  else if (type == "R")
    ui = "reports";
  else if (type == "U")
  {
    ui = "uiform";
    params.uiform_id = _extensions.id();
  }

  // Open the window and perform any handling required
  win = toolbox.openWindow(ui);
  if (type == "M")
  {
    win.hide();
    win.findChild("_list").setId(_extensions.id());
    win.sEdit();
    win.close();
  }
  else if (type == "R")
  {
    win.hide();
    win.findChild("_report").setId(_extensions.id());
    win.sEdit();
    win.close();
  }
  else if (type == "U")
  {
    win.hide();
    toolbox.lastWindow().set(params);
    win.sEdit();
  }
  else
  {
    toolbox.lastWindow().set(params);
    if (toolbox.lastWindow().exec())
      fillListExtensions();
  }
}

/*!
  Adds actions to \a pMenu, typically from a right click on an Extension item.
*/
function populateMenuExtensions(pMenu, pItem)
{
  var menuItem;
  var type = pItem.rawValue("pkgitem_type");
  var enable = privilegeCheckExtensions(type);

  // If not a type we have an editor for get out
  if ((type != "P") &&
      (type != "C") &&
      (type != "D") &&
      (type != "I") &&
      (type != "M") &&
      (type != "R") &&
      (type != "U"))
    return;

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowExtensions);
}

/*!
  Returns whether user has privileges to view detail on the selected extension type.
*/
function privilegeCheckExtensions(type)
{
  if (type == "P")
    return privileges.check("ViewPackages+#superuser")
  else if (type == "C")
    return privileges.check("MaintainScripts");
  else if (type == "D") 
    return privileges.check("MaintainCustomCommands");
  else if (type == "I") 
    return privileges.check("MaintainImages");
  else if (type == "M")
    return privileges.check("MaintainMetaSQL") ||
           privileges.check("ViewMetaSQL");
  else if (type == "R") 
    return privileges.check("MaintainReports");
  else if (type == "U")
    return privileges.check("MaintainScreens");

  return false;
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshExtensions()
{
  _extensionsIsDirty = true;
  fillListExtensions();
}
