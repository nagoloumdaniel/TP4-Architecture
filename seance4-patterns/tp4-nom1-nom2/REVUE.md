# Revue croisée

- Le canal Slack est ajouté par import et enregistrement, sans toucher à `channels.js`.
- Les erreurs du Builder sont regroupées dans `build()`, ce qui laisse les étapes de construction fluides.
- Les décorateurs exposent tous deux `getQuote(parcel)`, donc ils peuvent être combinés.
- La façade utilise `Promise.allSettled` : une panne isolée n'empêche pas de choisir parmi les transporteurs disponibles.
