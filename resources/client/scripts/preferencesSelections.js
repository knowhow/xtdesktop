var _gl = mywindow.findChild("_gl");

// Set columns on list
_gl.addColumn(qsTr("Account#"),    -1, Qt.AlignLeft, true, "accnt_id");
_gl.addColumn(qsTr("Description"), -1, Qt.AlignLeft, true, "accnt_descrip");
_gl.addColumn(qsTr("Type"),        -1, Qt.AlignLeft, true, "accnt_type" );

params = new Object;
params.asset = qsTr("Asset");
params.liability = qsTr("Liability");
params.revenue = qsTr("Revenue");
params.expense = qsTr("Expense");
params.equity = qsTr("Equity");

_gl.populate(toolbox.executeDbQuery("desktop", "glaccounts", params));

function set(params)
{
  // Select accounts previously selected
  var pref = preferences.value("MonitoredAccounts");
  var accntList = new Array();
  accntList = pref.split(",");
  for (i in accntList)  
  {
    _gl.setId(accntList[i], false);
  }
}

function save()
{
  var accntList = new Array();
  var selected = _gl.selectedItems();
  for (var i = 0; i < selected.length; i++)
    accntList[i] = selected[i].id();

  preferences.set("MonitoredAccounts",  accntList.join(","));
}

// Connect save on Ok
mydialog.accepted.connect(save);
