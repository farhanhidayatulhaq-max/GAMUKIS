const express = require('express');
const CharacterModel = require('../models/characterModel');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');

const router = express.Router();
const MembershipModel = require('../models/membershipModel');
// Batas karakter mengikuti paket membership (fallback ke MAX_CHARACTERS_PER_USER).
const getMaxCharacters = async (account) =>
  (await MembershipModel.getEffective(account)).features.maxCharacters ?? CharacterModel.MAX_CHARACTERS_PER_USER;
const MAX_DATA_BYTES = 20 * 1024;

router.use(authenticateAny, requirePermission('characters:own'));

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validateName = (value) => {
  const name = String(value ?? '').trim();
  return name.length >= 2 && name.length <= 50 ? name : null;
};

const validateData = (value) => {
  if (value === undefined) return { ok: true, value: undefined };
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return { ok: false };
  if (Buffer.byteLength(JSON.stringify(value)) > MAX_DATA_BYTES) return { ok: false };
  return { ok: true, value };
};

// Daftar karakter milik user yang sedang login
router.get('/', async (req, res) => {
  try {
    res.json({ characters: await CharacterModel.list(req.account.ownerKey), max: await getMaxCharacters(req.account) });
  } catch (error) {
    console.error('List characters error:', error);
    res.status(500).json({ message: 'Gagal mengambil karakter.' });
  }
});

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID karakter tidak valid.' });
  try {
    const character = await CharacterModel.findOne(req.account.ownerKey, id);
    if (!character) return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    res.json({ character });
  } catch (error) {
    console.error('Get character error:', error);
    res.status(500).json({ message: 'Gagal mengambil karakter.' });
  }
});

// Buat karakter baru. Body: { name, data: { ...apapun: skin, kelas, warna, dll } }
router.post('/', async (req, res) => {
  const name = validateName(req.body?.name);
  if (!name) return res.status(400).json({ message: 'Nama karakter wajib diisi (2-50 karakter).' });
  const data = validateData(req.body?.data);
  if (!data.ok) {
    return res.status(400).json({ message: 'Data karakter harus berupa objek JSON maksimal 20KB.' });
  }

  try {
    const maxCharacters = await getMaxCharacters(req.account);
    if ((await CharacterModel.count(req.account.ownerKey)) >= maxCharacters) {
      return res.status(409).json({ message: `Maksimal ${maxCharacters} karakter untuk paket Anda.` });
    }
    const character = await CharacterModel.create(req.account, { name, data: data.value });
    res.status(201).json({ message: 'Karakter berhasil disimpan.', character });
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ message: 'Karakter gagal disimpan.' });
  }
});

router.put('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID karakter tidak valid.' });

  let name;
  if (req.body?.name !== undefined) {
    name = validateName(req.body.name);
    if (!name) return res.status(400).json({ message: 'Nama karakter wajib diisi (2-50 karakter).' });
  }
  const data = validateData(req.body?.data);
  if (!data.ok) {
    return res.status(400).json({ message: 'Data karakter harus berupa objek JSON maksimal 20KB.' });
  }

  try {
    const character = await CharacterModel.update(req.account.ownerKey, id, { name, data: data.value });
    if (!character) return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    res.json({ message: 'Karakter berhasil diperbarui.', character });
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ message: 'Karakter gagal diperbarui.' });
  }
});

// Pilih karakter aktif
router.patch('/:id/active', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID karakter tidak valid.' });
  try {
    const character = await CharacterModel.setActive(req.account.ownerKey, id);
    if (!character) return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    res.json({ message: 'Karakter aktif diperbarui.', character });
  } catch (error) {
    console.error('Set active character error:', error);
    res.status(500).json({ message: 'Gagal mengubah karakter aktif.' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id);
  if (!id) return res.status(400).json({ message: 'ID karakter tidak valid.' });
  try {
    if (!(await CharacterModel.remove(req.account.ownerKey, id))) {
      return res.status(404).json({ message: 'Karakter tidak ditemukan.' });
    }
    res.json({ success: true, message: 'Karakter dihapus.' });
  } catch (error) {
    console.error('Delete character error:', error);
    res.status(500).json({ message: 'Karakter gagal dihapus.' });
  }
});

module.exports = router;
