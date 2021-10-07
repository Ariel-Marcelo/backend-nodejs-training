const express = require('express');
const router = express.Router();
const yup = require('yup');

const UserService = require('../services/User.service');
const Console = require('../lib/Console');
const Response = require('../lib/Response');

const console = new Console('USER-CONTROLLER');
const response = new Response();

const createUserSchema = yup.object({
    body: yup.object({
        name: yup.string().required('Name is required'),
        lastName: yup.string().required('Last Name is required'),
        email: yup.string().email().required('Email is not correct'),
        phone: yup.string().min(10).max(10).required('Phone format is not correct'),
        organization: yup.string().required('Organization is required'),
        password: yup.string().min(8).max(20).required('Password is not secure')
    })
});

const validationMiddleware = (schema) =>  async (req, res, next) => {
    try {
        await schema.validate({
            body: req.body
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
    const userService = await UserService.getInstance();
    const users = await userService.getAll();
    console.success('GET ALL USERS');
    response.success(res, users);
});

// get user by uuid
router.get('/:uuid', async (req, res) => {
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
});

// create user
router.post('/', validationMiddleware(createUserSchema) ,async (req, res) => {
    const { name, lastName, email, phone, organization, password } = req.body;
    const userService = await UserService.getInstance();
    const user = await userService.create(name, lastName, email, phone, organization, password);
    console.success('CREATE USER: ' + user.uuid);
    response.success(res, user);
});

// update user
router.put('/:uuid', async (req, res) => {
    try {
        const { uuid } = req.params;
        if (!uuid) {
            return response.error(res, 'Data missing', 400);
        }
        const userService = await UserService.getInstance();
        const { email, name, lastName, phone, organization, password } = req.body;
        await userService.update(uuid, email, name, lastName, phone, organization, password);
        console.success('User updated: ' + uuid);
        return response.success(res, 'User updated', 200);
    } catch (error) {
        console.error(error);
        if (err instanceof SequelizeDatabaseError) {
            response.error(res, err.message, 404);
        }
        return response.error(res, error.message, 500);
    }
});

// delete user
router.delete('/:uuid', (req, res) => {});

// get reservations by user
router.get('/:uuid/reservations', (req, res) => {});

module.exports = router;
