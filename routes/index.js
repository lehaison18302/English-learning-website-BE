const express = require("express");
const rootRouter = express.Router();

const questRoutes = require('./questRoutes');
const pronounceRouter = require('./pronounceRoutes');
const exerciseRouter = require('./exerciseRoutes');
const learningRoutes = require('./learningRoutes');   
const reviewRoutes = require('./reviewRoutes');    
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');

rootRouter.use('/task',questRoutes);
rootRouter.use(pronounceRouter);
rootRouter.use('/api/exercises', exerciseRouter);
rootRouter.use('/learning', learningRoutes);    
rootRouter.use('/review', reviewRoutes);        
rootRouter.use('/users', userRoutes); 
rootRouter.use('/auth', authRoutes);

module.exports = rootRouter;