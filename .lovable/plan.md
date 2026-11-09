# Gestion des pharmacies dans l’administration

- Ajouter un onglet « Gestion des gardes & numéros » à côté de « Demandes ».
- Afficher Dakar par défaut, avec choix d’une autre ville ou de toutes les villes, et recherche par nom ou ville.
- Présenter les pharmacies réelles avec nom, adresse, ville, téléphone et horaires.
- Permettre aux administrateurs de désactiver une garde immédiatement. Pour activer une garde, demander la référence d’une publication vérifiée et sa période de validité : aucune garde inventée ni activation automatique sans calendrier identifié.
- Le statut peut être désactivé manuellement à tout moment et expire à la fin de la période publiée, pour ne pas afficher une garde périmée.
- Enregistrer téléphone et horaires, en validant les numéros au format Sénégal (+221 et neuf chiffres), ou en laissant le téléphone vide.
- Actualiser les résultats publics après modification et vérifier les filtres « De garde » depuis l’accueil et la liste.

## Détails techniques
- Enregistrer la référence et les dates de la publication de garde. Ajouter une autorisation de mise à jour limitée aux champs garde, téléphone et horaires, contrôlée en base par le rôle administrateur.
- Rechercher en base avec un nombre de résultats limité ; conserver les coordonnées GPS et les droits actuels des pharmaciens.
- Invalider les caches concernés après chaque enregistrement et rafraîchir régulièrement les listes publiques ouvertes.
- Tester les droits, la recherche Dakar par défaut et les mises à jour ; vérifier l’interface mobile et ordinateur avec un compte administrateur autorisé.

## Source des gardes
- L’ARP publie un arrêté sur l’organisation des gardes, mais cette publication n’est pas un calendrier des officines de garde.
- Aucun calendrier officiel exploitable n’a encore été vérifié ; la première version permet la saisie administrative à partir d’une publication vérifiée, sans prétendre à une synchronisation officielle automatique.
- Une synchronisation automatique nécessite ensuite une source de calendriers identifiée et vérifiée.