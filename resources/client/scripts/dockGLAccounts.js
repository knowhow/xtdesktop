/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _b1GLAccounts;
var _b2GLAccounts;
var _dockGLAccounts;
var _glAccounts;
var _glAccountsIsDirty = true;
var _periodId = -1;

/*!
  Initializes Monitored Accounts dock widget and places it in the main window.
*/
function initDockGLAccounts()
{
  // Set up objects
  _dockGLAccounts = mainwindow.findChild("_dockGLAccounts");
  _glAccounts = mainwindow.findChild("_glAccounts");

  _b1GLAccounts = _dockGLAccounts.findChild("_button1");
  _b2GLAccounts = _dockGLAccounts.findChild("_button2");
  _labelGLAccounts = _dockGLAccounts.findChild("_label");

  // Set icons
  var iReload = new QIcon;
  iReload.addDbImage("reload_16");
  _b1GLAccounts.icon = iReload;
  _b1GLAccounts.text = "";
  _b1GLAccounts.toolTip = qsTr("Reload");

  var iGear = new QIcon();
  iGear.addDbImage("gear_16");
  _b2GLAccounts.icon = iGear;
  _b2GLAccounts.text = "";
  _b2GLAccounts.toolTip = qsTr("Preferences...");

  // Set columns on list
  _glAccounts.addColumn(qsTr("Number"), -1, Qt.AlignLeft, true, "accnt_id");
  _glAccounts.addColumn(qsTr("Description"), -1, Qt.AlignLeft, true, "accnt_descrip");
  _glAccounts.addColumn(qsTr("Type"), -1, Qt.AlignLeft, true, "accnt_type");
  _glAccounts.addColumn(qsTr("Balance"), -1, Qt.AlignRight, true, "balance");

  // Connect Signals and Slots
  _b1GLAccounts.clicked.connect(refreshGLAccounts);
  _b2GLAccounts.clicked.connect(preferencesGLAccounts);

  _dtTimer.timeout.connect(refreshGLAccounts);
  mainwindow.bankAdjustmentsUpdated.connect(refreshGLAccounts);
  mainwindow.checksUpdated.connect(refreshGLAccounts);
  mainwindow.creditMemosUpdated.connect(refreshGLAccounts);
  mainwindow.cashReceiptsUpdated.connect(refreshGLAccounts);
  mainwindow.glSeriesUpdated.connect(refreshGLAccounts);
  mainwindow.invoicesUpdated.connect(refreshGLAccounts);
  mainwindow.paymentsUpdated.connect(refreshGLAccounts);
  mainwindow.standardPeriodsUpdated.connect(refreshGLAccounts);
  mainwindow.vouchersUpdated.connect(refreshGLAccounts);
  mainwindow.workOrderMaterialsUpdated.connect(refreshGLAccounts);
  mainwindow.workOrderOperationsUpdated.connect(refreshGLAccounts);
  mainwindow.workOrdersUpdated.connect(refreshGLAccounts);

  _glAccounts.itemSelected.connect(openWindowGLAccounts);
  _glAccounts["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuGLAccounts);

  _dockGLAccounts.visibilityChanged.connect(fillListGLAccounts);

  // Handle privilge control
  var act = _dockGLAccounts.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewGLAccountsDock"))
  {
    _dockGLAccounts.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewGLAccountsDock");
  _menuDesktop.appendAction(act);
  fillListGLAccounts();
}

/*!
  Fills the list with sales history data based on parameters determined by
  sales history preferences.

  \sa preferencesGLAccounts()
*/
function fillListGLAccounts()
{
  _dockGLAccounts = mainwindow.findChild("_dockGLAccounts");
  _glAccounts = mainwindow.findChild("_glAccounts");

  if (!_dockGLAccounts.visible || !_glAccountsIsDirty)
    return;

  _glAccounts.clear();
  var accntIdList = preferences.value("MonitoredAccounts");
  if(!accntIdList.length)
    return;

  var params = new Object;
  params.asset = qsTr("Asset");
  params.liability = qsTr("Liability");
  params.revenue = qsTr("Revenue");
  params.expense = qsTr("Expense");
  params.equity = qsTr("Equity");
  params.accnt_id_list = accntIdList;

  // Forward update if applicable
  if (!metrics.boolean("ManualForwardUpdate"))
   toolbox.executeDbQuery("desktop","glforwardupdate", params);

  var qry = toolbox.executeDbQuery("desktop","glaccountBal", params);
  if (qry.first())
  {
    _periodId = qry.value("period_id");
    _glAccounts.populate(qry);
  }

    _glAccountsIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowGLAccounts()
{
  var ui;
  var params = new Object;
  params.period_id = _periodId;
  params.accnt_id = _glAccounts.id();
  params.run = true;
  
  // Make sure we can open the window
  if (!privilegeCheckGLAccounts())
    return;

  // Open the window and perform any special handling required
  toolbox.openWindow("dspGLTransactions");
  toolbox.lastWindow().set(params);
}

/*!
  Adds actions to \a pMenu, typically from a right click on sales history.
*/
function populateMenuGLAccounts(pMenu)
{
  var menuItem;
  var enable = privilegeCheckGLAccounts();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowGLAccounts);
}

/*!
  Returns whether user has privileges to view Sales History detail.
*/
function privilegeCheckGLAccounts()
{
  return privileges.check("ViewGLTransactions");
}

/*! 
  Launches the preferences window where the user can set sales data output preferences.
*/
function preferencesGLAccounts()
{
  params = new Object;

  var newdlg = toolbox.openWindow("preferencesSelections", mainwindow,
                                  Qt.ApplicationModal, Qt.Dialog);
  toolbox.lastWindow().set(params);
  if (newdlg.exec())
    refreshGLAccounts();
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshGLAccounts()
{
  _glAccountsIsDirty = true;
  fillListGLAccounts();
}
