export class Channel {
  send() {
    throw new Error('Méthode abstraite');
  }
}

export class EmailChannel extends Channel {
  send({ to, body }) {
    return `[EMAIL → ${to}] ${body}`;
  }
}

export class SmsChannel extends Channel {
  send({ to, body }) {
    return `[SMS → ${to}] ${body.slice(0, 160)}`;
  }
}

export class PushChannel extends Channel {
  send({ to, body }) {
    return `[PUSH → ${to}] ${body}`;
  }
}

const channels = new Map([
  ['email', EmailChannel],
  ['sms', SmsChannel],
  ['push', PushChannel],
]);

export function registerChannel(type, ChannelClass) {
  if (!(ChannelClass.prototype instanceof Channel)) {
    throw new Error('La classe doit hériter de Channel');
  }
  channels.set(type, ChannelClass);
}

export function createChannel(type) {
  const ChannelClass = channels.get(type);
  if (!ChannelClass) throw new Error(`Canal inconnu : ${type}`);
  return new ChannelClass();
}
