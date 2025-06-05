import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app.js';

// Ces tokens JWT doivent correspondre à des utilisateurs réels dans la base api_booking_test
const clientToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImM0Y2U3ODg2LTdkZGYtNGUyYS1iN2EyLWQxMDJhNzJlYjMyZSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzQ3MzQxMDYwLCJleHAiOjE3NDc0Mjc0NjB9.WskVKfRZacKvJvUWpkfdJi8n3ulJG1p18gh9NEVsGpY';

const providerToken = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImNhZTNmZGQ2LWYwOTYtNGE1NC1iZjNhLWQwNTE1M2U2MDg2OCIsInJvbGUiOiJwcm92aWRlciIsImlhdCI6MTc0NzMzODU3NSwiZXhwIjoxNzQ3NDI0OTc1fQ.fUkhOQ_AOSODMKrtvJHM1hrQAh78ETt9PmE5wHFqNwc';

let timeSlotId;
let appointmentId;

test('Créer un créneau libre en DB', async () => {
  const res = await request(app)
    .post('/api/slots')
    .set('Authorization', providerToken)
    .send({
      date: '2025-06-25',
      start_time: '14:00:00',
    });

  assert.equal(res.statusCode, 201, 'Le statut attendu est 201 pour la création de créneau');
  assert.ok(res.body.time_slot?.id, 'L\'ID du créneau doit être défini');
  timeSlotId = res.body.time_slot.id;
});

test('Réserver un rendez-vous', async () => {
  const res = await request(app)
    .post('/api/appointment/book')
    .set('Authorization', clientToken)
    .send({
      time_slot_id: timeSlotId,
      notes: 'Test avec node:test',
    });

  assert.equal(res.statusCode, 201, 'Le statut attendu est 201 pour la réservation');
  assert.ok(res.body.appointment?.id, 'L\'ID du rendez-vous doit être défini');
  appointmentId = res.body.appointment.id;
});

test('Voir mes rendez-vous (client)', async () => {
  const res = await request(app)
    .get('/api/appointment/my')
    .set('Authorization', clientToken);

  assert.equal(res.statusCode, 200, 'Le statut attendu est 200 pour la récupération client');
  assert.ok(Array.isArray(res.body.appointments), 'La réponse doit contenir un tableau de rendez-vous');
});

test('Voir les rendez-vous du provider', async () => {
  const res = await request(app)
    .get('/api/appointment/provider')
    .set('Authorization', providerToken);

  assert.equal(res.statusCode, 200, 'Le statut attendu est 200 pour la récupération provider');
  assert.ok(Array.isArray(res.body.appointments), 'La réponse doit contenir un tableau de rendez-vous');
});

test('Annuler un rendez-vous', async () => {
  const res = await request(app)
    .delete(`/api/appointment/${appointmentId}`)
    .set('Authorization', clientToken);

  assert.equal(res.statusCode, 200, 'Le statut attendu est 200 pour l\'annulation');
  assert.match(res.body.message, /canceled/i, 'Le message doit confirmer l\'annulation');
});
