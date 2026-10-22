import { createChannel } from './notifications/channels.js';
import './notifications/slack.js';
import { MessageBuilder } from './notifications/MessageBuilder.js';
import { ColissimoAdapter, DhlAdapter } from './shipping/adapters.js';
import { CachedQuote, RetryQuote } from './shipping/decorators.js';
import { ShippingService } from './shipping/ShippingService.js';
import { DhlClient } from '../tp4/carrierApis.js';

const email = createChannel('email');
const slack = createChannel('slack');
const shipping = new ShippingService([
  new CachedQuote(new ColissimoAdapter()),
  new CachedQuote(new RetryQuote(new DhlAdapter(new DhlClient({ failFirst: 1 })))),
]);

for (const weightKg of [2, 10]) {
  const quote = await shipping.bestQuote({ weightKg, zip: '75011' });
  const message = new MessageBuilder()
    .to('alice@exemple.fr')
    .template(`Bonjour Alice, votre colis de ${weightKg} kg part avec {{transporteur}} ({{prix}} €).`)
    .with('transporteur', quote.carrier)
    .with('prix', quote.price.toFixed(2))
    .build();
  console.log(email.send(message));
}

console.log(slack.send({ to: 'logistique', body: 'Tarifs mis à jour' }));
