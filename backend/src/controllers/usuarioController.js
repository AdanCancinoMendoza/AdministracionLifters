import { Usuario } from "../models/usuarioModel.js";

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.getAll();
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const crearUsuario = async (req, res) => {
  try {
    const { nombre, correo } = req.body;
    const id = await Usuario.create(nombre, correo);
    res.json({ id, mensaje: "Usuario creado correctamente" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
