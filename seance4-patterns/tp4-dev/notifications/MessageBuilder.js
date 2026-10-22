export class MessageBuilder {
  constructor() {
    this.values = {};
  }

  to(recipient) {
    this.values.to = recipient;
    return this;
  }

  template(template) {
    this.values.template = template;
    return this;
  }

  with(name, value) {
    this.values[name] = value;
    return this;
  }

  priority(priority) {
    this.values.priority = priority;
    return this;
  }

  build() {
    const { to, template, priority = 'normale' } = this.values;
    if (!to) throw new Error('Destinataire obligatoire');
    if (!template) throw new Error('Gabarit obligatoire');
    if (!['basse', 'normale', 'haute'].includes(priority)) {
      throw new Error(`Priorité invalide : ${priority}`);
    }

    const body = template.replace(/\{\{(\w+)\}\}/g, (match, name) => {
      if (!(name in this.values)) throw new Error(`Variable manquante : ${name}`);
      return this.values[name];
    });

    if (/\{\{(\w+)\}\}/.test(body)) {
      throw new Error(`Variable manquante : ${body.match(/\{\{(\w+)\}\}/)[1]}`);
    }

    return Object.freeze({ to, body, priority });
  }
}
