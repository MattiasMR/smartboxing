# SmartBoxing Rebranding Plan
## Medical System → Generic Physical Space Management

## Terminology Mapping

### Primary Changes
| Old (Medical) | New (Generic) | Scope |
|--------------|---------------|-------|
| Doctors | Staff | Backend, Frontend, DB |
| Appointments | Bookings | Backend, Frontend, DB |
| Patients | Clients | Backend, Frontend, DB |
| Medical | Space Management | UI labels |

### File Structure Changes

#### Backend Handlers
```
backend/src/handlers/
├── doctors/         → staff/
│   ├── create.js    → create.js
│   ├── delete.js    → delete.js
│   ├── get.js       → get.js
│   ├── list.js      → list.js
│   ├── schemas.js   → schemas.js
│   └── update.js    → update.js
├── appointments/    → bookings/
│   ├── create.js    → create.js
│   ├── delete.js    → delete.js
│   ├── get.js       → get.js
│   ├── list.js      → list.js
│   ├── schemas.js   → schemas.js
│   └── update.js    → update.js
└── patients/        → clients/
    ├── create.js    → create.js
    ├── delete.js    → delete.js
    ├── get.js       → get.js
    ├── list.js      → list.js
    ├── schemas.js   → schemas.js
    └── update.js    → update.js
```

#### Frontend Pages & Components
```
frontend/src/
├── pages/
│   ├── DoctorsList.jsx      → StaffList.jsx
│   ├── DoctorForm.jsx       → StaffForm.jsx
│   ├── AppointmentsList.jsx → BookingsList.jsx
│   └── AppointmentForm.jsx  → BookingsForm.jsx
└── components/
    ├── doctors/             → staff/
    └── (appointments refs)  → (bookings refs)
```

### Database Table Names

#### DynamoDB Tables
- `smartboxing-Doctors-{stage}` → `smartboxing-Staff-{stage}`
- `smartboxing-Appointments-{stage}` → `smartboxing-Bookings-{stage}`
- `smartboxing-Patients-{stage}` → `smartboxing-Clients-{stage}`
- `smartboxing-Boxes-{stage}` → **NO CHANGE** (already generic)

### Environment Variables (serverless.yml)

#### Current
```yaml
T_DOCTORS: ${self:service}-Doctors-${sls:stage}
T_APPOINTMENTS: ${self:service}-Appointments-${sls:stage}
T_PATIENTS: ${self:service}-Patients-${sls:stage}
```

#### New
```yaml
T_STAFF: ${self:service}-Staff-${sls:stage}
T_BOOKINGS: ${self:service}-Bookings-${sls:stage}
T_CLIENTS: ${self:service}-Clients-${sls:stage}
```

### API Endpoints

#### Current → New
```
/doctors          → /staff
/doctors/{id}     → /staff/{id}
/appointments     → /bookings
/appointments/{id}→ /bookings/{id}
/patients         → /clients
/patients/{id}    → /clients/{id}
```

### Lambda Function Names

#### Pattern
```
{operation}Doctors     → {operation}Staff
{operation}Appointments→ {operation}Bookings
{operation}Patients    → {operation}Clients
```

#### Examples
```yaml
listDoctors      → listStaff
createDoctor     → createStaff
getDoctor        → getStaff
updateDoctor     → updateStaff
deleteDoctor     → deleteStaff

listAppointments → listBookings
createAppointment→ createBooking
getAppointment   → getBooking
updateAppointment→ updateBooking
deleteAppointment→ deleteBooking

listPatients     → listClients
createPatient    → createClient
getPatient       → getClient
updatePatient    → updateClient
deletePatient    → deleteClient
```

### UI Labels & Text

#### Navigation Menu
```javascript
"Doctores"  → "Personal" / "Staff"
"Citas"     → "Reservas" / "Bookings"
"Pacientes" → "Clientes" / "Clients"
```

#### Form Labels
```javascript
"Nombre del Doctor"    → "Nombre del Staff"
"Especialidad Médica"  → "Especialidad / Rol"
"Horario de Atención"  → "Horario Disponible"
"Datos del Paciente"   → "Datos del Cliente"
"Agendar Cita"         → "Crear Reserva"
```

### Code Search Patterns

#### Files to Update
```bash
# serverless.yml
grep -rn "Doctors\|Appointments\|Patients" serverless.yml

# Backend handlers
grep -rn "Doctor\|Appointment\|Patient" backend/src/handlers/

# Frontend components
grep -rn "Doctor\|Appointment\|Patient" frontend/src/

# Analytics
grep -rn "T_DOCTORS\|T_APPOINTMENTS\|T_PATIENTS" backend/src/handlers/analytics/

# Tests
grep -rn "doctor\|appointment\|patient" backend/src/handlers/__tests__/
```

### Migration Strategy

#### Phase 1: Backend (Non-Breaking)
1. Create new table definitions in serverless.yml (T_STAFF, T_BOOKINGS, T_CLIENTS)
2. Keep old tables active (T_DOCTORS, T_APPOINTMENTS, T_PATIENTS)
3. Create new handler folders (staff/, bookings/, clients/)
4. Copy and rename handlers with new terminology
5. Update environment variable references in new handlers
6. Deploy with both old and new endpoints active

#### Phase 2: Frontend Update
1. Create new pages (StaffList.jsx, BookingsForm.jsx, etc.)
2. Update API client to use new endpoints
3. Update navigation menu
4. Update all UI labels
5. Test with new endpoints

#### Phase 3: Data Migration
1. Create migration script to copy data:
   - Doctors → Staff
   - Appointments → Bookings
   - Patients → Clients
2. Verify data integrity
3. Update all foreign key references

#### Phase 4: Cleanup
1. Remove old endpoints from serverless.yml
2. Delete old handler folders
3. Delete old frontend pages
4. Remove old DynamoDB tables
5. Final deploy

### Rollback Plan
- Keep old endpoints active for 30 days
- Maintain both table sets during transition
- Feature flag to switch between old/new UI

### Testing Checklist
- [ ] All CRUD operations work with new endpoints
- [ ] Analytics dashboard uses new table names
- [ ] Search and filters work correctly
- [ ] Multi-tenant isolation still enforced
- [ ] All tests updated and passing
- [ ] API documentation updated

### Documentation Updates
- [ ] README.md - Update all references
- [ ] ARCHITECTURE.md - Update terminology
- [ ] API documentation - New endpoint paths
- [ ] Swagger/OpenAPI spec - Update schemas

---

## Progress Tracking

### Completed ✅
- [x] Landing page created
- [x] Theme system (5 predefined themes)
- [x] App.jsx routing updated (Landing → Dashboard)
- [x] Logo prominence improved in TopHeader
- [x] Seed script for 100 staff members

### In Progress 🔄
- [ ] Rebranding terminology (backend)
- [ ] Rebranding terminology (frontend)

### Pending ⏳
- [ ] UI/UX improvements
- [ ] Responsive design optimization
- [ ] Deploy and validate
