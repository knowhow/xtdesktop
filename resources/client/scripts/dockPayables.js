/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockPayables;
var _payables;
var _payablesIsDirty = true;

/*!
  Initializes Bank Balance dock widget and places it in the main window.
*/
function initDockPayables()
{
  _dockPayables = mainwindow.findChild("_dockPayables");
  _ap = mainwindow.findChild("_ap");
  _ap.rootIsDecorated = false;

  // Set columns on list
  _ap.addColumn(qsTr("Status"), -1,  Qt.AlignLeft,   true);
  _ap.addColumn(qsTr("Balance"), -1,  Qt.AlignRight,  true);

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshPayables);
  mainwindow.checksUpdated.connect(refreshPayables);
  mainwindow.paymentsUpdated.connect(refreshPayables);
  mainwindow.vouchersUpdated.connect(refreshPayables);

  _ap.itemSelected.connect(openWindowPayables);
  _ap["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuPayables);

  _dockPayables.visibilityChanged.connect(fillListPayables);

  // Handle privilge control
  var act = _dockPayables.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewPayablesDock"))
  {
    _dockPayables.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewPayablesDock");
  _menuDesktop.appendAction(act);

  fillListPayables();
}

/*!
  Fills the list with bank account data.
*/
function fillListPayables()
{
  _dockPayables = mainwindow.findChild("_dockPayables");
  _ap = mainwindow.findChild("_ap");

  if (!_dockPayables.visible || !_payablesIsDirty)
    return;

  var q = toolbox.executeDbQuery("desktop","payables");
  q.first();
  
  _ap.clear();
  var item1 = new XTreeWidgetItem(_ap, 0, qsTr("0+ Days"), q.value("cur_val"));
  var item2 = new XTreeWidgetItem(_ap, 1, qsTr("0-30 Days"), q.value("thirty_val"));
  var item3 = new XTreeWidgetItem(_ap, 2, qsTr("31-60 Days"), q.value("sixty_val"));
  var item4 = new XTreeWidgetItem(_ap, 3, qsTr("61-90 Days"), q.value("ninety_val"));
  var item5 = new XTreeWidgetItem(_ap, 4, qsTr("90+ days"), q.value("plus_val"));
  var item6 = new XTreeWidgetItem(_ap, 5, qsTr("Total Open"), q.value("total_val"));

  _payablesIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowPayables()
{
  // Make sure we can open the window
  if (!privilegeCheckPayables())
    return;

  var params = new Object;
  params.run = true;

  var asOfDate = mainwindow.dbDate();
  var startDate = new Date();
  var endDate = new Date();

  // Open the window and perform any handling required
  toolbox.openWindow("dspAPOpenItemsByVendor");

  if (_ap.id() == 0)
  {
    startDate.setDate(asOfDate.getDate());
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
  }
  else if (_ap.id() == 1)
  {
    startDate.setDate(asOfDate.getDate() -30);
    endDate.setDate(asOfDate.getDate() -1);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ap.id() == 2)
  {
    startDate.setDate(asOfDate.getDate() -60);
    endDate.setDate(asOfDate.getDate() -31);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ap.id() == 3)
  {
    startDate.setDate(asOfDate.getDate() -90);
    endDate.setDate(asOfDate.getDate() -61);
    toolbox.lastWindow().findChild("_dates").setStartDate(startDate);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }
  else if (_ap.id() == 4)
  {
    endDate.setDate(asOfDate.getDate() -91);
    toolbox.lastWindow().findChild("_dates").setEndDate(endDate);
  }

  toolbox.lastWindow().set(params);
}

/*!
  Adds actions to \a pMenu, typically from a right click on a bank account item.
*/
function populateMenuPayables(pMenu, pItem)
{
  var menuItem;
  var enable = privilegeCheckPayables();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowPayables);
}

/*!
  Returns whether user has privileges to view detail.
*/
function privilegeCheckPayables(act)
{
  return privileges.check("ViewAPOpenItems");
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshPayables()
{
  _payablesIsDirty = true;
  fillListPayables();
}