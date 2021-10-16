const express = require('express');
const router = express.Router();

const UserService = require('../services/User.service');
const { createUser, updateUser } = require('../dtos/User.dto');
const Console = require('../lib/Console');
const Response = require('../lib/Response');

const console = new Console('USER-CONTROLLER');
const response = new Response();

const validationMiddleware = (schema) =>  async (req, res, next) => {
    try {
        await schema.validate({
            body: req.body,
            params: req.params,
        });
        next();
        return;
    } catch(error) {
        console.error(error);
        response.error(res, error, 400);
    }
}

// get all users
router.get('/', async (req, res) => {
    try {
        const userService = await UserService.getInstance();
        const users = await userService.getAll();
        console.success('GET ALL USERS');
        response.success(res, users);
    } catch (error) {
        console.error(error.message)
    }
});

// get user by uuid
router.get('/:uuid', async (req, res) => {
    try {
        const userService = await UserService.getInstance();
        const { uuid } = req.params;
        const user = await userService.getOne(uuid);
        if (!user) {
            console.error('USER NOT FOUND: ' + uuid);
            response.error(res, 'USER NOT FOUND', 404);
            return;
        }
        console.success('GET USER: ' + uuid);
        response.success(res, user);
        return;
    } catch (error) {
        console.error(error.message)
    }
});

// create user
router.post('/', validationMiddleware(createUser) ,async (req, res) => {
    const { name, lastName, email, phone, organization, password } = req.body;
    const userService = await UserService.getInstance();
    const user = await userService.create(name, lastName, email, phone, organization, password);
    console.success('CREATE USER: ' + user.uuid);
    response.success(res, user);
});

// update user
router.put('/:uuid', validationMiddleware(updateUser) ,async (req, res) => {
    try {
        const { uuid } = req.params;
        if (!uuid) {
            return response.error(res, 'Data missing', 400);
        }
        const userService = await UserService.getInstance();
        const { email, name, lastName, phone, organization, password } = req.body;
        const userUpdated = await userService.update(uuid, email, name, lastName, phone, organization, password);
        console.success('User updated: ' + uuid);
        return response.success(res, userUpdated, 200);
    } catch (error) { 
        console.error(error);
        if (error instanceof SequelizeDatabaseError) {
            response.error(res, error.message, 404);
        }
        return response.error(res, error.message, 500);
    }
});

// delete user
router.delete('/:uuid', async (req, res) => {
    try{
        const {uuid} = req.params;
        if(!uuid){
            return response.error(res,"Data Missing",400);
        }
        const userService = await UserService.getInstance();
        const userDeleted = await userService.delete(uuid);
        console.success("User deleted: " + uuid);
        response.success(res, userDeleted);
    }catch(error){
        console.error(error);
        if (error instanceof SequelizeDatabaseError) {
            response.error(res, error.message, 404);
        }
        return response.error(res, error.message, 500);
    }
});

// get reservations by user
router.get('/:uuid/reservations', async (req, res) => {
    try{
        const {uuid} = req.params;
        if(!uuid){
            return response.error(res, "Data missing",400);
        }
        const userSevice = await UserService.getInstance();
        const userReservations = await userSevice.getReservations(uuid);
        if(userReservations===null){
            console.success("User has no reservations");
            response.success(res, 'User has no reservations');
            return;
        }
        console.success("Reservations of: " +  uuid);
        response.success(res, userReservations);
    }catch(error){
        console.log(error);
        if (error instanceof SequelizeDatabaseError) {
            response.error(res, error.message, 404);
        }
        return response.error(res, error.message, 500);
    }

});

module.exports = router;
