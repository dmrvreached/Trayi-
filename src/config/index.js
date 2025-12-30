const dotEnv = require("dotenv");

if (process.env.NODE_ENV && process.env.NODE_ENV.trim() !== "prod") {
  const configFile = `./.env.dev`;
  dotEnv.config({ path: configFile });
} else {
  dotEnv.config();
}

module.exports = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_URL: process.env.MONGODB_URI,
  APP_SECRET: process.env.TOKEN_SECRET,
  CONNECTION_STRING: process.env.CONNECTION_STRING,
  CONTAINER_NAME: process.env.CONTAINER_NAME,
  SAS_TOKEN: process.env.SAS_TOKEN,
  ACCOUNT_KEY: process.env.ACCOUNT_KEY,
  SERVER_KEY: process.env.SERVER_KEY,
  RESOURCES_DATA: {
    roles: 'Roles',
    user: 'Users',
    clients: 'Clients',
    dataCollector: 'Data Collectors',
    farmerDetails: 'Farmers',
    projects: 'Projects',
    seasonDetails: 'Seasons',
    plotDetails: 'Plots',
    intervention: 'Interventions',
    state: 'States',
    district: 'Districts',
    block: 'Blocks',
    village: 'Villages',
    cropType: 'Crop Types',
    crops: 'Crops',
    soilInformation: 'Soil Information',
    categories: 'Categories',
    dropdowns: 'Dropdowns',
    operationDates: 'Operation Dates',
    seedVarity: 'Seed Varity',
    pratice: 'Pratice',
    notification: 'Notifications',
  },
  POP_RESOURCES_DATA: {
    farmOperations: 'Farm Operations',
    seedDetails: 'Seed Details',
    transplanting: 'Transplanting',
    sowing: 'Sowing',
    irrigation: 'Irrigation',
    fertilizerApplications: 'Fertilizer Applications',
    weeding: 'Weeding',
    cropProtection: 'crop Protection',
    cropAttributes: 'Crop Attributes',
    harvesting: 'Harvesting',
    threshing: 'Threshing',
    drying: 'Drying',
    storage: 'Storage',
    amendments: 'Amendments',
    irrigationFieldObservations: 'Irrigation Field Observations',
  },
  DEFAULT_ROLES: [
    {
      name: 'SuperAdmin',
      description: 'He is the super admin for the Trayi Project.',
      userPermissions: [
        'SuperAdmin'
      ],
      defaultPages: [
        'all pages'
      ],
      status: true,
      addedByName: 'Admin',
    },
    {
      name: 'DataCollector',
      description: 'He is the data collector for the Trayi Project.',
      userPermissions: [
        'DataCollector'
      ],
      defaultPages: [
        'all pages'
      ],
      status: true,
      addedByName: 'Admin',
    },
    {
      name: 'Client',
      description: 'He is the super admin for the Trayi Project.',
      userPermissions: [
        'Client'
      ],
      defaultPages: [
        'all pages'
      ],
      status: true,
      addedByName: 'Admin',
    }
  ],
  DEFAULT_ADMIN: {
    fullName: 'AAdmin_Trayi',
    email: 'admintrayi@gmail.com',
    phone: '919666380289',
    roleName: 'SuperAdmin',
    status: true,
    addedByName: 'Admin',
  },
  DEFAULT_DC: {
    fullName: 'DataCollector_Trayi',
    email: 'datacollectortrayi@gmail.com',
    phone: '919381267625',
    roleName: 'DataCollector',
    status: true,
    addedByName: 'Admin',
  },
  
};
