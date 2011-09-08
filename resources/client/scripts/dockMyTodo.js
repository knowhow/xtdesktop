/*
 * This file is part of the xTuple ERP: PostBooks Edition, a free and
 * open source Enterprise Resource Planning software suite,
 * Copyright (c) 1999-2010 by OpenMFG LLC, d/b/a xTuple.
 * It is licensed to you under the Common Public Attribution License
 * version 1.0, the full text of which (including xTuple-specific Exhibits)
 * is available at www.xtuple.com/CPAL.  By using this software, you agree
 * to be bound by its terms.
 */

var _dockMytodo;
var _todoList;

/*!
  Initializes To Do dock widget and places it in the main window.
*/
function initDockTodo()
{
  _dockMytodo = mainwindow.findChild("_dockMytodo");
  _todoList = mainwindow.findChild("_todoList");

  // Set columns on list
  _todoList.addColumn(qsTr("Type"), XTreeWidget.userColumn, Qt.AlignCenter, true, "type");
  _todoList.addColumn(qsTr("Priority"), XTreeWidget.userColumn, Qt.AlignLeft, false, "priority");
  _todoList.addColumn(qsTr("Assigned To"), XTreeWidget.userColumn, Qt.AlignLeft, false, "usr");
  _todoList.addColumn(qsTr("Name"), -1, Qt.AlignLeft, true, "name");
  _todoList.addColumn(qsTr("Description"), -1, Qt.AlignLeft,   true, "descrip");
  _todoList.addColumn(qsTr("Status"), XTreeWidget.statusColumn, Qt.AlignLeft, false, "status");
  _todoList.addColumn(qsTr("Start Date"), XTreeWidget.dateColumn, Qt.AlignLeft, true, "start");
  _todoList.addColumn(qsTr("Due Date"), XTreeWidget.dateColumn, Qt.AlignLeft, true, "due");
  _todoList.addColumn(qsTr("Parent#"), XTreeWidget.orderColumn, Qt.AlignLeft, false, "number");
  _todoList.addColumn(qsTr("Customer#"), XTreeWidget.orderColumn, Qt.AlignLeft, false, "cust");
  _todoList.addColumn(qsTr("Account#"), XTreeWidget.orderColumn, Qt.AlignLeft, true, "crmacct_number");
  _todoList.addColumn(qsTr("Account Name"), 100, Qt.AlignLeft, false, "crmacct_name");
  _todoList.addColumn(qsTr("Owner"), XTreeWidget.userColumn, Qt.AlignLeft, false,"owner");


  // Connect signals and slots
  _dtTimer.timeout.connect(fillListSalesAct);

  _todoList.itemSelected.connect(openWindowToDo);
  _todoList["populateMenu(QMenu*,XTreeWidgetItem*,int)"]
    .connect(populateMenuToDo);

  _dockMytodo.visibilityChanged.connect(fillListToDo);

  // Handle privilge control
  var act = _dockMytodo.toggleViewAction();

  // Don't show if no privs
  if (!privileges.check("ViewTodoDock"))
  {
    _dockMytodo.hide();
    act.enabled = false;
  }

  // Allow rescan to let them show if privs granted
  act.setData("ViewTodoDock");
  _menuDesktop.appendAction(act);

  fillListToDo();
}

/*!
  Deletes the selected To Do item.
*/
function deleteToDo()
{
  var answer = QMessageBox.question(mainwindow,
                     qsTr("Delete To Do?"),
                     qsTr("This will permenantly delete the To Do item.  Are you sure?"),
                     QMessageBox.Yes | QMessageBox.No,
                     QMessageBox.Yes);
  if(answer == QMessageBox.No)
    return;

  params = new Object;
  params.todoitem_id = _todoList.id();

  toolbox.executeDbQuery("desktop","todoDelete", params);
  fillListToDo();
}

/*!
  Fills the To Do list with CRM activities owned by or assigned to the current user.
*/
function fillListToDo()
{
  _dockMytodo = mainwindow.findChild("_dockMytodo");
  _todoList = mainwindow.findChild("_todoList");

  if (!_dockMytodo.visible)
    return;

  params = new Object;
  params.todo = qsTr("To-do");
  params.incident = qsTr("Incident");
  params.task = qsTr("Task");
  params.project = qsTr("Project");
  params.todoList = true;
  params.incidents = true;
  params.projects = true;
  params.assigned_username = mainwindow.username();
  params.owner_username = mainwindow.username();
  _todoList = mainwindow.findChild("_todoList");
  _todoList.populate(toolbox.executeDbQuery("desktop", "todoList", params), true);
}

/*! 
  Opens the window associated with the selected item.
*/
function openWindowToDo()
{
  params = new Object;
  actId = _todoList.altId();
  act = toDoAct(actId);

  // Make sure we can open the window
  if (!privilegeCheckToDo(act))
    return;

  // Determine which window to open
  if (act == "D") // To Do
  {
    ui = "todoItem";
    if (privileges.check("MaintainPersonalTodoList"))
      params.mode = "edit";
    else
      params.mode = "view";
    params.todoitem_id = _todoList.id();
  }
  else if (act == "I")
  {
    ui = "incident";
    if (privileges.check("MaintainIncidents"))
      params.mode = "edit";
    else
      params.mode = "view";
    params.incdt_id = _todoList.id();
  }
  else if (act == "T")
  {
    ui = "task";
    if (privileges.check("MaintainProjects"))
      params.mode = "edit";
    else
      params.mode = "view"
    params.prjtask_id = _todoList.id();
  }
  else if (act == "P")
  {
    ui = "project";
    if (privileges.check("MaintainProjects"))
      params.mode = "edit";
    else
      params.mode = "view";
    params.prj_id = _todoList.id();
  }

  // Open the window and perform any special handling required
  var newdlg = toolbox.openWindow(ui);
  newdlg.set(params);
  newdlg.exec()
}

function toDoAct(actId)
{
  if (actId == 1)
    return "D";
  else if (actId == 2)
    return "I";
  else if (actId == 3)
    return "T";
  else if (actId == 4)
    return "P"

  return "";
}

/*!
  Adds actions to \a pMenu, typically from a right click on My Contacts.
*/
function populateMenuToDo(pMenu)
{
  var act = toDoAct(_todoList.altId());
  var menuItem;

  var enable = privilegeCheckToDo(act);
  
  menuItem = toolbox.menuAddAction(pMenu, _open, enable);
  menuItem.triggered.connect(openWindowToDo);

  if (act == "D")
  {
    menuItem = toolbox.menuAddAction(pMenu, qsTr("Delete"),
                                     privileges.check("MaintainPersonalTodoList"));
    menuItem.triggered.connect(deleteToDo);
  }
}

/*!
  Returns whether user has privileges to view My Contact detail.
*/
function privilegeCheckToDo(act)
{
  if (act == "D") // To Do list
    return privileges.check("MaintainPersonalTodoList") ||
           privileges.check("ViewPersonalTodoList");
  else if (act == "I") // Incidents
    return privileges.check("MaintainIncidents") ||
           privileges.check("ViewIncidents");
  else if (act == "P" || act == "T") // Projects and Tasks
    return privileges.check("MaintainProjects") ||
           privileges.check("ViewProjects");

  return false;
}

