const mysql = require('mysql2/promise');

const inquirer = require('inquirer');
const cTable = require('console.table');

// Connect to database
var db;

async function mainLoop() {
    db = await mysql.createConnection(
        {
          host: 'localhost',
          // MySQL username,
          user: 'root',
          // MySQL password
          password: 'password',
          database: 'department_db'
        },
        console.log(`Connected to the department_db database.`)
      );
    while(true) {
        menuChoices = await inquirer.prompt ([
            {
                type:"list", 
                name:"menuChoice",
                message:'What would you like to do?', 
                choices:[
                    {
                        value: 1, 
                        name: 'View all departments'
                    },
                    {
                        value: 2,
                        name: 'View all roles'
                    },
                    {
                        value: 3,
                        name: 'View all employees'
                    },
                    {
                        value: 4,
                        name: 'Add a department'
                    },
                    {
                        value: 5,
                        name: 'Add a role'
                    },
                    {
                        value: 6,
                        name: 'Add an employee'
                    },
                    {
                        value: 7,
                        name: 'Update an employee role'
                    },
                    {
                        value: 0,
                        name: 'Exit'
                    }
                ]
            }
        ])
        
        switch (menuChoices["menuChoice"]) {
            case 1:
                showDepartments();
                break;
            case 2:
                showRoles();
                break;
            case 3:
                showEmployees();
                break;
            case 4:
                await addDepartment();
                break;
            case 5:
                await addRole();
                break;
            case 6:
                await addEmployee();
                break;
            case 7:
                await updateEmployee();
                break;
            default:
                db.end();
                return;
        }
    }
}

async function showDepartments() {
    [results, fields] = await db.query('select * from department;');
    console.log();
    console.table(results);
};


async function showRoles() {
    [results, fields] = await db.query('select role.title as title, role.salary as salary, department.name as department from role join department on role.department_id = department.id;');
    console.log();
    console.table(results);
};

 async function showEmployees() {
    [results, fields] = await db.query(
        'select employee.id as id, employee.first_name as first_name, employee.last_name as last_name, role.title as role, role.salary as salary, department.name as department, concat(manager.first_name, " ", manager.last_name) as manager ' 
        + 'from employee '
        + 'join role on employee.role_id = role.id '
        + 'join department on role.department_id = department.id '
        + 'left join employee as manager on employee.manager_id = manager.id;');
    console.log();
    console.table(results);
};

async function addDepartment() {
    departmentInfo = await inquirer.prompt([
        {name:"depName", message:'Department Name'}
    ]);
    [results, fields] = await db.query(`insert into department (name) values ("${departmentInfo['depName']}");`);
    }

async function addRole() {
    var departments = [];
    [results, fields] = await db.query('select * from department;')
    results.forEach(department => {
        var choice = {
            value:department["id"],
            name:department["name"],
        }
        departments.push(choice)
    });

    roleInfo = await inquirer.prompt([
        {name:"roleName", message:'Role Name'},
        {name:"roleSalary", message:'Role Salary'},
        {type:"list", name:"departmentId", message:'Choose Department', choices:departments}
    ])
    db.query(`insert into role (title, salary, department_id) values ("${roleInfo['roleName']}","${roleInfo['roleSalary']}","${roleInfo['departmentId']}")`);
}

async function addEmployee() {
    var roles = [];
    [results, fields] = await db.query('select * from role;'); 
    results.forEach(role => {
        var choice1 = {
            value:role["id"],
            name:role["title"],
            salary:role["salary"],
            department:role["department_id"]
        }
        roles.push(choice1)
    });

    var managers = [];
    [results, fields] = await db.query('select * from employee')
    results.forEach(employee => {
        var choice2 = {
            value:employee["id"],
            name:`${employee["first_name"]} ${employee["last_name"]}`
        }
        managers.push(choice2)
    });
    managers.push({
        value:null,
        name:"No Manager",
    });

    employeeInfo = await inquirer.prompt([
        {name:"first", message:'First Name'},
        {name:"last", message:'Last Name'},
        {type:"list", name:"roleId", message:'Choose Role', choices:roles},
        {type:"list", name:"managerId", message:'Choose Manager', choices:managers}
    ])
    db.query(`insert into employee (first_name, last_name, role_id, manager_id) values ("${employeeInfo['first']}","${employeeInfo['last']}", ${employeeInfo['roleId']}, ${employeeInfo['managerId']})`);
}


async function getEmployeeChoices() {
    var employees = [];
    [results, fields] = await db.query('select id, first_name, last_name from employee');
    results.forEach(employee => {
        var choice3 = {
            value:employee["id"],
            name:`${employee["first_name"]} ${employee["last_name"]}`,
        }
        employees.push(choice3)
    });

    return employees;
}

async function updateEmployee() {
    var roles = [];
    [results, fields] = await db.query('select id, title from role;');
    results.forEach(role => {
        var choice4 = {
            value:role["id"],
            name:role["title"],
        }
        roles.push(choice4)
    });
    employees = await getEmployeeChoices();
    updateEmployeeInfo = await inquirer.prompt([
        {type:"list",name:"employee", message:'Select Employee To Update', choices:employees},
        {type:"list", name:"role", message:'Select Role', choices:roles}
    ]);
    db.query(`update employee set role_id = ${updateEmployeeInfo["role"]} where id = ${updateEmployeeInfo["employee"]};`);
}

function init() {
    mainLoop()

}

// Function call to initialize app
init();

