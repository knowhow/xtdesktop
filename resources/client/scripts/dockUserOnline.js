/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockUserOnline;
var _userOnline;
var _userOnlineIsDirty = true;

/*!
  Initializes Open Sales Order dock widget and places it in the main window.
*/
function initDockUserOnline()
{
  _dockUserOnline = mainwindow.findChild("_dockUserOnline");
  _userOnline = mainwindow.findChild("_userOnline");

  // Set columns on list
  _userOnline.addColumn(qsTr("Username"), -1,  Qt.AlignLeft, true, "usr_username");
  _userOnline.addColumn(qsTr("Proper Name"), -1,  Qt.AlignLeft, true, "usr_propername");
  _userOnline.addColumn(qsTr("Email"), -1,  Qt.AlignLeft, true, "usr_email");
  _userOnline.addColumn(qsTr("# Internal"), -1,  Qt.AlignLeft, true, "cnt_internal");
  _userOnline.addColumn(qsTr("# External"), -1,  Qt.AlignLeft, true, "cnt_external");
  _userOnline.addColumn(qsTr("Client Start"), XTreeWidget.timeDateColumn, Qt.AlignLeft, true, "client_start"); 
  _userOnline.addColumn(qsTr("Query Start"), XTreeWidget.timeDateColumn, Qt.AlignLeft, true, "query_start");
  _userOnline.addColumn(qsTr("Client Address"), -1,  Qt.AlignLeft, true, "client_addr");

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshUserOnline);

  _userOnline.itemSelected.connect(openWindowUserOnline);
  _userOnline["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuUserOnline);

  _dockUserOnline.visibilityChanged.connect(fillListUserOnline);

  // Handle privilge control
  var act = _dockUserOnline.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewUsersOnlineDock"))
  {
    _dockUserOnline.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewUsersOnlineDock");
  _menuDesktop.appendAction(act);

  fillListUserOnline();
}

/*!
  Fills the list with open sales data.
*/
function fillListUserOnline()
{
  _dockUserOnline = mainwindow.findChild("_dockUserOnline");
  _userOnline = mainwindow.findChild("_userOnline");

  if (!_dockUserOnline.visible || !_userOnlineIsDirty)
    return;

  _userOnline.populate(toolbox.executeDbQuery("desktop","userOnline"));
  _userOnlineIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowUserOnline()
{ 
  // Make sure we can open the window for this activity
  if (!privilegeCheckUserOnline() ||
      !_userOnline.currentItem().rawValue("usr_username").length)
    return;

  params = new Object;
  params.username = _userOnline.currentItem().rawValue("usr_username");
  if (privilegeCheckUserOnline())
    params.mode="edit";

  // Open the window and perform any handling required
  var user = toolbox.openWindow("user");
  user.set(params);
  if (user.exec())
    refreshUserOnline();
}

/*!
  Adds actions to \a pMenu, typically from a right click on a user record.
*/
function populateMenuUserOnline(pMenu, pItem)
{
  if (!_userOnline.currentItem().rawValue("usr_username").length)
    return;

  var menuItem;
  var enable = privilegeCheckUserOnline();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowUserOnline);
}

/*!
  Returns whether user has privileges to view detail on the selected User.
*/
function privilegeCheckUserOnline()
{
  return privileges.check("MaintainUsers");

  return false;
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshUserOnline()
{
  _userOnlineIsDirty = true;
  fillListUserOnline();
}
