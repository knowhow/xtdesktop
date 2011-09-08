/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _groupBy = mywindow.findChild("_groupBy");
var _timeFrame = mywindow.findChild("_timeFrame");
var _type = mywindow.findChild("_type");

var _path;

// Populate timeFrame combo
_timeFrame.append(0, qsTr("Today"), "day");
_timeFrame.append(1, qsTr("This Week"), "week");
_timeFrame.append(2, qsTr("This Month"), "month");
_timeFrame.append(3, qsTr("This Year"), "year");

mydialog.accepted.connect(save);

/*!
  Parameters \a params are passed to set up selection criteria for the window
*/
function set(params)
{
  if ("path" in params)
  {
    _path = params.path;
    if (_path == "desktop/salesHist")
    {
      _type.append(0, qsTr("Bookings"), "bookings");
      _type.append(1, qsTr("Sales"), "sales");

      _groupBy.append(0, qsTr("Customer"), "cust");
      _groupBy.append(1, qsTr("Product Category"), "prodcat");
      _groupBy.append(2, qsTr("Sales Rep"), "salesrep");

      mywindow.windowTitle = qsTr("Sales History Preferences");
    }
    else if (_path == "desktop/purchHist")
    {
      _type.append(0, qsTr("Receipts"), "receipts");
      _type.append(1, qsTr("Variances"), "variances");

      _groupBy.append(0, qsTr("Vendor"), "vend");
      _groupBy.append(1, qsTr("Item"), "item");
      _groupBy.append(2, qsTr("Purchase Agent"), "agent");

      mywindow.windowTitle = qsTr("Purchase History Preferences");
    }
    else if (_path == "desktop/mfgHist")
    {
      _type.append(0, qsTr("Receipts"), "receipts");
      _type.enabled = false;

      _groupBy.append(0, qsTr("Class Code"), "classcode");
      _groupBy.append(1, qsTr("Item"), "item");
      _groupBy.append(2, qsTr("Planner Code"), "plancode");

      mywindow.windowTitle = qsTr("Manufacture History Preferences");
    }
  }

  if ("type" in params)
    _type.code = params.type;

  if ("groupBy" in params)
    _groupBy.code = params.groupBy;

  if ("timeFrame" in params)
    _timeFrame.code = params.timeFrame;

}

/*!
  Saves selection preferences to the local machine.
*/
function save()
{
  // Save preferences to local machine
  preferences.set(_path + "/type", _type.code);
  preferences.set(_path + "/groupBy", _groupBy.code);
  preferences.set(_path + "/timeFrame", _timeFrame.code);
}

