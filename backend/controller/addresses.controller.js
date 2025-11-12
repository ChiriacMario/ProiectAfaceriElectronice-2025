// src/controllers/addresses.controller.js

export const listAddresses = async (req, res) => {
  const rows = await prisma.address.findMany({
    where: { userId: req.user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }]
  });
  res.json(rows);
};

export const createAddress = async (req, res) => {
  const { label, line1, line2, city, region, postalCode, country = "RO", isDefault = false } = req.body;
  if (!line1 || !city) return res.status(400).json({ mesaj: "line1 și city sunt obligatorii." });

  const created = await prisma.$transaction(async (tx) => {
    if (isDefault) {
      await tx.address.updateMany({ where: { userId: req.user.id, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.create({
      data: { userId: req.user.id, label: label || null, line1, line2: line2 || null, city, region: region || null, postalCode: postalCode || null, country, isDefault: !!isDefault }
    });
  });

  res.status(201).json(created);
};

export const setDefault = async (req, res) => {
  const id = Number(req.params.id);
  const adr = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
  if (!adr) return res.status(404).json({ mesaj: "Adresă inexistentă." });

  await prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId: req.user.id, isDefault: true }, data: { isDefault: false } });
    await tx.address.update({ where: { id }, data: { isDefault: true } });
  });
  res.json({ mesaj: "Adresă setată ca implicită." });
};

export const updateAddress = async (req, res) => {
  const id = Number(req.params.id);
  const { label, line1, line2, city, region, postalCode, country, isDefault } = req.body;
  const adr = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
  if (!adr) return res.status(404).json({ mesaj: "Adresă inexistentă." });

  const upd = await prisma.$transaction(async (tx) => {
    if (isDefault === true) {
      await tx.address.updateMany({ where: { userId: req.user.id, isDefault: true }, data: { isDefault: false } });
    }
    return tx.address.update({
      where: { id },
      data: {
        ...(label !== undefined && { label }),
        ...(line1 !== undefined && { line1 }),
        ...(line2 !== undefined && { line2 }),
        ...(city !== undefined && { city }),
        ...(region !== undefined && { region }),
        ...(postalCode !== undefined && { postalCode }),
        ...(country !== undefined && { country }),
        ...(isDefault !== undefined && { isDefault: !!isDefault }),
      }
    });
  });

  res.json(upd);
};

export const deleteAddress = async (req, res) => {
  const id = Number(req.params.id);
  const adr = await prisma.address.findFirst({ where: { id, userId: req.user.id } });
  if (!adr) return res.status(404).json({ mesaj: "Adresă inexistentă." });
  await prisma.address.delete({ where: { id } });
  res.status(204).send();
};

export default router;