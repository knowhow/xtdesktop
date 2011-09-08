/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockPurchAct;
var _purchAct;
var _purchActIsDirty = true;

/*!
  Initializes Purch Activity dock widget and places it in the main window.
*/
function initDockPurchAct()
{
  _dockPurchAct = mainwindow.findChild("_dockPurchAct");
  _purchAct = mainwindow.findChild("_purchAct");

  // Set columns on list
  _purchAct.addColumn(qsTr("Type"), -1,  Qt.AlignLeft,   true, "activity");
  _purchAct.addColumn(qsTr("#"), 40,  Qt.AlignRight,  true, "count");
  _purchAct.addColumn(qsTr("Amount"), -1,  Qt.AlignRight,  true, "amount");

  // Connect Signals and Slots
  _dtTimer.timeout.connect(refreshPurchAct);
  mainwindow.purchaseOrdersUpdated.connect(refreshPurchAct);
  mainwindow.purchaseOrderReceiptsUpdated.connect(refreshPurchAct);
  mainwindow.purchaseRequestsUpdated.connect(refreshPurchAct);
  mainwindow.vouchersUpdated.connect(refreshPurchAct);

  _purchAct.itemSelected.connect(openWindowPurchAct);
  _purchAct["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuPurchAct);

  _dockPurchAct.visibilityChanged.connect(fillListPurchAct);

  // Handle privilge control
  var act = _dockPurchAct.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewPurchaseActivitiesDock"))
  {
    _dockPurchAct.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewPurchaseActivitiesDock");
  _menuDesktop.appendAction(act);

  fillListPurchAct();
}

/*!
  Fills the list with active Purch data.
*/
function fillListPurchAct()
{
  _dockPurchAct = mainwindow.findChild("_dockPurchAct");
  _purchAct = mainwindow.findChild("_purchAct");

  if (!_dockPurchAct.visible || !_purchActIsDirty)
    return;

  var params = new Object;
  if (metrics.value("Application") != "PostBooks")
  {
    params.planned = qsTr("Planned");
    params.firmed = qsTr("Firmed");
  }
  params.request = qsTr("Requests");
  params.unreleased = qsTr("Unreleased");
  params.open = qsTr("Open");
  params.receiving = qsTr("At Receiving");
  params.received = qsTr("Received");
  params.vouchered = qsTr("Vouchered");

  _purchAct.populate(toolbox.executeDbQuery("desktop","purchAct", params));

  _purchActIsDirty = false;
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowPurchAct()
{
  var ui;
  var run = false;
  var act = _purchAct.currentItem().rawValue("activity");
  
  // Make sure we can open the window for this activity
  if (!privilegeCheckPurchAct(act))
    return;

  // Determine which window to open
  if (act == "L")
    ui = "dspPlannedOrders";
  else if (act == "Q")
    ui = "dspPurchaseReqsByPlannerCode";
  else if (act == "U" || act == "O")
    ui = "unpostedPurchaseOrders";
  else if (act == "A")
    ui = "unpostedPoReceipts";
  else if (act == "V")
    ui = "dspUninvoicedReceivings";
  else if (act == "I")
    ui = "openVouchers";

  // Open the window and perform any handling required
  toolbox.openWindow(ui);
  if (act == "L")
  {
//    toolbox.lastWindow().findChild("_purchase").forgetful = true;
//    toolbox.lastWindow().findChild("_manufacture").forgetful = true;
//    toolbox.lastWindow().findChild("_transfer").forgetful = true;
//    toolbox.lastWindow().findChild("_purchase").checked = true;
//    toolbox.lastWindow().findChild("_manufacture").checked = false;
//    toolbox.lastWindow().findChild("_transfer").checked = false;
    var params = new Object();
    params.type = "P";
    toolbox.lastWindow().set(params);
    toolbox.lastWindow().sFillList();
  }
  if (act == "U" || act == "O") // Set options for open P/O list
  {
    var showUnreleased = toolbox.lastWindow().findChild("_showUnreleased");
    var showOpen = toolbox.lastWindow().findChild("_showOpen");
    showUnreleased.forgetful = true;
    showOpen.forgetful = true;
    if (act == "U")
    {
      showUnreleased.checked = true;
      showOpen.checked = false;
    }
    else
    {
      showUnreleased.checked = false;
      showOpen.checked = true;
    }
    toolbox.lastWindow().sFillList();
  }
  else if (act == "Q" || act == "V") 
  {
    toolbox.lastWindow().findChild("_warehouse").setAll();
    toolbox.lastWindow().sFillList();
  }
}

/*!
  Adds actions to \a pMenu, typically from a right click on a Purch Activity item.
*/
function populateMenuPurchAct(pMenu, pItem)
{
  var menuItem;
  var act = pItem.rawValue("activity");
  var enable = privilegeCheckPurchAct(act);

  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowPurchAct);
}

/*!
  Returns whether user has privileges to view detail on the selected Purch Activity.
*/
function privilegeCheckPurchAct(act)
{
  if (act == "L") // Planned Orders
    return privileges.check("ViewPlannedOrders");
  else if (act == "Q") // Purchase Requests
    return privileges.check("ViewPurchaseRequests");
  else if (act == "U" || act == "O") // Purchase Orders
    return privileges.check("ViewPurchaseOrders") || 
           privileges.check("MaintainPurchaseOrders");
  else if (act == "A") // At Receiving
    return privileges.check("EnterReceipts");
  else if (act == "V") // Unvouchered Receipts
    return privileges.check("ViewUninvoicedReceipts") || 
           privileges.check("MaintainUninvoicedReceipts");
  else if (act == "I") // Unposted Vouchers
    return privileges.check("ViewVouchers") || 
           privileges.check("MaintainVouchers");

  return false;
}

/*!
  Refreshes data if the window is visible, or the next time it becomes visible
*/
function refreshPurchAct()
{
  _purchActIsDirty = true;
  fillListPurchAct();
}
