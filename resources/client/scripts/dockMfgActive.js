/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockMfgAct;
var _MfgAct;
var _mfgActIsDirty = true;

/*!
  Initializes Mfg. Activity dock widget and places it in the main window.
*/
function initDockMfgAct()
{
  _dockMfgAct = mainwindow.findChild("_dockMfgAct");
  _mfgAct = mainwindow.findChild("_mfgAct");

  // Set columns on list
  _mfgAct.addColumn(qsTr("Type"), -1,  Qt.AlignLeft,   true, "activity");
  _mfgAct.addColumn(qsTr("#"), 40,  Qt.AlignRight,  true, "count");
  _mfgAct.addColumn(qsTr("Amount"), -1,  Qt.AlignRight,  true, "amount");
  _mfgAct.addColumn(qsTr("Qty"), -1,  Qt.AlignRight,  false, "qty");

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshMfgAct);
  mainwindow.workOrdersUpdated.connect(refreshMfgAct);
  mainwindow.workOrderMaterialsUpdated.connect(refreshMfgAct);
  mainwindow.workOrderOperationsUpdated.connect(refreshMfgAct);

  _mfgAct.itemSelected.connect(openWindowMfgAct);
  _mfgAct["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuMfgAct);

  _dockMfgAct.visibilityChanged.connect(fillListMfgAct);

  // Handle privilge control
  var act = _dockMfgAct.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewManufactureActivitiesDock"))
  {
    _dockMfgAct.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewManufactureActivitiesDock");
  _menuDesktop.appendAction(act);

  fillListMfgAct();
}

/*!
  Fills the list with active Purch data.
*/
function fillListMfgAct()
{
  _dockMfgAct = mainwindow.findChild("_dockMfgAct");
  _mfgAct = mainwindow.findChild("_mfgAct");

  if (_dockMfgAct.visible && _mfgActIsDirty)
  {
    var params = new Object;
    if (metrics.value("Application") != "PostBooks")
      params.planned = qsTr("Planned");
    params.open = qsTr("Open");
    params.exploded = qsTr("Exploded");
    params.released = qsTr("Released");
    params.inprocess = qsTr("In Process");

    _mfgAct.populate(toolbox.executeDbQuery("desktop","mfgAct", params));
  }
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowMfgAct()
{
  var ui;
  var run = false;
  var act = _mfgAct.currentItem().rawValue("activity");
  
  // Make sure we can open the window for this activity
  if (!privilegeCheckMfgAct(act))
    return;

  // Determine which window to open
  if (act == "L")
    ui = "dspPlannedOrders";
  else
    ui = "dspWoSchedule";

  // Open the window and perform any handling required
  var win = toolbox.openWindow(ui);
  if (act == "L")
  {
//    win.findChild("_purchase").forgetful = true;
//    win.findChild("_manufacture").forgetful = true;
//    win.findChild("_transfer").forgetful = true;
//    win.findChild("_purchase").checked = false;
//    win.findChild("_manufacture").checked = true;
//    win.findChild("_transfer").checked = false;
//    if (act == 'O')
//      win.findChild("_open").checked = true;
//    else if (act == 'E')
//      win.findChild("_exploded").checked = true;
//    else if (act == 'R')
//      win.findChild("_released").checked = true;
//    else if (act == 'I')
//      win.findChild("_inprocess").checked = true;
//    win.findChild("_warehouse").setAll();
    var params = new Object();
    params.type = "W";
    toolbox.lastWindow().set(params);
  }
  else
  {
    var params = new Object();
    params.status = act;
    toolbox.lastWindow().set(params);
  }


  win.sFillList();
}

/*!
  Adds actions to \a pMenu, typically from a right click on a Purch Activity item.
*/
function populateMenuMfgAct(pMenu, pItem)
{
  var menuItem;
  var act = pItem.rawValue("activity");
  var enable = privilegeCheckMfgAct(act);

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowMfgAct);
}

/*!
  Returns whether user has privileges to view detail on the selected Manufacture Activity.
*/
function privilegeCheckMfgAct(act)
{
  if (act == "L") // Planned Orders
    return privileges.check("ViewPlannedOrders");
  else // Work Orders
    return (privileges.check("ViewWorkOrders") || 
            privileges.check("EditWorkOrders"));
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshMfgAct()
{
  _mfgActIsDirty = true;
  fillListMfgAct();
}