const Pool = require('pg').Pool;
require('dotenv').config();

const connectionString = "Server=test-postgresql-publicconnection.postgres.database.azure.com;Database=postgres;Port=5432;User Id=evatheodoridou;Password=abcd!123;Ssl Mode=Require;"
//const connectionString = `Database=${process.env.POSTGRES_DB};Server=${process.env.POSTGRES_SERVER};User Id=${process.env.POSTGRES_USERNAME};Password=${process.env.POSTGRES_PASSWORD};Port=5432`;
console.log(connectionString);
const pool = new Pool({ connectionString });

const selectExists = `SELECT EXISTS (
  SELECT * FROM pg_tables
  WHERE  schemaname = 'public'
  AND    tablename  = 'todoitems'
  );`

const createDB = `CREATE TABLE todoitems(
  id SERIAL PRIMARY KEY,
  description VARCHAR NOT NULL
);`
 
const initializeDatabase = (callback) => {
  console.log('Initialize database');
  pool.query(selectExists, (error, result) => {
    console.log(result);
    if (error) {
      console.log(`Failed to query todoitems table: ${error}`);
      callback();
      return;
    }

    if (!result.rows[0].exists) {
      console.log('TodoItems table was not found.  Creating...');
      pool.query(createDB, (error) => {
        if (error) {
          console.log(error);
          throw Error('Failed to initialize todoitems table');
        }

        callback();
      })

      return;
    } else{
      console.log('TodoItems table exists');
      callback();
    }
  })
}

const getItems = (request, response) => {
  pool.query('SELECT * FROM TodoItems', (error, results) => {
    if (error) {
      console.log(error);
      return;
    }
    response.status(200).json(results.rows);
  });
};

const addItem = (request, response) => {
  const { description } = request.body;

  pool.query(
    'INSERT INTO TodoItems (Description) VALUES ($1) RETURNING *',
    [description],
    (error, results) => {
      if (error) {
        console.log(error);
        response.status(500).send(error.message);
        return;
      }
      response.status(201).send(results.rows[0]);
    }
  );
};

const deleteItem = (request, response) => {
  const id = parseInt(request.params.id);

  pool.query('DELETE FROM TodoItems WHERE id = $1', [id], (error, results) => {
    if (error) {
      console.log(error);
      response.status(500).send(error.message);
      return;
    }
    response.status(200).send();
  });
};

module.exports = {
  initializeDatabase,
  getItems,
  addItem,
  deleteItem,
};
