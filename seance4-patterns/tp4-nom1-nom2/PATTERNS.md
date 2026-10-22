# PATTERNS — TP 4 · parcours Dev

## Tableau des patterns

| Pattern | Problème résolu dans ShopLite | Alternative écartée |
|---|---|---|
| Factory + registre | Ajouter un canal sans modifier la fabrique existante. | Un `switch` aurait obligé à modifier le fichier à chaque canal. |
| Builder | Construire et valider un message avec plusieurs options. | Un constructeur avec plusieurs paramètres serait moins lisible et plus fragile. |
| Adapter | Faire dialoguer deux APIs de transporteurs incompatibles avec un contrat unique. | Modifier les APIs fournies casserait leur contrat et les autres utilisateurs. |
| Decorator | Ajouter retry et cache sans multiplier les adaptateurs. | Copier ces comportements dans chaque transporteur dupliquerait le code. |
| Facade | Exposer une seule opération de choix du meilleur tarif. | Faire gérer les détails des transporteurs à chaque appelant disperserait la logique. |

## Cache et retry

Le cache enveloppe le retry : une panne est d'abord retentée, puis seul un devis obtenu est mémorisé. Dans l'ordre inverse, le cache pourrait conserver une erreur ou un résultat incomplet et empêcher les nouvelles tentatives.
