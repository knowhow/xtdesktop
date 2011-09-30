/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

include("dockMyContacts");

// Connect this window so that the My Contacts dock list gets updated
var _contactList = mainwindow.findChild("_contactList");

// Connect this window so that the My Contacts dock list gets updated
//new method for buttonbox, added for 3.8
  var _buttonBox = mywindow.findChild("_buttonBox");
  toolbox.coreDisconnect(_buttonBox, "accepted()", mywindow, "sSave()");
  _buttonBox.accepted.connect(save);

//method prior to 3.8 core release
//var _save = mywindow.findChild("_save");
//toolbox.coreDisconnect(_save, "clicked()", mydialog, "sSave()");
//_save.clicked.connect(save);

function save()
{
  mydialog.sSave();
  fillListMyCntcts();
}

