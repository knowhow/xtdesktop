/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockMfgOpen;
var _mfgOpen;
var _mfgOpenIsDirty = true;

/*!
  Initializes Work Order dock widget and places it in the main window.
*/
function initDockMfgOpen()
{
  _dockMfgOpen = mainwindow.findChild("_dockMfgOpen");
  _mfgOpen = mainwindow.findChild("_mfgOpen");

  // Set columns on list
  _mfgOpen.addColumn(qsTr("Order#"), XTreeWidget.orderColumn,  Qt.AlignLeft,   true, "wonumber");
  _mfgOpen.addColumn(qsTr("Item#"), XTreeWidget.itemColumn,  Qt.AlignLeft,  true, "item_number");
  _mfgOpen.addColumn(qsTr("Description"), -1,  Qt.AlignLeft,  true, "itemdescrip");
  if (metrics.boolean("MultiWhs"))
    _mfgOpen.addColumn(qsTr("Whs."), XTreeWidget.whsColumn,  Qt.AlignLeft,  true, "warehous_code");
  _mfgOpen.addColumn(qsTr("Status"), XTreeWidget.moneyColumn,  Qt.AlignLeft,  true, "wo_status");
  _mfgOpen.addColumn(qsTr("Ordered"), XTreeWidget.qtyColumn,  Qt.AlignRight,  true, "wo_qtyord"); 
  _mfgOpen.addColumn(qsTr("Received"), XTreeWidget.qtyColumn,  Qt.AlignRight,  true, "wo_qtyrcv");  
  _mfgOpen.addColumn(qsTr("UOM"), XTreeWidget.uomColumn,  Qt.AlignLeft, true, "uom_name"); 
  _mfgOpen.addColumn(qsTr("Start Date"), XTreeWidget.dateColumn,  Qt.AlignLeft, false, "wo_startdate"); 
  _mfgOpen.addColumn(qsTr("Due Date"), XTreeWidget.dateColumn,  Qt.AlignLeft, true, "wo_duedate"); 
  _mfgOpen.addColumn(qsTr("Condition"), XTreeWidget.statusColumn,  Qt.AlignLeft, false, "condition"); 
  if (privileges.check("ViewCosts"))
  {
    _mfgOpen.addColumn(qsTr("Posted Value"), XTreeWidget.moneyColumn,  Qt.AlignRight, false, "wo_postedvalue");
    _mfgOpen.addColumn(qsTr("WIP Value"), XTreeWidget.moneyColumn,  Qt.AlignRight, true, "wo_wipvalue");
  }

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshMfgOpen);
  mainwindow.workOrdersUpdated.connect(refreshMfgOpen);
  mainwindow.workOrderMaterialsUpdated.connect(refreshMfgOpen);
  mainwindow.workOrderOperationsUpdated.connect(refreshMfgOpen);

  _mfgOpen.itemSelected.connect(openWindowMfgOpen);
  _mfgOpen["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuMfgOpen);

  _dockMfgOpen.visibilityChanged.connect(fillListMfgOpen);

  // Handle privilge control
  var act = _dockMfgOpen.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewWorkOrdersDock"))
  {
    _dockMfgOpen.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewWorkOrdersDock");
  _menuDesktop.appendAction(act);

  fillListMfgOpen();
}

/*!
  Fills the list with open sales data.
*/
function fillListMfgOpen()
{
  _dockMfgOpen = mainwindow.findChild("_dockMfgOpen");
  _mfgOpen = mainwindow.findChild("_mfgOpen");

  if (!_dockMfgOpen.visible || !_mfgOpenIsDirty)
    return;

  params = new Object;
  params.open = qsTr("Open");
  params.exploded = qsTr("Exploded");
  params.released = qsTr("Released");
  params.inprocess = qsTr("In Process");

  _mfgOpen.populate(toolbox.executeDbQuery("desktop","mfgOpen",params), true);

  _mfgOpenIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowMfgOpen()
{ 
  // Make sure we can open the window for this activity
  if (!privilegeCheckMfgOpen)
    return;

  params = new Object;
  params.wo_id = _mfgOpen.id();
  if (privileges.check("MaintainWorkOrders"))
    params.mode = "edit";
  else
    params.mode = "view";

  // Open the window and perform any handling required
  var wo = toolbox.openWindow("workOrder");
  wo.set(params);

}

/*!
  Adds actions to \a pMenu, typically from a right click on a Sales Order item.
*/
function populateMenuMfgOpen(pMenu, pItem)
{
  var menuItem;
  var enable = privilegeCheckMfgOpen();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowMfgOpen);
}

/*!
  Returns whether user has privileges to view detail on the selected Sales Order.
*/
function privilegeCheckMfgOpen()
{
  return privileges.check("ViewWorkOrders") || 
         privileges.check("MaintainWorkOrders");

  return false;
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshMfgOpen()
{
  _mfgOpenIsDirty = true;
  fillListMfgOpen();
}