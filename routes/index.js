const questRoutes = require('./questRoutes');
const pronounceRouter = require('./pronounceRoutes');
const exerciseRouter = require('./exerciseRoutes');
const rootRouter = require("express").Router();

rootRouter.use(questRoutes);
rootRouter.use(pronounceRouter);
rootRouter.use('/api/exercises', exerciseRouter);

module.exports = rootRouter;