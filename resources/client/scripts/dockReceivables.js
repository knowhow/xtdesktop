/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockReceivables;
var _receivables;
var _receivablesIsDirty = true;

/*!
  Initializes Bank Balance dock widget and places it in the main window.
*/
function initDockReceivables()
{
  _dockReceivables = mainwindow.findChild("_dockReceivables");
  _ar = mainwindow.findChild("_ar");
  _ar.rootIsDecorated = false;

  // Set columns on list
  _ar.addColumn(qsTr("Status"), -1,  Qt.AlignLeft,   true);
  _ar.addColumn(qsTr("Balance"), -1,  Qt.AlignRight,  true);

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshReceivables);
  mainwindow.checksUpdated.connect(refreshReceivables);
  mainwindow.paymentsUpdated.connect(refreshReceivables);
  mainwindow.vouchersUpdated.connect(refreshReceivables);

  _ar.itemSelected.connect(openWindowReceivables);
  _ar["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuReceivables);

  _dockReceivables.visibilityChanged.connect(fillListReceivables);

  // Handle privilge control
  var act = _dockReceivables.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewReceivablesDock"))
  {
    _dockReceivables.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewReceivablesDock");
  _menuDesktop.appendAction(act);

  fillListReceivables();
}

/*!
  Fills the list with bank account data.
*/
function fillListReceivables()
{
  _dockReceivables = mainwindow.findChild("_dockReceivables");
  _ar = mainwindow.findChild("_ar");

  if (!_dockReceivables.visible || !_receivablesIsDirty)
    return;

  var q = toolbox.executeDbQuery("desktop","receivables");
  q.first();
  
  _ar.clear();
  var item1 = new XTreeWidgetItem(_ar, 0, qsTr("0+ Days"), q.value("cur_val"));
  var item2 = new XTreeWidgetItem(_ar, 1, qsTr("0-30 Days"), q.value("thirty_val"));
  var item3 = new XTreeWidgetItem(_ar, 2, qsTr("31-60 Days"), q.value("sixty_val"));
  var item4 = new XTreeWidgetItem(_ar, 3, qsTr("61-90 Days"), q.value("ninety_val"));
  var item5 = new XTreeWidgetItem(_ar, 4, qsTr("90+ days"), q.value("plus_val"));
  var item6 = new XTreeWidgetItem(_ar, 5, qsTr("Total Open"), q.value("total_val"));

  _receivablesIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowReceivables()
{
  // Make sure we can open the window
  if (!privilegeCheckReceivables())
    return;

  var params = new Object;
  params.run = true;
  params.byDueDate = true;

  var asOfDate = mainwindow.dbDate();
  var startDate = new Date();
  var endDate = new Date();

  // Open the window and perform any handling required
  toolbox.openWindow("dspAROpenItems");

  if (_ar.id() == 0)
  {
    startDate.setDate(asOfDate.getDate());
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
  }
  else if (_ar.id() == 1)
  {
    startDate.setDate(asOfDate.getDate() -30);
    endDate.setDate(asOfDate.getDate() -1);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ar.id() == 2)
  {
    startDate.setDate(asOfDate.getDate() -60);
    endDate.setDate(asOfDate.getDate() -31);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ar.id() == 3)
  {
    startDate.setDate(asOfDate.getDate() -90);
    endDate.setDate(asOfDate.getDate() -61);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ar.id() == 4)
  {
    endDate.setDate(asOfDate.getDate() -91);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }

  toolbox.lastWindow().set(params);
}

/*!
  Adds actions to \a pMenu, typically from a right click on a bank account item.
*/
function populateMenuReceivables(pMenu, pItem)
{
  var menuItem;
  var enable = privilegeCheckReceivables();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowReceivables);
}

/*!
  Returns whether user has privileges to view detail.
*/
function privilegeCheckReceivables(act)
{
  return privileges.check("ViewAROpenItems");
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshReceivables()
{
  _receivablesIsDirty = true;
  fillListReceivables();
}