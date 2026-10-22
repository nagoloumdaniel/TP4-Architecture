import test from 'node:test';
import assert from 'node:assert/strict';
import {
  Channel,
  createChannel,
  EmailChannel,
  registerChannel,
} from './notifications/channels.js';
import './notifications/slack.js';
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { CachedQuote, RetryQuote } from './shipping/decorators.js';
import { ShippingService } from './shipping/ShippingService.js';
import { ColissimoApi, DhlClient } from '../tp4/carrierApis.js';

test('Factory crée les canaux et refuse les types inconnus', () => {
  assert.ok(createChannel('email') instanceof EmailChannel);
  assert.match(createChannel('sms').send({ to: '06', body: 'ok' }), /^\[SMS/);
  assert.match(createChannel('push').send({ to: 'app', body: 'ok' }), /^\[PUSH/);
  assert.match(createChannel('slack').send({ to: 'ops', body: 'ok' }), /^\[SLACK/);
  assert.throws(() => createChannel('fax'), /Canal inconnu : fax/);
});

test('Factory refuse une classe qui ne respecte pas le contrat', () => {
  assert.throws(() => registerChannel('bad', class {}), /doit hériter/);
  assert.throws(() => new Channel().send({}), /abstraite/);
});

test('Builder construit un message immuable et valide au build', () => {
  const message = new MessageBuilder()
    .to('alice@exemple.fr')
    .template('Bonjour {{nom}}, votre colis part avec {{transporteur}}.')
    .with('nom', 'Alice')
    .with('transporteur', 'Colissimo')
    .priority('haute')
    .build();

  assert.deepEqual(message, {
    to: 'alice@exemple.fr',
    body: 'Bonjour Alice, votre colis part avec Colissimo.',
    priority: 'haute',
  });
  assert.ok(Object.isFrozen(message));
  assert.throws(() => new MessageBuilder().template('ok').build(), /Destinataire obligatoire/);
  assert.throws(() => new MessageBuilder().to('a').build(), /Gabarit obligatoire/);
  assert.throws(() => new MessageBuilder().to('a').template('ok').priority('urgente').build(), /Priorité invalide/);
  assert.throws(() => new MessageBuilder().to('a').template('{{nom}}').build(), /Variable manquante : nom/);
});

test('Adapters unifient les APIs des transporteurs', async () => {
  assert.deepEqual(await new ColissimoAdapter(new ColissimoApi()).getQuote({ weightKg: 2, zip: '75011' }), {
    carrier: 'Colissimo',
    price: 9.95,
    days: 2,
  });
  assert.deepEqual(await new DhlAdapter(new DhlClient()).getQuote({ weightKg: 2, zip: '75011' }), {
    carrier: 'DHL',
    price: 11,
    days: 1,
  });
});

test('Retry réessaie jusqu au succès ou relance la dernière erreur', async () => {
  const client = new DhlClient({ failFirst: 2 });
  const quote = await new RetryQuote(new DhlAdapter(client), { attempts: 3 }).getQuote({ weightKg: 2, zip: '75011' });
  assert.equal(quote.carrier, 'DHL');
  assert.equal(client.calls, 3);
  await assert.rejects(
    new RetryQuote(new DhlAdapter(new DhlClient({ failFirst: 3 }))).getQuote({ weightKg: 2, zip: '75011' }),
    /503 Service Unavailable/,
  );
});

test('Cache évite un appel puis expire', async () => {
  let now = 0;
  const client = new DhlClient();
  const quote = new CachedQuote(new DhlAdapter(client), { ttlMs: 100, now: () => now });
  await quote.getQuote({ weightKg: 2, zip: '75011' });
  await quote.getQuote({ weightKg: 2, zip: '75011' });
  assert.equal(client.calls, 1);
  now = 101;
  await quote.getQuote({ weightKg: 2, zip: '75011' });
  assert.equal(client.calls, 2);
});

test('Facade choisit le prix puis le délai et ignore les pannes', async () => {
  const shipping = new ShippingService([
    new ColissimoAdapter(),
    new RetryQuote(new DhlAdapter(new DhlClient({ failFirst: 3 }))),
  ]);
  assert.equal((await shipping.bestQuote({ weightKg: 2, zip: '75011' })).carrier, 'Colissimo');
  assert.equal((await new ShippingService([new ColissimoAdapter(), new DhlAdapter()]).bestQuote({ weightKg: 10, zip: '75011' })).carrier, 'DHL');
  await assert.rejects(new ShippingService([]).bestQuote({ weightKg: 2, zip: '75011' }), /Aucun transporteur disponible/);
});
