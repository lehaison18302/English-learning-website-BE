const questRoutes = require('./questRoutes');
const pronounceRouter = require('./pronounceRoutes');
const rootRouter = require("express").Router();

rootRouter.use(questRoutes);
rootRouter.use( pronounceRouter);

module.exports = rootRouter;