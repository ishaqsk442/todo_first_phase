const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todo.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

// ####################################################################

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

let output = (each) => {
  return {
    id: each.id,
    todo: each.todo,
    priority: each.priority,
    status: each.status,
  };
};

// ######################################################################

app.get("/todos/", async (request, response) => {
  let getTodosQuery = "";
  const { search_q = "", priority, status } = request.query;

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
     status = '${status}'
    AND priority = '${priority}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
     priority = '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodosQuery = `SELECT * FROM todo WHERE (status = '${status}');`;
      break;
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`;
  }

  let data = await database.all(getTodosQuery);
  response.send(data.map((each) => output(each)));
  //   response.send(JSON.parse(data));
  console.log(getTodosQuery);
});

app.get("/todos/:todoId/", async (request, response) => {
  let { todoId } = request.params;

  let query = `SELECT * FROM todo WHERE id = ${todoId}`;

  let data = await database.get(query);

  response.send(data);
});

app.post("/todos/", async (request, response) => {
  let { id, todo, priority, status } = request.body;

  let query = `INSERT INTO todo (id, todo, priority, status) VALUES(${id}, '${todo}', '${priority}', '${status}');`;

  let data = await database.run(query);

  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId/", async (request, response) => {
  const { todo, priority, status } = request.body;
  console.log(todo, priority);
  const { todoId } = request.params;
  let data = null;

  switch (true) {
    // case hastodo(request.query):
    //   getTodosQuery = `
    //  UPDATE todo SET todo = '${todo}', WHERE id = ${todoId}`;
    //   let data = await database.run(getTodosQuery);
    //   response.send("Todo Updated");
    //   break;
    case hasPriorityProperty(request.body):
      getTodosQuery = `
   UPDATE todo SET priority = '${priority}' WHERE id = ${todoId}`;
      data = await database.run(getTodosQuery);
      response.send("Priority Updated");
      break;
    case hasStatusProperty(request.body):
      getTodosQuery = `UPDATE todo SET status = '${status}' WHERE id = ${todoId}`;
      data = await database.run(getTodosQuery);
      response.send("Status Updated");
      break;
    default:
      getTodosQuery = `
   UPDATE  todo SET todo = '${todo}' WHERE id = ${todoId}`;
      data = await database.run(getTodosQuery);
      response.send("Todo Updated");
  }
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deletePlayerQuery = `
  DELETE FROM
   todo
  WHERE
   id = ${todoId};`;
  await database.run(deletePlayerQuery);
  response.send("Todo Deleted");
});
module.exports = app;
