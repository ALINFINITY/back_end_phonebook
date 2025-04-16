//Use Express
const express = require("express");
const app = express();
//Use CORS
const cors = require("cors");

//Use Morgan
const morgan = require("morgan");

//APP
const Port = process.env.PORT || 3001;
app.listen(Port, () => {
  console.log(`Server running on port: ${Port}`);
});

//Data:
let persons = [
  {
    id: 1,
    name: "Arto Hellas",
    number: "040-123456",
  },
  {
    id: 2,
    name: "Ada Lovelace",
    number: "39-44-5323523",
  },
  {
    id: 3,
    name: "Dan Abramov",
    number: "12-43-234345",
  },
  {
    id: 4,
    name: "Mary Poppendieck",
    number: "39-23-6423122",
  },
];

//Middleware:
//Json-Parser
app.use(express.json());

//CORS:
const whitelist = ["https://back-end-phonebook.onrender.com", "http://localhost:5173","http://localhost:3001"];

const originfirewall = (origin, callback) => {
  if (whitelist.includes(origin)) {
    return callback(null, true);
  }
  return callback(`Access denied!`, false);
};

app.use(
  cors({
    origin: originfirewall,
  })
);

//Static: React - App
app.use(express.static("./dist"));

//Morgan tiny
app.use(morgan("tiny"));

//Morgan Token
morgan.token("body", (req, res) =>
  req.body ? "Body: " + JSON.stringify(req.body) : "Not found body..."
);
app.use(morgan(":method :url :response-time ms :body"));

//Server EndPoints - Route Controllers:
//Get:
app.get("/api/persons", (request, response) => {
  response.json(persons);
});

app.get("/info", (request, response) => {
  const date = new Date();
  const info = `
    <h2>PhoneBook Info</h2>
    <p>Phonebook has info for ${persons.length} persons</p>
    <p>${date}</p>
    `;
  response.send(info);
});

app.get("/api/persons/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const person = persons.find((p) => p.id === id);
  if (!person) {
    response.statusMessage = "Person not found";
    return response.status(404).json({
      status: "Not found",
    });
  }
  response.json(person);
});

//Delete:
app.delete("/api/persons/:id", (request, response) => {
  const id = parseInt(request.params.id);
  const person = persons.find((p) => p.id === id);
  if (!person) return response.status(404).json({ status: "not found" });
  persons = persons.filter((p) => p.id !== id);
  //console.log(persons);
  response.statusMessage = "Deleted successfully!";
  response.status(204).end();
});

//Post
//Functions - Validations and ID Generator
const randomID = () => {
  const min = 1,
    max = 1000;

  return Math.floor(Math.random() * (max - min) + min);
};

const validations = (name, number) => {
  if (!name || !number || !name.trim() || !number.trim()) {
    return {
      statusError: true,
      message: "Missing values",
      status: "Mising values",
    };
  }
  const personbyname = persons.find((p) => p.name === name);
  if (personbyname)
    return {
      statusError: true,
      message: "Name must be unique",
      status: "Duplicate name",
    };
  const personbynumber = persons.find((p) => p.number === number);
  if (personbynumber)
    return {
      statusError: true,
      message: "Number already exist",
      status: "Duplicate number",
    };
  const regex = /^[0-9\-]+$/;
  if (!regex.test(number))
    return {
      statusError: true,
      message: "Invalid number: use only digits and the hyphen -",
      status: "Invalid number",
    };
  return { statusError: false };
};

//Post:
app.post("/api/persons", (request, response) => {
  const body = request.body;
  const val = validations(body.name, body.number);

  if (val.statusError) {
    response.statusMessage = val.status;
    return response.status(400).json({ error: val.message });
  }

  const newPerson = {
    id: randomID(),
    name: body.name,
    number: body.number,
  };
  persons = [...persons, newPerson];
  //console.log(persons);
  response.json(newPerson);
});
