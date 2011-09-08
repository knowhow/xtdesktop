/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _b1MfgHist;
var _b2MfgHist;
var _dockMfgHist;
var _groupByMfgHist;
var _timeFrameMfgHist;
var _typeMfgHist;
var _labelMfgHist;
var _mfgHist;
var _mfgHistIsDirty = true;

/*!
  Initializes Sales History dock widget and places it in the main window.
*/
function initDockMfgHist()
{
  // Set up objects
  _dockMfgHist = mainwindow.findChild("_dockMfgHist");
  _mfgHist = mainwindow.findChild("_mfgHist");

  _b1MfgHist = _dockMfgHist.findChild("_button1");
  _b2MfgHist = _dockMfgHist.findChild("_button2");
  _labelMfgHist = _dockMfgHist.findChild("_label");

  // Set icons
  var iReload = new QIcon;
  iReload.addDbImage("reload_16");
  _b1MfgHist.icon = iReload;
  _b1MfgHist.text = "";
  _b1MfgHist.toolTip = qsTr("Reload");

  var iGear = new QIcon();
  iGear.addDbImage("gear_16");
  _b2MfgHist.icon = iGear;
  _b2MfgHist.text = "";
  _b2MfgHist.toolTip = qsTr("Preferences...");

  // Load local preferences
  loadPreferencesMfgHist();

  // Set columns on list
  setColumnsMfgHist();

  // Connect Signals and Slots
  _b1MfgHist.clicked.connect(refreshMfgHist);
  _b2MfgHist.clicked.connect(preferencesMfgHist);

  _dtTimer.timeout.connect(refreshMfgHist);
  mainwindow.purchaseOrderReceiptsUpdated.connect(refreshMfgHist);
  mainwindow.vouchersUpdated.connect(refreshMfgHist);

  _mfgHist.itemSelected.connect(openWindowMfgHist);
  _mfgHist["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuMfgHist);

  _dockMfgHist.visibilityChanged.connect(fillListMfgHist);

  // Handle privilge control
  var act = _dockMfgHist.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewManufactureHistoryDock"))
  {
    _dockMfgHist.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewManufactureHistoryDock");
  _menuDesktop.appendAction(act);

  fillListMfgHist();
}

/*!
  Fills the list with sales history data based on parameters determined by
  sales history preferences.

  \sa preferencesMfgHist()
*/
function fillListMfgHist()
{
  _dockMfgHist = mainwindow.findChild("_dockMfgHist");
  _mfgHist = mainwindow.findChild("_mfgHist");

  if (!_dockMfgHist.visible || !_mfgHistIsDirty) 
    return;

  var timeFrame;
  var type;
  var params = getDatesMfgHist();
 
  if (_groupByMfgHist == "classcode")
  {
    params.group_id = "classcode_id";
    params.group_number = "classcode_code";
    params.group_name = "classcode_descrip";
  }
  else if (_groupByMfgHist == "item")
  {
    params.group_id = "item_id";
    params.group_number = "item_number";
    params.group_name = "item_descrip1";
  }
  else if (_groupByMfgHist == "plancode")
  {
    params.group_id = "plancode_id";
    params.group_number = "plancode_code";
    params.group_name = "plancode_name";
  }

  _mfgHist.populate(toolbox.executeDbQuery("desktop","mfgHist", params));

  type = qsTr("Receipts");

  if (_timeFrameMfgHist == "day")
    timeFrame = qsTr("Today");
  else if (_timeFrameMfgHist == "week")
    timeFrame = qsTr("this Week");
  else if (_timeFrameMfgHist == "month")
    timeFrame = qsTr("this Month");
  else if (_timeFrameMfgHist == "year")
    timeFrame = qsTr("this Year");

  _labelMfgHist.text = type + " " + timeFrame;

  _mfgHistIsDirty = false;
}

/*!
  Returns an object with a list containing \a startDate and \a endDate
  that is used for fetching data and opening windows using the date range
  stored in local preferences.
 
  \sa preferencesMfgHist()
  \sa openWindowMfgHist()
  \sa fillListMfgHist()
*/
function getDatesMfgHist()
{
  var params = new Object;

  params.timeFrame = _timeFrameMfgHist;
  params.interval = "1 " + _timeFrameMfgHist;

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

  \sa preferencesMfgHist()
*/
function loadPreferencesMfgHist()
{
  // Load preferences
  _groupByMfgHist = preferences.value("desktop/mfgHist/groupBy");
  _timeFrameMfgHist = preferences.value("desktop/mfgHist/timeFrame");
  _typeMfgHist = preferences.value("desktop/mfgHist/type")
  
  // Set to defaults if no values
  _groupByMfgHist = (_groupByMfgHist.length ? _groupByMfgHist : "plancode");
  _timeFrameMfgHist = (_timeFrameMfgHist.length ? _timeFrameMfgHist : "year");
  _typeMfgHist = (_typeMfgHist.length ? _typeMfgHist : "receipts");
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowMfgHist()
{
  var ui;
  var params = getDatesMfgHist();
  params.run = true;

  // TO DO: Work it out so totals launch a window too
  if (_mfgHist.id() == -1)
    return;
  
  // Make sure we can open the window
  if (!privilegeCheckMfgHist())
    return;

  // Determine which window to open
  if (_groupByMfgHist == "classcode")
  {
    ui = "dspInventoryHistory";
    params.classcode_id = _mfgHist.id();
  }
  else if (_groupByMfgHist == "item")
  {
    ui = "dspInventoryHistory";
    params.item_id = _mfgHist.id();
  }
  else if (_groupByMfgHist == "plancode")
  {
    ui = "dspInventoryHistory";
    params.plancode_id = _mfgHist.id();
  }
  params.transtype = "R";
  params.ordertype = "WO";
  params.run = true;

  // Open the window and perform any special handling required
  toolbox.openWindow(ui);
  toolbox.lastWindow().set(params);
}

/*!
  Adds actions to \a pMenu, typically from a right click on sales history.
*/
function populateMenuMfgHist(pMenu)
{
  var menuItem;
  var enable = privilegeCheckMfgHist();

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowMfgHist);
}

/*!
  Returns whether user has privileges to view Sales History detail.
*/
function privilegeCheckMfgHist()
{
  return privileges.check("ViewInventoryHistory");
}

/*! 
  Set up columns depending on local preferences.

  \sa preferencesMfgHist()
*/
function setColumnsMfgHist()
{
  _mfgHist.columnCount = 0;

  if (_groupByMfgHist == "classcode")
  {
    _mfgHist.addColumn(qsTr("Class Code"),  -1, Qt.AlignLeft, true, "classcode_code");
    _mfgHist.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "classcode_descrip");
  }
  else if (_groupByMfgHist == "item")
  {
    _mfgHist.addColumn(qsTr("Item Number"), -1, Qt.AlignLeft, true, "item_number");
    _mfgHist.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "item_descrip1");
  }
  else if (_groupByMfgHist == "plancode")
  {
    _mfgHist.addColumn(qsTr("Planner Code"),  -1, Qt.AlignLeft, true, "plancode_code");
    _mfgHist.addColumn(qsTr("Description"), -1, Qt.AlignLeft, false, "plancode_descrip");
  }

  _mfgHist.addColumn(qsTr("Amount"), -1, Qt.AlignRight, true, "amount");
  _mfgHist.addColumn(qsTr("Qty."), -1, Qt.AlignRight, false, "qty");
}

/*! 
  Launches the preferences window where the user can set sales data output preferences.
*/
function preferencesMfgHist()
{
  params = new Object;
  params.path = "desktop/mfgHist";
  params.groupBy = _groupByMfgHist;
  params.timeFrame = _timeFrameMfgHist;
  params.type = _typeMfgHist;

  var newdlg = toolbox.openWindow("preferencesHistory", mainwindow,
                                  Qt.ApplicationModal, Qt.Dialog);
  toolbox.lastWindow().set(params);
  if (newdlg.exec())
  {
    loadPreferencesMfgHist();
    setColumnsMfgHist();
    refreshMfgHist();
  }
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshMfgHist()
{
  _mfgHistIsDirty = true;
  fillListMfgHist();
}