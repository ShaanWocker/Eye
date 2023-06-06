const express = require('express');
const route = express.Router();

const services = require('../services/render');
const controller = require('../controller/controller');

route.get('/', services.homeRoutes);

route.get('/video_chat', services.videoChatRoutes);
route.get('/text_chat', services.textChatRoutes);

route.post('/api/users', controller.createUser);
route.put('/leaving_user_update/:id', controller.leavingUserUpdate);
route.put('/new_user_update/:id', controller.newUserUpdate);
route.post('/get_remote_users', controller.remoteUserFind);
route.put('/update_on_engagement/:id', controller.updateOnEngagement);
route.post("/get_next_user", controller.getNextUser);
route.put('/update_on_next/:id', controller.updateOnNext);


module.exports = route;
