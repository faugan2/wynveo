const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const admins = [
  {
    id: 'a1',
    email: 'admin@wynveo.com',
    role: 'super',
    createdAt: new Date(Date.now() - 180 * 24 * 60_000),
    createdBy: null,
  },
  {
    id: 'a2',
    email: 'finance@wynveo.com',
    role: 'finance',
    createdAt: new Date(Date.now() - 120 * 24 * 60_000),
    createdBy: 'a1',
  },
  {
    id: 'a3',
    email: 'support@wynveo.com',
    role: 'support',
    createdAt: new Date(Date.now() - 90 * 24 * 60_000),
    createdBy: 'a1',
  },
];

export async function listAdmins() {
  await delay();
  return admins.map((a) => ({ ...a }));
}

export async function createAdmin(admin, { email, role }) {
  await delay(600);
  if (!['super', 'finance', 'support', 'trader'].includes(role)) {
    throw new Error(`Rôle invalide: ${role}`);
  }
  if (admins.find((a) => a.email === email)) {
    throw new Error('Un admin avec cet e-mail existe déjà.');
  }
  const newAdmin = {
    id: `a${Math.random().toString(36).slice(2, 6)}`,
    email,
    role,
    createdAt: new Date(),
    createdBy: admin.uid,
  };
  admins.push(newAdmin);
  return { ...newAdmin };
}

export async function deleteAdmin(admin, adminId) {
  await delay(600);
  const idx = admins.findIndex((a) => a.id === adminId);
  if (idx === -1) {
    throw new Error('Admin non trouvé.');
  }
  admins.splice(idx, 1);
}

export async function updateAdminRole(admin, adminId, newRole) {
  await delay(500);
  const target = admins.find((a) => a.id === adminId);
  if (!target) {
    throw new Error('Admin non trouvé.');
  }
  if (!['super', 'finance', 'support', 'trader'].includes(newRole)) {
    throw new Error(`Rôle invalide: ${newRole}`);
  }
  target.role = newRole;
}
