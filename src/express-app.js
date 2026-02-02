const expressApp = require("express");
const cors = require("cors");
const path = require("path");
const morgan = require("morgan");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

const {
  user,
  village,
  farmerFAQ,
  notification,
  pratice,
  seedVarity,
  projects,
  transplanting,
  sowing,
  seedDetails,
  irrigation,
  operationDates,
  farmOperations,
  soilInformation,
  drying,
  storage,
  threshing,
  harvesting,
  cropAttributes,
  cropProtection,
  weeding,
  fertilizerApplications,
  seasonDetails,
  plotDetails,
  farmerDetails,
  dropdowns,
  categories,
  roles,
  clients,
  dataCollector,
  dashBoard,
  district,
  state,
  block,
  crop,
  cropType,
  intervention,
  machineTypes,
  machineBrands,
  fertilizer,
  seedTreatmentTypes,
  seedTreatments,
  chemicalNames,
  dcTransfer,
  amendments,
  irrigationFieldObservations,
} = require("./api");

module.exports = async (app) => {
  app.use(expressApp.json({ limit: "10mb" }));
  app.use(expressApp.urlencoded({ extended: true, limit: "10mb" }));
  app.use(expressApp.static(path.join(__dirname, "../")));

  const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  };
  app.use(cors(corsOptions));

  // swagger api docs
  const options = {
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Mrv-lite API's Document",
        version: "1.0.0",
        description:
          "API documentation provides information about the endpoints, parameters, responses, and usage examples of an API to help developers understand how to use it in their applications.",
      },
      servers: [
        {
          url: "http://localhost:5000",
        },
        {
          url: "https://localhost:5000",
        },
      ],
    },
    apis: ["./api/*.js"],
  };

  const specs = swaggerJsDoc(options);
  app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

  const morganFormat =
    ':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] - :response-time ms ":referrer" ":user-agent"';
  app.use(morgan(morganFormat));

  app.get("/", (req, res) => {
    res.send("Mrv-lite APIs");
  });

  //api
  dashBoard(app);
  categories(app);
  dropdowns(app);
  roles(app);
  clients(app);
  dataCollector(app);
  district(app);
  state(app);
  block(app);
  user(app);
  village(app);
  farmerFAQ(app);
  notification(app);
  pratice(app);
  seedVarity(app);
  projects(app);
  transplanting(app);
  sowing(app);
  seedDetails(app);
  irrigation(app);
  operationDates(app);
  farmOperations(app);
  soilInformation(app);
  drying(app);
  storage(app);
  threshing(app);
  harvesting(app);
  cropAttributes(app);
  cropProtection(app);
  weeding(app);
  fertilizerApplications(app);
  seasonDetails(app);
  plotDetails(app);
  farmerDetails(app);
  crop(app);
  cropType(app);
  intervention(app);
  machineTypes(app);
  machineBrands(app);
  fertilizer(app);
  seedTreatmentTypes(app);
  seedTreatments(app);
  chemicalNames(app);
  dcTransfer(app);
  amendments(app);
  irrigationFieldObservations(app);
};
