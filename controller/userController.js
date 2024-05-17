const bcrypt = require('bcrypt');
const UserModel = require('../models').User;
const { tokenSign } = require('../config/jwToken');
const {
    handleHttpError, handleErrorResponse,
} = require("../utils/handleError");

const getUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByPk(id);
        if (!user) {
            handleErrorResponse(res, ` No existe un usuario con el id ${id}`, 401);
            return;
        }
        res.json({ user });
    } catch (e) {
        handleHttpError(res, e);
    }
}

const getUsers = async (req, res) => {
    const users = await UserModel.findAll();
    res.json({ users });
}


const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { name_user, email, password } = req.body;
        const user = await UserModel.findByPk(id);
        if (!user) {
            handleErrorResponse(res, `No existe un usuario con el id ${id}`, 401);
            return;
        }
        if (!user.isActive) {
            handleErrorResponse(res, `El usuario con el id ${id} no está activo, no se puede actualizar`, 401);
            return;
          }
        if (name_user) user.name_user = name_user;
        if (email) user.email = email;
        if (password) {
            user.password = await bcrypt.hash(password, 10);
        }
        await user.save();
        res.json({
            msg: 'Usuario actualizado.',
            data: user,
        });
    } catch (e) {
        handleHttpError(res, e);
    }
};


const createUser = async (req, res) => {
    try {
        const { body } = req;
        console.log(body)
        const existEmail = await UserModel.findOne({ where: { email: body.email } });
        if (existEmail) {
            handleErrorResponse(res, `Ya existe un usuario con el email ${body.email}`, 401);
            return;
        }
        const hashedPassword = await bcrypt.hash(body.password, 10);
        const newUser = await UserModel.create({
            name_user: body.name_user,
            email: body.email,
            password: hashedPassword,
            id_role: body.id_role,
        });
        res.json(newUser);
    } catch (error) {
        handleHttpError(res, error);
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email)
        console.log(password)
        const user = await UserModel.findOne({ where: { email: email } });
        if (!user) {
            return res.status(404).json({
                msg: 'Usuario no encontrado.'
            });
        } else {
            const passwordMatch = await bcrypt.compare(password, user.password);
            const tokenSession = await tokenSign(user);
            if (passwordMatch) {
                res.json({
                    msg: 'Inicio de sesión exitoso.',
                    tokenSession
                });
                return;
            } else {
                return res.status(404).json({
                    msg: 'Credenciales incorrectas.'
                });
            }
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Comuníquese con el administrador'
        });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UserModel.findByPk(id);
        if (!user) {
            handleErrorResponse(res, ` No existe un usuario con el id ${id}`, 401);
            return;
        }
        user.isActive = false;
        await user.save();
        res.json({
            msg: 'Usuario desactivado.',
            data: user,
        });
    } catch (e) {
        handleHttpError(res, e);
    }
};


module.exports = {
    getUser,
    getUsers,
    updateUser,
    createUser,
    loginUser,
    deleteUser,
}