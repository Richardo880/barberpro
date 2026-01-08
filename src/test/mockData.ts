// Valid CUID-like IDs for testing
export const mockUser = {
  id: "clrxyz1234567890abcdef01",
  name: "Juan Pérez",
  email: "juan@test.com",
  role: "CLIENT" as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockAdmin = {
  id: "clrxyz1234567890abcdef02",
  name: "Admin User",
  email: "admin@barberpro.com",
  role: "ADMIN" as const,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockServices = [
  {
    id: "clrxyz1234567890abcdef03",
    name: "Corte de cabello",
    description: "Corte tradicional con tijera y máquina",
    duration: 30,
    price: 50000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "clrxyz1234567890abcdef04",
    name: "Corte + Barba",
    description: "Corte completo con arreglo de barba",
    duration: 45,
    price: 75000,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockStaff = [
  {
    id: "clrxyz1234567890abcdef05",
    name: "Carlos López",
    email: "carlos@barberpro.com",
    bio: "Barbero profesional con 10 años de experiencia",
    photoUrl: null,
    services: mockServices,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "clrxyz1234567890abcdef06",
    name: "Pedro García",
    email: "pedro@barberpro.com",
    bio: "Especialista en cortes modernos",
    photoUrl: null,
    services: [mockServices[0]],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockAppointment = {
  id: "clrxyz1234567890abcdef07",
  clientId: mockUser.id,
  serviceId: mockServices[0].id,
  staffId: mockStaff[0].id,
  startTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  endTime: new Date(Date.now() + 86400000 + 1800000).toISOString(),
  status: "PENDING" as const,
  clientNotes: "Corte degradado",
  staffNotes: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  client: mockUser,
  service: mockServices[0],
  staff: mockStaff[0],
};

export const mockAvailableSlots = {
  slots: [
    { time: "09:00", available: true },
    { time: "09:30", available: true },
    { time: "10:00", available: false },
    { time: "10:30", available: true },
    { time: "11:00", available: true },
    { time: "11:30", available: true },
    { time: "12:00", available: false },
    { time: "12:30", available: true },
    { time: "13:00", available: true },
  ],
};
