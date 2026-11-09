# Gestion des pharmacies dans l’administration

- Ajouter un onglet « Pharmacies » à côté de « Demandes ».
- Afficher Dakar par défaut, avec choix d’une autre ville ou de toutes les villes, et recherche par nom ou ville.
- Présenter les pharmacies réelles avec nom, adresse, ville, téléphone et horaires.
- Permettre aux administrateurs d’activer ou désactiver la garde immédiatement, et d’enregistrer téléphone et horaires.
- Actualiser les résultats publics après modification et vérifier les filtres « De garde » depuis l’accueil et la liste.

## Détails techniques
- Ajouter une autorisation de mise à jour limitée aux champs garde, téléphone et horaires, contrôlée en base par le rôle administrateur.
- Rechercher en base avec un nombre de résultats limité ; conserver les coordonnées GPS et les droits actuels des pharmaciens.
- Invalider les caches concernés après chaque enregistrement et rafraîchir régulièrement les listes publiques ouvertes.
- Tester les droits, la recherche Dakar par défaut et les mises à jour ; vérifier l’interface mobile et ordinateur avec un compte administrateur autorisé.