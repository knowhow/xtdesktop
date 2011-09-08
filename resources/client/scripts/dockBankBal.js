/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockBankBal;
var _bankBal;
var _bankBalIsDirty = true;

/*!
  Initializes Bank Balance dock widget and places it in the main window.
*/
function initDockBankBal()
{
  _dockBankBal = mainwindow.findChild("_dockBankBal");
  _bankBal = mainwindow.findChild("_bankBal");

  // Set columns on list
  _bankBal.addColumn(qsTr("Name"), -1,  Qt.AlignLeft,   true, "bankaccnt_name");
  _bankBal.addColumn(qsTr("Balance"), -1,  Qt.AlignRight,  true, "balance");

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshBankBal);
  mainwindow.bankAccountsUpdated.connect(refreshBankBal);
  mainwindow.bankAdjustmentsUpdated.connect(refreshBankBal);
  mainwindow.cashReceiptsUpdated.connect(refreshBankBal);
  mainwindow.checksUpdated.connect(refreshBankBal);
  mainwindow.glSeriesUpdated.connect(refreshBankBal);

  _bankBal.itemSelected.connect(openWindowBankBal);
  _bankBal["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuBankBal);

  _dockBankBal.visibilityChanged.connect(fillListBankBal);

  // Handle privilge control
  var act = _dockBankBal.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewBankAccountsDock"))
  {
    _dockBankBal.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewBankAccountsDock");
  _menuDesktop.appendAction(act);

  fillListBankBal();
}

/*!
  Fills the list with bank account data.
*/
function fillListBankBal()
{
  _dockBankBal = mainwindow.findChild("_dockBankBal");
  _bankBal = mainwindow.findChild("_bankBal");

  if (_dockBankBal.visible && _bankBalIsDirty)
  {
    _bankBal.populate(toolbox.executeDbQuery("desktop","bankBal"));
    _bankBalIsDirty = false;
  }
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowBankBal()
{
  // Make sure we can open the window
  if (!privilegeCheckBankBal())
    return;

  // Open the window and perform any handling required
  toolbox.openWindow("reconcileBankaccount");
  var w = toolbox.lastWindow().findChild("_bankaccnt").setId(_bankBal.id());
}

/*!
  Adds actions to \a pMenu, typically from a right click on a bank account item.
*/
function populateMenuBankBal(pMenu, pItem)
{
  var menuItem;
  var enable = privilegeCheckBankBal();

  menuItem = toolbox.menuAddAction(pMenu, qsTr("Reconcile..."), enable);
  menuItem.triggered.connect(openWindowBankBal);
}

/*!
  Returns whether user has privileges to view detail.
*/
function privilegeCheckBankBal(act)
{
  return privileges.check("MaintainBankRec");
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshBankBal()
{
  _bankBalIsDirty = true;
  fillListBankBal();
}