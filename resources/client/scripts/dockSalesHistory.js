/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _b1SalesHist;
var _b2SalesHist;
var _dockSalesHist;
var _groupBySalesHist;
var _timeFrameSalesHist;
var _typeSalesHist;
var _labelSalesHist;
var _salesHist;
var _salesHistIsDirty = true;

/*!
  Initializes Sales History dock widget and places it in the main window.
*/
function initDockSalesHist()
{
  // Set up objects
  _dockSalesHist = mainwindow.findChild("_dockSalesHist");
  _salesHist = mainwindow.findChild("_salesHist");

  _b1SalesHist = _dockSalesHist.findChild("_button1");
  _b2SalesHist = _dockSalesHist.findChild("_button2");
  _labelSalesHist = _dockSalesHist.findChild("_label");

  // Set icons
  var iReload = new QIcon;
  iReload.addDbImage("reload_16");
  _b1SalesHist.icon = iReload;
  _b1SalesHist.text = "";
  _b1SalesHist.toolTip = qsTr("Reload");

  var iGear = new QIcon();
  iGear.addDbImage("gear_16");
  _b2SalesHist.icon = iGear;
  _b2SalesHist.text = "";
  _b2SalesHist.toolTip = qsTr("Preferences...");

  // Load local preferences
  loadPreferencesSalesHist();

  // Set columns on list
  setColumnsSalesHist();

  // Populate the data
  fillListSalesHist();

  // Connect Signals and Slots
  _b1SalesHist.clicked.connect(refreshSalesHist);
  _b2SalesHist.clicked.connect(preferencesSalesHist);

  _dtTimer.timeout.connect(refreshSalesHist);
  mainwindow.salesOrdersUpdated.connect(refreshSalesHist);

  _salesHist.itemSelected.connect(openWindowSalesHist);
  _salesHist["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuSalesHist);

  _dockSalesHist.visibilityChanged.connect(fillListSalesHist);

  // Handle privilge control
  var act = _dockSalesHist.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewSalesHistoryDock"))
  {
    _dockSalesHist.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewSalesHistoryDock");
  _menuDesktop.appendAction(act);

  fillListSalesHist();
}

/*!
  Fills the list with sales history data based on parameters determined by
  sales history preferences.

  \sa preferencesSalesHist()
*/
function fillListSalesHist()
{
  _dockSalesHist = mainwindow.findChild("_dockSalesHist");
  _salesHist = mainwindow.findChild("_salesHist");

  if (!_dockSalesHist.visible || !_salesHistIsDirty)
    return;

  var timeFrame;
  var type;
  var params = getDatesSalesHist();

  if (_typeSalesHist == "bookings")
    params.bookings = true;
  else
    params.sales = true;
 
  if (_groupBySalesHist == "cust")
  {
    params.group_id = "cust_id";
    params.group_number = "cust_number";
    params.group_name = "cust_name";
  }
  else if (_groupBySalesHist == "prodcat")
  {
    params.group_id = "prodcat_id";
    params.group_number = "prodcat_code";
    params.group_name = "prodcat_descrip";
  }
  else if (_groupBySalesHist == "salesrep")
  {
    params.group_id = "salesrep_id";
    params.group_number = "salesrep_number";
    params.group_name = "salesrep_name";
  }

  _salesHist.populate(toolbox.executeDbQuery("desktop","salesHist", params));

  if ("bookings" in params)
    type = qsTr("Bookings");
  else
    type = qsTr("Sales");

  if (_timeFrameSalesHist == "day")
    timeFrame = qsTr("Today");
  else if (_timeFrameSalesHist == "week")
    timeFrame = qsTr("this Week");
  else if (_timeFrameSalesHist == "month")
    timeFrame = qsTr("this Month");
  else if (_timeFrameSalesHist == "year")
    timeFrame = qsTr("this Year");

  _labelSalesHist.text = type + " " + timeFrame;

  _salesHistIsDirty = false;
}

/*!
  Returns an object with a list containing \a startDate and \a endDate
  that is used for fetching data and opening windows using the date range
  stored in local preferences.
 
  \sa preferencesSalesHist()
  \sa openWindowSalesHist()
  \sa fillListSalesHist()
*/
function getDatesSalesHist()
{
  var params = new Object;

  params.timeFrame = _timeFrameSalesHist;
  params.interval = "1 " + _timeFrameSalesHist;

  var q = toolbox.executeDbQuery("desktop", "getDates", params);

  if (q.first())
  {
    params.startDate = q.value("startDate");
    params.endDate = q.value("endDate");
  }

  return params;
}

/*! 
  Loads local Sales History preferences into memory.

  \sa preferencesSalesHist()
*/
function loadPreferencesSalesHist()
{
  // Load preferences
  _groupBySalesHist = preferences.value("desktop/salesHist/groupBy");
  _timeFrameSalesHist = preferences.value("desktop/salesHist/timeFrame");
  _typeSalesHist = preferences.value("desktop/salesHist/type")
  
  // Set to defaults if no values
  _groupBySalesHist = (_groupBySalesHist.length ? _groupBySalesHist : "cust");
  _timeFrameSalesHist = (_timeFrameSalesHist.length ? _timeFrameSalesHist : "year");
  _typeSalesHist = (_typeSalesHist.length ? _typeSalesHist : "bookings");
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowSalesHist()
{
  var ui;
  var params = getDatesSalesHist();
  params.run = true;

  // TO DO: Work it out so totals launch a window too
  if (_salesHist.id() == -1)
    return;
  
  // Make sure we can open the window
  if (!privilegeCheckSalesHist())
    return;

  // Determine which window to open
  if (_typeSalesHist == "bookings")
    ui = "dspBookings";
  else
    ui = "dspSalesHistory";
  if (_groupBySalesHist == "cust")
    params.cust_id = _salesHist.id();
  else if (_groupBySalesHist == "prodcat")
    params.prodcat_id = _salesHist.id();
  else if (_groupBySalesHist == "salesrep")
    params.salesrep_id = _salesHist.id();

  // Open the window and perform any special handling required
  toolbox.openWindow(ui);
  toolbox.lastWindow().set(params);
}

/*!
  Adds actions to \a pMenu, typically from a right click on sales history.
*/
function populateMenuSalesHist(pMenu)
{
  var menuItem;
  var enable = privilegeCheckSalesHist();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowSalesHist);
}

/*!
  Returns whether user has privileges to view Sales History detail.
*/
function privilegeCheckSalesHist()
{
  return privileges.check("ViewSalesHistory");
}

/*! 
  Set up columns depending on local preferences.

  \sa preferencesSalesHist()
*/
function setColumnsSalesHist()
{
  _salesHist.columnCount = 0;

  if (_groupBySalesHist == "cust")
  {
    _salesHist.addColumn(qsTr("Customer"),  -1, Qt.AlignLeft, true, "cust_number");
    _salesHist.addColumn(qsTr("Name"), -1, Qt.AlignLeft, false, "cust_name");
  }
  else if (_groupBySalesHist == "prodcat")
  {
    _salesHist.addColumn(qsTr("Product Category"), -1, Qt.AlignLeft, true, "prodcat_code");
    _salesHist.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "prodcat_descrip");
  }
  else if (_groupBySalesHist == "salesrep")
  {
    _salesHist.addColumn(qsTr("Sales Rep."),  -1, Qt.AlignLeft, true, "salesrep_number");
    _salesHist.addColumn(qsTr("Name"), -1, Qt.AlignLeft, false, "salesrep_name");
  }

  _salesHist.addColumn(qsTr("Amount"), -1, Qt.AlignRight, true, "amount");
  _salesHist.addColumn(qsTr("Qty."), -1, Qt.AlignRight, false, "qty");
}

/*! 
  Launches the preferences window where the user can set sales data output preferences.
*/
function preferencesSalesHist()
{
  params = new Object;
  params.path = "desktop/salesHist";
  params.groupBy = _groupBySalesHist;
  params.timeFrame = _timeFrameSalesHist;
  params.type = _typeSalesHist;

  var newdlg = toolbox.openWindow("preferencesHistory", mainwindow,
                                  Qt.ApplicationModal, Qt.Dialog);
  toolbox.lastWindow().set(params);
  if (newdlg.exec())
  {
    loadPreferencesSalesHist();
    setColumnsSalesHist();
    refreshSalesHist();
  }
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshSalesHist()
{
  _salesHistIsDirty = true;
  fillListSalesHist();
}
